from typing import Dict, Any
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.budget_advisor_agent import budget_advisor_agent

async def run_orchestrator_pipeline(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Explicit Central Orchestrator Pipeline.
    Acts as the supervisor coordinating data routing between specialized agents.
    """
    print("\n [ORCHESTRATOR] Central manager tracking initiated...")
    state = initial_state.copy()

    try:
        price_response = await price_comparison_agent(state)
        state["price_data"] = price_response.get("price_data", [])
        if "logs" in price_response:
            state["logs"].extend(price_response["logs"])
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Price Agent: {str(e)}")

    try:
        review_response = await review_analyzer_agent(state)
        state["analysis_report"] = review_response.get("analysis_report", {})
        if "logs" in review_response:
            state["logs"].extend(review_response["logs"])
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Review Agent: {str(e)}")

    try:
        budget_response = await budget_advisor_agent(state)
        state["budget_status"] = budget_response.get("budget_status", {})
        if "logs" in budget_response:
            state["logs"].extend(budget_response["logs"])
    except Exception as e:
        state["logs"].append(f"Orchestrator error routing to Budget Agent: {str(e)}")

    print("[ORCHESTRATOR] All agent nodes processed successfully.")
    return state