import time
from langgraph.graph import StateGraph, END
from .state import AgentState
from agents.search_agent import search_agent
from agents.budget_advisor_agent import budget_advisor_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.recommendation import recommendation_agent
from agents.finalizer_agent import finalizer_agent
from utils.agent_tracker import (
    log_agent_start,
    log_agent_complete,
    log_agent_error,
)


def _tracked_node(agent_id: str, func, start_desc: str):
    """Wraps an agent node to log start, completion, and duration in the backend terminal."""
    async def wrapper(state: AgentState):
        t0 = time.time()
        log_agent_start(agent_id, start_desc)
        try:
            res = await func(state)
            dur = time.time() - t0
            summary = "Task completed successfully"
            if agent_id == "search":
                count = len(res.get("search_results", []))
                summary = f"Found {count} candidate marketplace records"
            elif agent_id == "budget":
                c = res.get("budget_status", {}).get("ceiling")
                summary = f"Ceiling: ₹{c:,}" if c else "No ceiling"
            elif agent_id == "price":
                count = len(res.get("price_data", []))
                summary = f"{count} verified price records"
            elif agent_id == "reviews":
                summary = "Sentiment analysis complete"
            elif agent_id == "recommendation":
                count = len(res.get("recommendations", []))
                summary = f"{count} recommendation insights"
            elif agent_id == "finalizer":
                summary = "Final report ready"
            log_agent_complete(agent_id, summary, dur)
            return res
        except Exception as e:
            dur = time.time() - t0
            log_agent_error(agent_id, str(e), dur)
            raise e
    return wrapper


def create_seamas_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("search_agent", _tracked_node("search", search_agent, "Sweeping 14 marketplaces in parallel..."))
    workflow.add_node("budget_advisor_agent", _tracked_node("budget", budget_advisor_agent, "Parsing financial parameters & constraints..."))
    workflow.add_node("price_comparison_agent", _tracked_node("price", price_comparison_agent, "Cross-checking price history & deals..."))
    workflow.add_node("review_analyzer_agent", _tracked_node("reviews", review_analyzer_agent, "Distilling customer reviews & sentiment..."))
    workflow.add_node("recommendation_agent", _tracked_node("recommendation", recommendation_agent, "Ranking candidates against intent..."))
    workflow.add_node("finalizer_agent", _tracked_node("finalizer", finalizer_agent, "Confirming stock & compiling report..."))

    workflow.set_entry_point("search_agent")

    workflow.add_edge("search_agent", "budget_advisor_agent")
    workflow.add_edge("search_agent", "price_comparison_agent")
    workflow.add_edge("search_agent", "review_analyzer_agent")

    workflow.add_edge("budget_advisor_agent", "recommendation_agent")
    workflow.add_edge("price_comparison_agent", "recommendation_agent")
    workflow.add_edge("review_analyzer_agent", "recommendation_agent")

    workflow.add_edge("recommendation_agent", "finalizer_agent")
    workflow.add_edge("finalizer_agent", END)

    return workflow.compile()

seamas_graph = create_seamas_graph()