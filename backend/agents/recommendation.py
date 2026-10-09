import os
import re
import json
import asyncio
from typing import Dict, Any, List, Optional
from ollama import AsyncClient


def _algorithmic_fallback(
    price_data: List[Dict[str, Any]],
    budget_status: Dict[str, Any],
    analysis_report: Dict[str, Any],
    budget_evaluations: Optional[List[Dict[str, Any]]] = None
) -> List[str]:
    """Fast deterministic heuristic fallback if LLM is unavailable."""
    recommendation_list = []
    eval_map = {e.get("url") or e.get("product_name"): e.get("status") for e in (budget_evaluations or [])}

    if price_data:
        verified_count = sum(1 for x in price_data if x.get("is_verified"))
        recommendation_list.append(
            f"Evaluated {len(price_data)} candidate offers across marketplaces ({verified_count} verified listings)."
        )

        valid_prices = [x for x in price_data if isinstance(x.get("extracted_price"), (int, float)) and x.get("extracted_price") > 0]
        if valid_prices:
            verified = [x for x in valid_prices if x.get("is_verified", True)]
            pool = verified if verified else valid_prices
            in_budget = [x for x in pool if eval_map.get(x.get("url") or x.get("product_name"), x.get("status")) in ("Target Match", "Stretch Match")]
            candidates = in_budget if in_budget else pool
            best_deal = min(candidates, key=lambda x: x.get("extracted_price"))

            rec_text = f"Top Value Pick: {best_deal.get('marketplace', 'Store')} — {best_deal.get('product_name')} at ₹{best_deal.get('extracted_price'):,}."
            recommendation_list.append(rec_text)

            ceiling = budget_status.get("ceiling")
            if not in_budget and ceiling:
                recommendation_list.append(
                    f"Notice: No confirmed listings found under ₹{ceiling:,}. The closest available option is ₹{best_deal.get('extracted_price'):,}."
                )
            elif in_budget and len(candidates) > 1:
                highest_deal = max(candidates, key=lambda x: x.get("extracted_price"))
                if highest_deal != best_deal:
                    diff = highest_deal.get("extracted_price") - best_deal.get("extracted_price")
                    if diff > 1000:
                        recommendation_list.append(
                            f"Price Spread Insight: Deals range from ₹{best_deal.get('extracted_price'):,} on {best_deal.get('marketplace')} up to ₹{highest_deal.get('extracted_price'):,} on {highest_deal.get('marketplace')} (save ₹{diff:,})."
                        )
        else:
            recommendation_list.append("Listings found, but price confirmation remains pending verification.")
    else:
        recommendation_list.append("No active marketplace listings met the search criteria.")

    # Market sentiment highlight
    sentiment = analysis_report.get("summary")
    if sentiment and "insufficient" not in sentiment.lower():
        recommendation_list.append(f"Customer Consensus: {sentiment}")

    return recommendation_list


async def recommendation_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recommendation Agent:
    Synthesizes pricing, review sentiment, and budget limits.
    Produces grounded, actionable shopping recommendations using Qwen2.5 or algorithmic fallback.
    Performs fan-in budget evaluation to generate budget_evaluations for the frontend.
    """
    print("\n--- RECOMMENDATION AGENT INITIATED: AI Synthesis & Ranking ---")

    query = state.get("query", "")
    price_data = state.get("price_data", [])
    analysis_report = state.get("analysis_report", {})
    budget_status = state.get("budget_status", {})
    budget_evaluations = state.get("budget_evaluations") or []

    # If parallel budget_advisor ran, evaluate listings against budget_status now at fan-in
    from agents.budget_advisor_agent import evaluate_budget_listings
    if not budget_evaluations and price_data:
        budget_evaluations, updated_budget_status = evaluate_budget_listings(price_data, budget_status)
        budget_status = updated_budget_status
    elif not budget_evaluations:
        updated_budget_status = budget_status

    eval_map = {e.get("url") or e.get("product_name"): e.get("status") for e in budget_evaluations}

    # Top candidates for the LLM to analyze (up to 5 best options)
    valid_candidates = [
        p for p in price_data
        if isinstance(p.get("extracted_price"), (int, float)) and p.get("extracted_price") > 0
    ][:5]

    if not valid_candidates:
        fallback = _algorithmic_fallback(price_data, budget_status, analysis_report, budget_evaluations)
        return {
            "recommendations": fallback,
            "budget_status": budget_status,
            "budget_evaluations": budget_evaluations,
            "logs": ["Recommendation Agent: No valid candidates for LLM ranking. Used deterministic fallback."]
        }

    candidates_text = "\n".join([
        f"- {p.get('product_name', 'Unknown')} on {p.get('marketplace', 'Web')} | Price: ₹{p.get('extracted_price')} | Status: {eval_map.get(p.get('url') or p.get('product_name'), p.get('status', 'Target Match'))} | Verified: {p.get('is_verified', False)}"
        for p in valid_candidates
    ])

    sentiment_summary = analysis_report.get("summary") or "Balanced general market sentiment."
    pros = ", ".join(analysis_report.get("pros", [])) or "Reliable performance"
    cons = ", ".join(analysis_report.get("cons", [])) or "Standard market boundaries"
    ceiling = budget_status.get("ceiling")
    budget_info = f"Max ₹{ceiling:,} ({budget_status.get('budget_type', 'hard_limit')})" if ceiling else "No strict ceiling set"

    prompt = f"""You are the SEAMAS Recommendation Specialist AI.
Analyze these marketplace listings for query: "{query}".

Candidate Products:
{candidates_text}

Constraints & Market Sentiment:
- Budget Constraint: {budget_info}
- Market Sentiment: {sentiment_summary}
- Positive Feedback: {pros}
- Critical Feedback: {cons}

Provide 3 to 4 concise, high-value bullet points (1 sentence each):
1. **Top Recommendation**: Which product offers the best balance of price, seller credibility, and match for "{query}".
2. **Best Budget Pick**: The most affordable reliable option and its trade-off.
3. **Market Insight**: Key takeaway regarding price variance or review sentiment across marketplaces.
4. **Buyer Tip**: One actionable advice before purchasing this product.

Output only the bullet points, clear, factual, and strictly grounded in the candidate data."""

    from core.config import resolve_ollama_model, settings
    ollama_host = settings.OLLAMA_HOST
    model_name = resolve_ollama_model()

    if not model_name:
        fallback = _algorithmic_fallback(price_data, budget_status, analysis_report, budget_evaluations)
        return {
            "recommendations": fallback,
            "logs": ["Recommendation Agent: Deterministic algorithmic fallback engaged (no LLM model configured/available)."]
        }

    try:
        client = AsyncClient(host=ollama_host)
        response = await asyncio.wait_for(
            client.chat(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                options={
                    "temperature": 0.2,
                    "num_ctx": 2048,
                    "num_predict": 220,
                }
            ),
            timeout=10.0
        )

        content = response["message"]["content"].strip()
        cleaned = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()

        bullets = [
            line.strip().lstrip("-*•123456789. ").strip()
            for line in cleaned.split("\n")
            if line.strip() and len(line.strip()) > 12
        ]

        if bullets and len(bullets) >= 2:
            print(f"[RecommendationAgent] Successfully synthesized {len(bullets)} recommendations via {model_name}.")
            return {
                "recommendations": bullets,
                "budget_status": budget_status,
                "budget_evaluations": budget_evaluations,
                "logs": [f"Recommendation Agent: Synthesized {len(bullets)} strategic points via {model_name}."]
            }
        else:
            fallback = _algorithmic_fallback(price_data, budget_status, analysis_report, budget_evaluations)
            return {
                "recommendations": fallback,
                "budget_status": budget_status,
                "budget_evaluations": budget_evaluations,
                "logs": ["Recommendation Agent: Fallback heuristic engaged after concise LLM output."]
            }

    except Exception as e:
        print(f"[RecommendationAgent] LLM reasoning unavailable ({e}). Engaging deterministic fallback...")
        fallback = _algorithmic_fallback(price_data, budget_status, analysis_report, budget_evaluations)
        return {
            "recommendations": fallback,
            "budget_status": budget_status,
            "budget_evaluations": budget_evaluations,
            "logs": [f"Recommendation Agent: Heuristic fallback engaged ({str(e)})."]
        }


# Export alias for backward compatibility
recommendation = recommendation_agent