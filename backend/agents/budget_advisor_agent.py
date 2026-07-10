from typing import Dict, Any

async def budget_advisor_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("query", "")
    print(f"--- BUDGET ADVISOR AGENT INITIATED: Evaluating '{query}' ---")
    extracted_limit = 90000 if "90" in query else 2000
    
    return {
        "budget_status": {
            "ceiling": extracted_limit,
            "status": f"Financial parameter locked to maximum Rs. {extracted_limit}"
        }
    }