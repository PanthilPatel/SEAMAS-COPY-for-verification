import asyncio
from typing import Dict, Any

from agents.search_agent import search_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.budget_advisor_agent import budget_advisor_agent
from agents.recommendation import recommendation_agent
from agents.finalizer_agent import finalizer_agent


async def run_orchestrator_pipeline(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Explicit Central Orchestrator Pipeline.
    Acts as the supervisor coordinating data routing between specialized agents.
    Mirrors graph.py's flow exactly: search -> (budget, price, review in parallel)
    -> recommendation -> finalizer.
    """
    print("\n[ORCHESTRATOR] Central manager tracking initiated...")
    state = initial_state.copy()
    state.setdefault("logs", [])

    try:
        search_response = await search_agent(state)
        state["search_results"] = search_response.get("search_results", [])
        state["logs"].extend(search_response.get("logs", []))
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Search Agent: {str(e)}")
        state["search_results"] = []

    try:
        budget_task = budget_advisor_agent(state)
        price_task = price_comparison_agent(state)
        review_task = review_analyzer_agent(state)

        budget_response, price_response, review_response = await asyncio.gather(
            budget_task, price_task, review_task, return_exceptions=True
        )

        if isinstance(budget_response, Exception):
            state["logs"].append(f"Orchestrator error routing to Budget Agent: {budget_response}")
            state["budget_status"] = {}
        else:
            state["budget_status"] = budget_response.get("budget_status", {})
            state["logs"].extend(budget_response.get("logs", []))

        if isinstance(price_response, Exception):
            state["logs"].append(f"Orchestrator error routing to Price Agent: {price_response}")
            state["price_data"] = []
        else:
            state["price_data"] = price_response.get("price_data", [])
            state["logs"].extend(price_response.get("logs", []))

        if isinstance(review_response, Exception):
            state["logs"].append(f"Orchestrator error routing to Review Agent: {review_response}")
            state["analysis_report"] = {}
        else:
            state["analysis_report"] = review_response.get("analysis_report", {})
            state["logs"].extend(review_response.get("logs", []))

    except Exception as e:
        state["logs"].append(f"Orchestrator error during parallel agent execution: {str(e)}")

    try:
        recommendation_response = await recommendation_agent(state)
        state["recommendations"] = recommendation_response.get("recommendations", [])
        state["logs"].extend(recommendation_response.get("logs", []))
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Recommendation Agent: {str(e)}")
        state["recommendations"] = []

    try:
        finalizer_response = await finalizer_agent(state)
        state["final_output"] = finalizer_response.get("final_output", "")
        state["logs"].extend(finalizer_response.get("logs", []))
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Finalizer Agent: {str(e)}")
        state["final_output"] = "Report generation failed."

    print("[ORCHESTRATOR] All agent nodes processed successfully.")
    return state