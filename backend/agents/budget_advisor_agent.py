import re
from typing import Dict, Any, Optional, Tuple, List


def parse_budget_intent(query: str) -> Dict[str, Any]:
    """
    Parses budget constraint and distinguishes hard ceilings from approximate budgets.
    Examples:
    - 'best smartphone under ₹30,000' -> ceiling: 30000, type: 'hard_limit'
    - 'laptop below 80k' -> ceiling: 80000, type: 'hard_limit'
    - 'phone around 25k' -> ceiling: 25000, type: 'approximate'
    """
    q = query.lower().replace(",", "")

    def _to_int(num_str: str, suffix: str) -> int:
        value = float(num_str)
        if suffix in ("k", "thousand"):
            value *= 1_000
        elif suffix in ("l", "lakh", "lac"):
            value *= 100_000
        return int(value)

    # 1. Hard limits: under, below, less than, maximum, max, budget of, within
    hard_pattern = re.compile(
        r"\b(?:under|below|less than|within|max(?:imum)?\s*(?:budget|price|spend|cost)?|budget\s*(?:of|is)?)\s*"
        r"(?:₹|\brs\.?|\binr)?\s*"
        r"(\d+(?:\.\d+)?)\s*(k|l|lakh|lac|thousand)?\b",
        re.IGNORECASE,
    )
    match_hard = hard_pattern.search(q)
    if match_hard:
        num = _to_int(match_hard.group(1), (match_hard.group(2) or "").lower())
        if 50 <= num <= 10_000_000:
            return {
                "ceiling": num,
                "budget_type": "hard_limit",
                "status": f"Hard budget ceiling locked at ₹{num:,}",
                "tolerance_pct": 0.0
            }

    # 2. Approximate budgets: around, approx, approximately, about, ~
    approx_pattern = re.compile(
        r"\b(?:around|approx(?:imately)?|about|~\s*)\s*"
        r"(?:₹|\brs\.?|\binr)?\s*"
        r"(\d+(?:\.\d+)?)\s*(k|l|lakh|lac|thousand)?\b",
        re.IGNORECASE,
    )
    match_approx = approx_pattern.search(q)
    if match_approx:
        num = _to_int(match_approx.group(1), (match_approx.group(2) or "").lower())
        if 50 <= num <= 10_000_000:
            return {
                "ceiling": num,
                "budget_type": "approximate",
                "status": f"Approximate target budget set around ₹{num:,} (±8% flexible)",
                "tolerance_pct": 0.08
            }

    # 3. Currency symbol directly attached to a qualified number
    currency_pattern = re.compile(
        r"(?:₹|\brs\.?|\binr)\s*(\d+(?:\.\d+)?)\s*(k|l|lakh|lac|thousand)?\b",
        re.IGNORECASE,
    )
    for m in currency_pattern.finditer(q):
        # Avoid model numbers like 'iPhone 15'
        prec = q[max(0, m.start() - 10):m.start()].strip()
        if any(w in prec for w in ["iphone", "galaxy", "pixel", "s24", "s23", "oneplus"]):
            continue
        num = _to_int(m.group(1), (m.group(2) or "").lower())
        if 500 <= num <= 10_000_000:
            return {
                "ceiling": num,
                "budget_type": "hard_limit",
                "status": f"Budget constraint identified at ₹{num:,}",
                "tolerance_pct": 0.0
            }

    return {
        "ceiling": None,
        "budget_type": "none",
        "status": "No explicit budget constraint detected in query.",
        "tolerance_pct": 0.0
    }


def _extract_budget(query: str) -> Optional[int]:
    """Compatibility helper returning numeric ceiling integer or None."""
    info = parse_budget_intent(query)
    return info.get("ceiling")


def tag_product_budget(extracted_price: Optional[int], budget_info: Dict[str, Any]) -> Tuple[str, Optional[int]]:
    """
    Evaluates an offer's price against the budget information.
    Returns (status_label, variance_amount).
    """
    if extracted_price is None or extracted_price <= 0:
        return ("Target Match", None)

    ceiling = budget_info.get("ceiling")
    if not ceiling or ceiling <= 0:
        return ("Target Match", 0)

    variance = extracted_price - ceiling
    budget_type = budget_info.get("budget_type", "hard_limit")
    tolerance = budget_info.get("tolerance_pct", 0.0)

    max_allowed = int(ceiling * (1.0 + tolerance))

    if extracted_price <= ceiling:
        return ("Target Match", variance)
    elif extracted_price <= max_allowed:
        return ("Stretch Match", variance)
    else:
        return ("Out of Budget", variance)


def evaluate_budget_listings(
    price_data: List[Dict[str, Any]],
    budget_info: Dict[str, Any]
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Evaluates listings in price_data against budget_info after fan-in.
    Returns (budget_evaluations, updated_budget_info).
    """
    budget_evaluations: List[Dict[str, Any]] = []
    in_budget_count = 0
    out_budget_count = 0
    ceiling = budget_info.get("ceiling")

    for item in price_data:
        price_val = item.get("extracted_price")
        if isinstance(price_val, (int, float)):
            price_int = int(price_val)
            status_tag, variance = tag_product_budget(price_int, budget_info)
            budget_evaluations.append({
                "product_name": item.get("product_name"),
                "url": item.get("url"),
                "marketplace": item.get("marketplace"),
                "extracted_price": price_int,
                "status": status_tag,
                "budget_tag": status_tag,
                "budget_variance": variance,
            })
            if status_tag in ("Target Match", "Stretch Match"):
                in_budget_count += 1
            else:
                out_budget_count += 1

    updated_info = dict(budget_info)
    if ceiling:
        if budget_evaluations:
            updated_info["in_budget_count"] = in_budget_count
            updated_info["out_of_budget_count"] = out_budget_count
            summary_msg = f"{updated_info.get('status', '')}. Filtered: {in_budget_count} in-budget offers, {out_budget_count} out-of-budget."
        else:
            summary_msg = updated_info.get("status", "")
    else:
        summary_msg = "No financial limits enforced; full marketplace pricing spectrum active."

    updated_info["summary"] = summary_msg
    return budget_evaluations, updated_info


async def budget_advisor_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Budget Advisor Agent (Parallel Stage 2):
    Runs in parallel with Price Comparison and Review Analyzer directly from Search Agent.
    Depends only on the user query, state budget ceiling, and intent constraints.
    Does NOT depend on price_data during fan-out.
    """
    query = state.get("query", "")
    existing_budget = state.get("budget")
    existing_status = state.get("budget_status") or {}

    print(f"\n--- BUDGET ADVISOR AGENT INITIATED: Evaluating '{query}' ---")

    if existing_status and existing_status.get("ceiling") is not None:
        budget_info = dict(existing_status)
    elif existing_budget is not None and existing_budget > 0:
        budget_info = {
            "ceiling": int(existing_budget),
            "budget_type": state.get("budget_type", "hard_limit"),
            "status": f"Budget constraint locked at ₹{int(existing_budget):,}",
            "tolerance_pct": 0.08 if state.get("budget_type") == "approximate" else 0.0,
        }
    else:
        budget_info = parse_budget_intent(query)

    ceiling = budget_info.get("ceiling")
    if ceiling:
        summary_msg = budget_info.get("status", f"Budget ceiling set at ₹{ceiling:,}")
    else:
        summary_msg = "No financial limits enforced; full marketplace pricing spectrum active."

    price_data = state.get("price_data", [])
    budget_evaluations: List[Dict[str, Any]] = []

    if price_data:
        budget_evaluations, updated_info = evaluate_budget_listings(price_data, budget_info)
        budget_info = updated_info
        summary_msg = budget_info.get("summary", summary_msg)

    budget_info["summary"] = summary_msg
    print(f"[BudgetAdvisor] {summary_msg}")

    result: Dict[str, Any] = {
        "budget_status": budget_info,
        "logs": [f"Budget Advisor: {summary_msg}"]
    }
    if budget_evaluations or price_data:
        result["budget_evaluations"] = budget_evaluations
    return result