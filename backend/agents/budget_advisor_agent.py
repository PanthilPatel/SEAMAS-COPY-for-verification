import re
from typing import Dict, Any, Optional

def _extract_budget(query: str) -> Optional[int]:
    """
    Extracts a budget ceiling only when the number is anchored to
    explicit budget language. Bare numbers (model names, storage sizes,
    years, etc.) are ignored on purpose — a false 'no budget' is safer
    than a false budget derived from something like 'iPhone 15' or
    'iPhone Pro Max 256GB'.
    """
    q = query.lower()

    def _to_int(num_str: str, suffix: str) -> int:
        num_str = num_str.replace(",", "")
        value = float(num_str)
        if suffix == "k":
            value *= 1_000
        elif suffix in ("l", "lakh", "lac"):
            value *= 100_000
        return int(value)

    keyword_pattern = re.compile(
        r"\b(?:under|below|within|less than|budget(?:\s+of)?|"
        r"max(?:imum)?\s*(?:budget|price|spend|cost)|around|approx(?:imately)?)\b"
        r"\D{0,10}?"
        r"(\d[\d,]*\.?\d*)\s*(k|l|lakh|lac)?",
        re.IGNORECASE,
    )
    match = keyword_pattern.search(q)
    if match:
        return _to_int(match.group(1), (match.group(2) or "").lower())

    currency_pattern = re.compile(
        r"(?:₹|\brs\.?|\binr)\s*(\d[\d,]*\.?\d*)\s*(k|l|lakh|lac)?",
        re.IGNORECASE,
    )
    match = currency_pattern.search(q)
    if match:
        return _to_int(match.group(1), (match.group(2) or "").lower())

    return None


async def budget_advisor_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("query", "")
    print(f"--- BUDGET ADVISOR AGENT INITIATED: Evaluating '{query}' ---")

    extracted_limit = _extract_budget(query)

    status = (
        f"Financial parameter locked to maximum Rs. {extracted_limit}"
        if extracted_limit
        else "No explicit budget detected in query."
    )

    # Always include a consistent log key so the frontend pipeline tracker can
    # detect this agent's completion regardless of whether a budget was found.
    log_entry = (
        f"Financial parameter locked: Rs. {extracted_limit}."
        if extracted_limit
        else "Financial parameter: no budget constraint found in query."
    )

    return {
        "budget_status": {"ceiling": extracted_limit, "status": status},
        "logs": [log_entry],
    }