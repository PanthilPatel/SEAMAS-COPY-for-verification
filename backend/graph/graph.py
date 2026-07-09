from typing import Dict, Any, TypedDict, List, Annotated
import operator
from langgraph.graph import StateGraph, END
from agents.search_agent import search_agent
from agents.budget_advisor_agent import budget_advisor_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent

try:
    from agents.recommendation import recommendation as recommendation_node
except ImportError:
    from agents.recommendation import recommendation_agent as recommendation_node

class AgentState(TypedDict):
    query: str
    search_results: List[Dict[str, Any]]
    price_data: List[Dict[str, Any]]
    analysis_report: Dict[str, Any]
    recommendations: List[str]
    budget_status: Dict[str, Any]
    logs: Annotated[List[str], operator.add]

def create_seamas_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("search_agent", search_agent)
    workflow.add_node("budget_advisor_agent", budget_advisor_agent)
    workflow.add_node("price_comparison_agent", price_comparison_agent)
    workflow.add_node("review_analyzer_agent", review_analyzer_agent)
    workflow.add_node("recommendation_agent", recommendation_node)

    workflow.set_entry_point("search_agent")
    workflow.add_edge("search_agent", "budget_advisor_agent")
    
    workflow.add_edge("budget_advisor_agent", "price_comparison_agent")
    workflow.add_edge("budget_advisor_agent", "review_analyzer_agent")
    
    workflow.add_edge("price_comparison_agent", "recommendation_agent")
    workflow.add_edge("review_analyzer_agent", "recommendation_agent")
    
    workflow.add_edge("recommendation_agent", END)

    return workflow.compile()

seamas_graph = create_seamas_graph()