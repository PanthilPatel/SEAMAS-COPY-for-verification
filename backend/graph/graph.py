from langgraph.graph import StateGraph, END
from graph.state import AgentState
from agents.search_agent import search_agent
from agents.price_comparison_agent import price_comparison_agent
from agents.review_analyzer_agent import review_analyzer_agent
from agents.recommendation import recommendation_agent
from agents.budget_advisor_agent import budget_advisor_agent

def create_seamas_graph():
    """Compiles the multi-agent state graph mapping parallel node interactions."""
    workflow = StateGraph(AgentState)
    
    workflow.add_node("search_agent", search_agent)
    workflow.add_node("price_comparison_agent", price_comparison_agent)
    workflow.add_node("review_analyzer_agent", review_analyzer_agent)
    workflow.add_node("budget_advisor_agent", budget_advisor_agent)
    workflow.add_node("recommendation_agent", recommendation_agent)
    
    workflow.set_entry_point("search_agent")
    
    workflow.add_edge("search_agent", "price_comparison_agent")
    workflow.add_edge("search_agent", "review_analyzer_agent")
    workflow.add_edge("search_agent", "budget_advisor_agent")
    
    workflow.add_edge("price_comparison_agent", "recommendation_agent")
    workflow.add_edge("review_analyzer_agent", "recommendation_agent")
    workflow.add_edge("budget_advisor_agent", "recommendation_agent")
    
    workflow.add_edge("recommendation_agent", END)
    
    return workflow.compile()

seamas_graph = create_seamas_graph()