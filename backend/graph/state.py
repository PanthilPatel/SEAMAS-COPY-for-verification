from typing import List, Dict, Any, TypedDict
from typing_extensions import Annotated
import operator

class AgentState(TypedDict):
    """The Central memory state for the SEAMAS multi-agent system (T5 Orchestrator)."""
    query: str
    search_results: List[Dict[str, Any]]
    price_data: List[Dict[str, Any]]
    analysis_report: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    negotiation_logs: List[str]
    budget_status: Dict[str, Any]

    logs: Annotated[List[str], operator.add]