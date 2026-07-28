from typing import List, Dict, Any, TypedDict
from typing_extensions import Annotated
import operator

class AgentState(TypedDict):
    """The central shared state for the SEAMAS multi-agent graph."""
    query: str
    search_results: Annotated[List[Dict[str, Any]], operator.add]
    price_data: List[Dict[str, Any]]
    analysis_report: Dict[str, Any]
    recommendations: List[str]
    budget_status: Dict[str, Any]
    final_output: str
    steering_mode: str
    logs: Annotated[List[str], operator.add]