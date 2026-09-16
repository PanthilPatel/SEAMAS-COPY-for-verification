import asyncio
import time
from typing import Dict, Any, AsyncGenerator

from agents.search_agent import search_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.budget_advisor_agent import budget_advisor_agent
from agents.recommendation import recommendation_agent
from agents.finalizer_agent import finalizer_agent
from utils.agent_tracker import (
    log_pipeline_start,
    log_agent_start,
    log_agent_complete,
    log_agent_error,
    log_parallel_phase_start,
    log_pipeline_complete,
)


async def run_orchestrator_pipeline(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Explicit Central Orchestrator Pipeline with real-time terminal tracking.
    Coordinates sequential search -> parallel analysis -> recommendation -> finalizer.
    """
    start_time = time.time()
    query = initial_state.get("query", "")
    steering = initial_state.get("steering_mode", "balanced")
    
    log_pipeline_start(query, steering)
    state = initial_state.copy()
    state.setdefault("logs", [])

    # Step 1: Search Agent
    t0 = time.time()
    log_agent_start("search", f"Searching marketplaces for '{query}'...")
    try:
        search_response = await search_agent(state)
        state["search_results"] = search_response.get("search_results", [])
        state["logs"].extend(search_response.get("logs", []))
        dur = time.time() - t0
        count = len(state["search_results"])
        log_agent_complete("search", f"Found {count} candidate marketplace records", dur)
    except Exception as e:
        dur = time.time() - t0
        log_agent_error("search", str(e), dur)
        state["logs"].append(f"Orchestrator error routing to Search Agent: {str(e)}")
        state["search_results"] = []

    # Step 2: Parallel Stage (Budget, Price, Reviews)
    log_parallel_phase_start(["budget", "price", "reviews"])
    log_agent_start("budget", "Parsing financial ceilings & constraints...")
    log_agent_start("price", "Cross-checking price history & live storefronts...")
    log_agent_start("reviews", "Distilling customer reviews & sentiment...")

    async def _wrap_budget():
        tb = time.time()
        res = await budget_advisor_agent(state)
        db = time.time() - tb
        ceiling = res.get("budget_status", {}).get("ceiling")
        msg = f"Locked ceiling: ₹{ceiling:,}" if ceiling else "No budget ceiling specified"
        log_agent_complete("budget", msg, db)
        return ("budget", res)

    async def _wrap_price():
        tp = time.time()
        res = await price_comparison_agent(state)
        dp = time.time() - tp
        p_count = len(res.get("price_data", []))
        log_agent_complete("price", f"Processed {p_count} verified price entries", dp)
        return ("price", res)

    async def _wrap_reviews():
        tr = time.time()
        res = await review_analyzer_agent(state)
        dr = time.time() - tr
        log_agent_complete("reviews", "Market sentiment & pros/cons synthesized", dr)
        return ("reviews", res)

    try:
        results = await asyncio.gather(_wrap_budget(), _wrap_price(), _wrap_reviews(), return_exceptions=True)
        for item in results:
            if isinstance(item, Exception):
                state["logs"].append(f"Orchestrator error during parallel execution: {item}")
                continue
            agent_key, res = item
            if agent_key == "budget":
                state["budget_status"] = res.get("budget_status", {})
            elif agent_key == "price":
                state["price_data"] = res.get("price_data", [])
            elif agent_key == "reviews":
                state["analysis_report"] = res.get("analysis_report", {})
            state["logs"].extend(res.get("logs", []))
    except Exception as e:
        log_agent_error("parallel", str(e), 0.0)
        state["logs"].append(f"Parallel execution exception: {str(e)}")

    # Step 3: Recommendation Agent
    t_rec = time.time()
    log_agent_start("recommendation", "Ranking candidates against intent & value...")
    try:
        recommendation_response = await recommendation_agent(state)
        state["recommendations"] = recommendation_response.get("recommendations", [])
        state["logs"].extend(recommendation_response.get("logs", []))
        dur_rec = time.time() - t_rec
        log_agent_complete("recommendation", f"Formulated {len(state['recommendations'])} recommendation insights", dur_rec)
    except Exception as e:
        dur_rec = time.time() - t_rec
        log_agent_error("recommendation", str(e), dur_rec)
        state["logs"].append(f"Orchestrator error routing to Recommendation Agent: {str(e)}")
        state["recommendations"] = []

    # Step 4: Finalizer Agent
    t_fin = time.time()
    log_agent_start("finalizer", "Verifying stock, warranty & compiling executive report...")
    try:
        finalizer_response = await finalizer_agent(state)
        state["final_output"] = finalizer_response.get("final_output", "")
        state["logs"].extend(finalizer_response.get("logs", []))
        dur_fin = time.time() - t_fin
        log_agent_complete("finalizer", "Final decision report compiled successfully", dur_fin)
    except Exception as e:
        dur_fin = time.time() - t_fin
        log_agent_error("finalizer", str(e), dur_fin)
        state["logs"].append(f"Orchestrator error routing to Finalizer Agent: {str(e)}")
        state["final_output"] = "Report generation failed."

    total_time = time.time() - start_time
    valid_deals = len(state.get("price_data", []))
    log_pipeline_complete(query, total_time, valid_deals)
    return state


async def stream_orchestrator_pipeline(initial_state: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Async Generator for real-time SSE streaming.
    Guarantees exact lockstep synchronization between Python agent execution and Frontend UI cards:
    - Emits node_start when an agent genuinely begins
    - Emits node_complete when that agent finishes
    - Runs parallel agents concurrently and yields completions independently as they finish
    - Waits for ALL parallel agents before starting recommendation
    """
    start_time = time.time()
    query = initial_state.get("query", "")
    steering = initial_state.get("steering_mode", "balanced")

    log_pipeline_start(query, steering)
    state = initial_state.copy()
    state.setdefault("logs", [])

    # 1. Search Agent
    t0 = time.time()
    log_agent_start("search", f"Searching marketplaces for '{query}'...")
    yield {"type": "node_start", "agent_id": "search"}

    try:
        search_response = await search_agent(state)
        state["search_results"] = search_response.get("search_results", [])
        state["logs"].extend(search_response.get("logs", []))
        dur = time.time() - t0
        count = len(state["search_results"])
        log_agent_complete("search", f"Found {count} candidate marketplace records", dur)
        yield {"type": "node_complete", "agent_id": "search"}
    except Exception as e:
        dur = time.time() - t0
        log_agent_error("search", str(e), dur)
        state["search_results"] = []
        state["logs"].append(f"Search Agent error: {str(e)}")
        yield {"type": "node_error", "agent_id": "search", "message": str(e)}

    # 2. Parallel Stage: Budget, Price, Reviews
    log_parallel_phase_start(["budget", "price", "reviews"])
    log_agent_start("budget", "Parsing financial ceilings & constraints...")
    log_agent_start("price", "Cross-checking price history & live storefronts...")
    log_agent_start("reviews", "Distilling customer reviews & sentiment...")

    # Notify frontend that all 3 parallel agents have commenced running
    yield {"type": "node_start", "agent_id": "budget"}
    yield {"type": "node_start", "agent_id": "price"}
    yield {"type": "node_start", "agent_id": "reviews"}

    async def _execute_budget():
        tb = time.time()
        try:
            res = await budget_advisor_agent(state)
            db = time.time() - tb
            ceiling = res.get("budget_status", {}).get("ceiling")
            msg = f"Locked ceiling: ₹{ceiling:,}" if ceiling else "No budget ceiling specified"
            log_agent_complete("budget", msg, db)
            return ("budget", res, None)
        except Exception as be:
            db = time.time() - tb
            log_agent_error("budget", str(be), db)
            return ("budget", {}, str(be))

    async def _execute_price():
        tp = time.time()
        try:
            res = await price_comparison_agent(state)
            dp = time.time() - tp
            p_count = len(res.get("price_data", []))
            log_agent_complete("price", f"Processed {p_count} verified price entries", dp)
            return ("price", res, None)
        except Exception as pe:
            dp = time.time() - tp
            log_agent_error("price", str(pe), dp)
            return ("price", {}, str(pe))

    async def _execute_reviews():
        tr = time.time()
        try:
            res = await review_analyzer_agent(state)
            dr = time.time() - tr
            log_agent_complete("reviews", "Market sentiment & pros/cons synthesized", dr)
            return ("reviews", res, None)
        except Exception as re:
            dr = time.time() - tr
            log_agent_error("reviews", str(re), dr)
            return ("reviews", {}, str(re))

    # Run tasks concurrently; as each one finishes, yield its completion immediately
    tasks = [
        asyncio.create_task(_execute_budget()),
        asyncio.create_task(_execute_price()),
        asyncio.create_task(_execute_reviews()),
    ]

    for completed_future in asyncio.as_completed(tasks):
        agent_id, res, err = await completed_future
        if err:
            state["logs"].append(f"{agent_id} agent error: {err}")
            yield {"type": "node_error", "agent_id": agent_id, "message": err}
            await asyncio.sleep(0.05)
        else:
            if agent_id == "budget":
                state["budget_status"] = res.get("budget_status", {})
            elif agent_id == "price":
                state["price_data"] = res.get("price_data", [])
            elif agent_id == "reviews":
                state["analysis_report"] = res.get("analysis_report", {})
            state["logs"].extend(res.get("logs", []))
            yield {"type": "node_complete", "agent_id": agent_id}
            await asyncio.sleep(0.05)

    # 3. Recommendation Agent: ONLY starts after ALL THREE parallel agents have completed!
    t_rec = time.time()
    log_agent_start("recommendation", "Ranking candidates against intent & value...")
    yield {"type": "node_start", "agent_id": "recommendation"}
    await asyncio.sleep(0.08)  # Flush node_start to frontend socket immediately before LLM call begins!

    try:
        recommendation_response = await recommendation_agent(state)
        state["recommendations"] = recommendation_response.get("recommendations", [])
        state["logs"].extend(recommendation_response.get("logs", []))
        dur_rec = time.time() - t_rec
        log_agent_complete("recommendation", f"Formulated {len(state['recommendations'])} recommendation insights", dur_rec)
        yield {"type": "node_complete", "agent_id": "recommendation"}
        await asyncio.sleep(0.05)
    except Exception as e:
        dur_rec = time.time() - t_rec
        log_agent_error("recommendation", str(e), dur_rec)
        state["recommendations"] = []
        state["logs"].append(f"Recommendation Agent error: {str(e)}")
        yield {"type": "node_error", "agent_id": "recommendation", "message": str(e)}
        await asyncio.sleep(0.05)

    # 4. Finalizer Agent: Starts after recommendation completes
    t_fin = time.time()
    log_agent_start("finalizer", "Verifying stock, warranty & compiling executive report...")
    yield {"type": "node_start", "agent_id": "finalizer"}
    await asyncio.sleep(0.08)  # Flush node_start to frontend socket immediately before LLM call begins!

    try:
        finalizer_response = await finalizer_agent(state)
        state["final_output"] = finalizer_response.get("final_output", "")
        state["logs"].extend(finalizer_response.get("logs", []))
        dur_fin = time.time() - t_fin
        log_agent_complete("finalizer", "Final decision report compiled successfully", dur_fin)
        yield {"type": "node_complete", "agent_id": "finalizer"}
        await asyncio.sleep(0.05)
    except Exception as e:
        dur_fin = time.time() - t_fin
        log_agent_error("finalizer", str(e), dur_fin)
        state["final_output"] = "Report generation failed."
        state["logs"].append(f"Finalizer Agent error: {str(e)}")
        yield {"type": "node_error", "agent_id": "finalizer", "message": str(e)}
        await asyncio.sleep(0.05)

    # 5. Pipeline completion
    total_time = time.time() - start_time
    valid_deals = len(state.get("price_data", []))
    log_pipeline_complete(query, total_time, valid_deals)

    yield {"type": "result", "payload": state}