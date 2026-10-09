import time
import asyncio
from contextvars import ContextVar
from typing import Optional, Dict, Any
from langgraph.graph import StateGraph, END
from .state import AgentState

from agents.orchestrator import orchestrator_agent
from agents.search_agent import search_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.budget_advisor_agent import budget_advisor_agent
from agents.recommendation import recommendation_agent
from agents.finalizer_agent import finalizer_agent

from utils.agent_tracker import (
    log_agent_start,
    log_agent_complete,
    log_agent_error,
)

graph_stream_queue: ContextVar[Optional[asyncio.Queue]] = ContextVar("graph_stream_queue", default=None)


def _tracked_node(agent_id: str, func, start_desc: str):
    """
    Wraps an agent node:
    - Emits real-time SSE 'node_start', 'node_complete', 'node_error' to the active stream queue.
    - Logs live execution status, parameters, and timings in the backend terminal.
    - Recovers gracefully on individual agent errors so the pipeline can complete with partial results.
    """
    async def wrapper(state: AgentState):
        t0 = time.time()
        q = graph_stream_queue.get()
        if q:
            await q.put({"type": "node_start", "agent_id": agent_id, "start_time": t0})
            await asyncio.sleep(0.01)

        log_agent_start(agent_id, start_desc)

        try:
            res = await func(state)
            dur = time.time() - t0

            summary = "Task completed successfully"
            if agent_id == "orchestrator":
                cat = res.get("category", "general")
                b = res.get("budget")
                b_type = res.get("budget_type", "none")
                summary = f"Identified category: {cat}, Budget: ₹{b:,} ({b_type})" if b else f"Identified category: {cat} (No strict budget)"
            elif agent_id == "search":
                count = len(res.get("search_results", []))
                summary = f"Normalized {count} candidate marketplace records"
            elif agent_id == "price":
                count = len(res.get("price_data", []))
                summary = f"{count} verified price records"
            elif agent_id == "reviews":
                summary = "Sentiment analysis synthesized"
            elif agent_id == "budget":
                c = res.get("budget_status", {}).get("ceiling")
                summary = f"Ceiling: ₹{c:,}" if c else "No budget ceiling specified"
            elif agent_id == "recommendation":
                count = len(res.get("recommendations", []))
                summary = f"{count} recommendation insights formulated"
            elif agent_id == "finalizer":
                summary = "Final executive evaluation report ready"

            log_agent_complete(agent_id, summary, dur)

            if q:
                await q.put({"type": "node_complete", "agent_id": agent_id, "duration": dur, "end_time": time.time()})
                await asyncio.sleep(0.01)

            return res

        except Exception as e:
            dur = time.time() - t0
            err_msg = str(e)
            log_agent_error(agent_id, err_msg, dur)

            if q:
                await q.put({"type": "node_error", "agent_id": agent_id, "message": err_msg})
                await asyncio.sleep(0.01)

            # Controlled recovery: Return safe fallback defaults strictly for this agent's owned keys
            fallback: Dict[str, Any] = {
                "logs": [f"[{agent_id.upper()} ERROR] {err_msg}"],
                "errors": [{"agent_id": agent_id, "error": err_msg, "timestamp": time.time()}]
            }
            if agent_id == "orchestrator":
                fallback["category"] = "general"
                fallback["budget"] = None
                fallback["budget_type"] = "none"
                fallback["user_preferences"] = {}
                fallback["budget_status"] = {"ceiling": None, "budget_type": "none", "status": "No explicit budget constraint."}
            elif agent_id == "search":
                fallback["search_results"] = []
            elif agent_id == "price":
                fallback["price_data"] = []
            elif agent_id == "reviews":
                fallback["analysis_report"] = {"summary": "Sentiment analysis unavailable due to error.", "pros": [], "cons": []}
            elif agent_id == "budget":
                fallback["budget_status"] = {"ceiling": None, "status": "Budget evaluation bypassed due to an issue."}
            elif agent_id == "recommendation":
                fallback["recommendations"] = ["Recommendation synthesis encountered an error; please review candidate offers directly."]
            elif agent_id == "finalizer":
                fallback["final_output"] = "# SEAMAS Evaluation Report\n\nFinal report compilation encountered an error."

            return fallback

    return wrapper


def create_seamas_graph():
    """
    Constructs the central SEAMAS LangGraph workflow.
    LangGraph is the SINGLE SOURCE OF TRUTH for both /api/chat and /api/chat/stream.

    Topology:
      orchestrator_agent (Stage 1: Intent & Budget Extraction)
             │
             ▼
        search_agent (Research Normalization Layer)
             │
             ├──> price_comparison_agent ──┐
             └──> review_analyzer_agent   ──┼──> budget_advisor_agent (Stage 2: Product Evaluation)
                                            │
                                            ▼
                                   recommendation_agent (Grounded Reasoning)
                                            │
                                            ▼
                                     finalizer_agent (Synthesis-Only)
                                            │
                                            ▼
                                           END
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("orchestrator_agent", _tracked_node("orchestrator", orchestrator_agent, "Extracting intent, category & early budget constraints..."))
    workflow.add_node("search_agent", _tracked_node("search", search_agent, "Sweeping & normalizing marketplace records..."))
    workflow.add_node("price_comparison_agent", _tracked_node("price", price_comparison_agent, "Cross-checking price history & deals..."))
    workflow.add_node("review_analyzer_agent", _tracked_node("reviews", review_analyzer_agent, "Distilling customer reviews & sentiment..."))
    workflow.add_node("budget_advisor_agent", _tracked_node("budget", budget_advisor_agent, "Evaluating products against budget & tagging listings..."))
    workflow.add_node("recommendation_agent", _tracked_node("recommendation", recommendation_agent, "Ranking candidates against intent & value..."))
    workflow.add_node("finalizer_agent", _tracked_node("finalizer", finalizer_agent, "Confirming stock, warranty & compiling executive report..."))

    # Entry Point: Orchestrator Agent (Stage 1)
    workflow.set_entry_point("orchestrator_agent")

    # Orchestrator to Search Agent
    workflow.add_edge("orchestrator_agent", "search_agent")

    # Parallel Fan-Out from Search Agent to Price, Reviews, and Budget
    workflow.add_edge("search_agent", "price_comparison_agent")
    workflow.add_edge("search_agent", "review_analyzer_agent")
    workflow.add_edge("search_agent", "budget_advisor_agent")

    # Fan-In at Recommendation Agent (Parallel Stage 2)
    workflow.add_edge("price_comparison_agent", "recommendation_agent")
    workflow.add_edge("review_analyzer_agent", "recommendation_agent")
    workflow.add_edge("budget_advisor_agent", "recommendation_agent")

    # Sequential Decision & Synthesis Pipeline
    workflow.add_edge("recommendation_agent", "finalizer_agent")
    workflow.add_edge("finalizer_agent", END)

    return workflow.compile()


seamas_graph = create_seamas_graph()