from typing import List, Dict, Any, Optional, TypedDict
from typing_extensions import Annotated
import operator

def _merge_category(prev: str, new_val: str) -> str:
    """Safe reducer ensuring concurrent updates to category never crash the graph."""
    if new_val and new_val != "general":
        return new_val
    return prev or new_val or "general"

class AgentState(TypedDict, total=False):
    """
    The central shared state for the SEAMAS multi-agent LangGraph workflow.
    Enforces strict field ownership across nodes:

    1. Input / Intent (Orchestrator Stage 1):
       - query: str
       - category: Annotated[str, _merge_category]
       - budget: Optional[float]
       - budget_type: str ("hard_limit" | "approximate" | "none")
       - user_preferences: Dict[str, Any]
       - steering_mode: str ("speed" | "balanced" | "accuracy")

    2. Research Normalization (Search Agent):
       - search_results: List[Dict[str, Any]]

    3. Parallel Research Outputs:
       - price_data: List[Dict[str, Any]] (Price Comparison Agent)
       - analysis_report: Dict[str, Any] (Review Analyzer Agent)

    4. Budget Evaluation (Budget Advisor Agent Stage 2):
       - budget_status: Dict[str, Any]

    5. Grounded Recommendation:
       - recommendations: List[str] (Recommendation Agent)

    6. Executive Output (Finalizer Agent):
       - final_output: str

    7. Observability & Observability Reducers:
       - logs: Annotated[List[str], operator.add]
       - errors: Annotated[List[Dict[str, Any]], operator.add]
       - timings: Dict[str, float]
    """
    # Intent & Input Constraints (Owned by Orchestrator Node)
    query: str
    category: Annotated[str, _merge_category]
    budget: Optional[float]
    budget_type: str
    user_preferences: Dict[str, Any]
    steering_mode: str

    # Research Normalization (Owned by Search Agent)
    search_results: List[Dict[str, Any]]
    raw_review_snippets: List[Dict[str, Any]]

    # Parallel Research Outputs (Strictly disjoint ownership)
    price_data: List[Dict[str, Any]]
    analysis_report: Dict[str, Any]

    # Evaluation & Decision (Owned by Budget Advisor)
    budget_status: Dict[str, Any]
    budget_evaluations: List[Dict[str, Any]]

    # Grounded Reasoning (Owned by Recommendation Agent)
    recommendations: List[str]

    # Executive Output (Owned by Finalizer Agent)
    final_output: str

    # Observability (Appended via tracked lifecycle wrappers)
    logs: Annotated[List[str], operator.add]
    errors: Annotated[List[Dict[str, Any]], operator.add]
    timings: Dict[str, float]