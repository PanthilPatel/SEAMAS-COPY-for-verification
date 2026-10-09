import asyncio
import time
from typing import Dict, Any, AsyncGenerator, Optional
from utils.agent_tracker import log_pipeline_start, log_pipeline_complete


def extract_intent_and_constraints(query: str, explicit_budget: Optional[float] = None) -> Dict[str, Any]:
    """
    Stage 1: Extracts category, budget, budget_type, and user constraints from raw query.
    If an explicit budget is supplied (e.g., from UI max_price), it takes precedence over query parsing.
    Enables early constraint awareness before the search and research stages run.
    """
    q = query.lower()

    # 1. Category Classification
    if any(k in q for k in ["laptop", "notebook", "macbook", "thinkpad", "ideapad", "zenbook", "gaming laptop", "pc", "chromebook"]):
        category = "laptops"
    elif any(k in q for k in ["phone", "smartphone", "iphone", "galaxy", "redmi", "oneplus", "realme", "pixel", "poco", "vivo", "oppo", "moto", "motorola"]):
        category = "smartphones"
    elif any(k in q for k in ["headphone", "earphone", "earbuds", "tws", "airpods", "neckband", "soundbar", "speaker"]):
        category = "audio"
    elif any(k in q for k in ["watch", "smartwatch", "fitness band", "band", "tracker"]):
        category = "wearables"
    elif any(k in q for k in ["tv", "television", "oled", "qled", "monitor"]):
        category = "televisions"
    else:
        category = "general"

    # 2. Budget Extraction (Hard Limit vs Approximate Budget)
    from agents.budget_advisor_agent import parse_budget_intent
    budget_info = parse_budget_intent(query)
    
    if explicit_budget is not None and explicit_budget > 0:
        ceiling = int(explicit_budget)
        budget_type = "hard_limit"
        budget_info = {
            "ceiling": ceiling,
            "budget_type": "hard_limit",
            "status": f"User-defined budget ceiling locked at ₹{ceiling:,}",
            "tolerance_pct": 0.0,
        }
    else:
        ceiling = budget_info.get("ceiling")
        budget_type = budget_info.get("budget_type", "none")
        if budget_type not in ("hard_limit", "approximate", "none"):
            budget_type = "none"

    # 3. User Preference / Feature Tagging
    preferences: Dict[str, Any] = {}
    for feature in ["5g", "amoled", "oled", "gaming", "camera", "battery", "lightweight", "anc", "wireless"]:
        if feature in q:
            preferences[feature] = True

    return {
        "category": category,
        "budget": ceiling,
        "budget_type": budget_type,
        "user_preferences": preferences,
        "budget_status": budget_info,
    }


async def orchestrator_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 1 Orchestrator Node in LangGraph.
    Acts as the single graph entry point, extracting user intent, category, and budget constraints.
    Preserves UI-supplied explicit budget (max_price) if present in state.
    Writes strictly to its owned state keys: category, budget, budget_type, user_preferences, budget_status.
    """
    query = state.get("query", "")
    existing_budget = state.get("budget")
    intent_data = extract_intent_and_constraints(query, explicit_budget=existing_budget)

    log_msg = (
        f"Orchestrator Stage 1: Category='{intent_data['category']}', "
        f"Budget={intent_data['budget']} ({intent_data['budget_type']})"
    )

    return {
        "category": intent_data["category"],
        "budget": intent_data["budget"],
        "budget_type": intent_data["budget_type"],
        "user_preferences": intent_data["user_preferences"],
        "budget_status": intent_data["budget_status"],
        "logs": [log_msg],
    }


async def run_orchestrator_pipeline(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the central LangGraph multi-agent workflow synchronously.
    LangGraph is the SINGLE SOURCE OF TRUTH for agent coordination.
    """
    from graph.graph import seamas_graph

    start_time = time.time()
    query = initial_state.get("query", "")
    steering = initial_state.get("steering_mode", "balanced")

    log_pipeline_start(query, steering)

    state = initial_state.copy()
    state.setdefault("logs", [])
    state.setdefault("category", "general")
    state.setdefault("user_preferences", {})
    state.setdefault("errors", [])

    final_state = await seamas_graph.ainvoke(state)

    total_time = time.time() - start_time
    valid_deals = len(final_state.get("price_data", []))
    log_pipeline_complete(query, total_time, valid_deals)

    return final_state


async def stream_orchestrator_pipeline(initial_state: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Asynchronously streams real-time execution events directly from LangGraph.
    Emits SSE events in lockstep with genuine LangGraph node transitions:
    - {"type": "node_start", "agent_id": "<id>"}
    - {"type": "node_complete", "agent_id": "<id>"}
    - {"type": "node_error", "agent_id": "<id>", "message": "<msg>"}
    - {"type": "result", "payload": <final_state>}

    Guarantees that LangGraph remains the sole authoritative workflow engine.
    """
    from graph.graph import seamas_graph, graph_stream_queue

    start_time = time.time()
    query = initial_state.get("query", "")
    steering = initial_state.get("steering_mode", "balanced")

    log_pipeline_start(query, steering)

    state = initial_state.copy()
    state.setdefault("logs", [])
    state.setdefault("category", "general")
    state.setdefault("user_preferences", {})
    state.setdefault("errors", [])

    queue: asyncio.Queue = asyncio.Queue()
    token = graph_stream_queue.set(queue)
    final_res: Dict[str, Any] = {}

    async def _run_graph():
        try:
            res = await seamas_graph.ainvoke(state)
            final_res.update(res)
            await queue.put({"type": "result", "payload": res})
        except Exception as e:
            await queue.put({"type": "error", "message": str(e)})
        finally:
            await queue.put(None)  # Sentinel to indicate completion

    graph_task = asyncio.create_task(_run_graph())

    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            yield event

        # Await task to ensure proper exception propagation if any
        await graph_task

        total_time = time.time() - start_time
        valid_deals = len(final_res.get("price_data", []))
        log_pipeline_complete(query, total_time, valid_deals)

    except (asyncio.CancelledError, GeneratorExit):
        # Handle client disconnect / premature stream closure
        if not graph_task.done():
            graph_task.cancel()
        raise
    finally:
        if not graph_task.done():
            graph_task.cancel()
            try:
                await graph_task
            except (asyncio.CancelledError, Exception):
                pass
        graph_stream_queue.reset(token)