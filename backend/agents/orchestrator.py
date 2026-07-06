from langgraph.graph import StateGraph, END
from graph.state import AgentState  
from agents.search_agent import search_agent
from agents.review_analyzer_agent import run_review_analyzer_agent
from agents.price_comparison_agent import price_comparison_agent 
from agents.recommendation import recommendation_agent 

workflow = StateGraph(AgentState)

workflow.add_node("search_agent", search_agent)
workflow.add_node("review_analyzer", run_review_analyzer_agent)
workflow.add_node("price_comparison", price_comparison_agent) 
workflow.add_node("recommendation_agent", recommendation_agent)  

workflow.set_entry_point("search_agent")

workflow.add_edge("search_agent", "review_analyzer")
workflow.add_edge("search_agent", "price_comparison") 

workflow.add_edge("review_analyzer", "recommendation_agent")
workflow.add_edge("price_comparison", "recommendation_agent")

workflow.add_edge("recommendation_agent", END) 

seamas_orchestrator = workflow.compile()
print("--- SEAMAS Orchestrator Compiled Sucessfully ---")