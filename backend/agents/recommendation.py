import os
import re
import json
import asyncio
from typing import Dict, Any, List
from ollama import AsyncClient


def _algorithmic_fallback(price_data: List[Dict[str, Any]], budget_status: Dict[str, Any], analysis_report: Dict[str, Any]) -> List[str]:
    """Fast deterministic heuristic fallback if LLM is unavailable."""
    recommendation_list = []
    if price_data:
        verified_count = sum(1 for x in price_data if x.get("is_verified"))
        recommendation_list.append(
            f"Found {verified_count} verified listing(s) out of {len(price_data)} total matches."
        )
        valid_prices = [x for x in price_data if isinstance(x.get("extracted_price"), (int, float))]
        if valid_prices:
            verified = [x for x in valid_prices if x.get("is_verified", True)]
            pool = verified if verified else valid_prices
            in_budget = [x for x in pool if x.get("status") == "Target Match"]
            candidates = in_budget if in_budget else pool
            best_deal = min(candidates, key=lambda x: x.get("extracted_price"))

            if verified:
                recommendation_list.append(
                    f"Best verified deal: {best_deal.get('marketplace')} — "
                    f"{best_deal.get('product_name')} for Rs. {best_deal.get('extracted_price')}."
                )
            else:
                recommendation_list.append(
                    f"Closest candidate match: {best_deal.get('marketplace')} — {best_deal.get('product_name')} "
                    f"for ~Rs. {best_deal.get('extracted_price')}."
                )

            if not in_budget and budget_status.get("ceiling"):
                recommendation_list.append(
                    f"No listings found within the Rs. {budget_status.get('ceiling')} budget — "
                    f"showing the closest available option instead."
                )
        else:
            recommendation_list.append("Listings found, but prices could not be numerically verified.")
    else:
        recommendation_list.append("No clear pricing matches extracted from the raw search data.")

    sentiment = analysis_report.get("summary") or analysis_report.get("sentiment_summary", "")
    if sentiment and sentiment != "No data":
        recommendation_list.append(f"Market sentiment analysis: {sentiment}")

    status_msg = budget_status.get("status", "Evaluation complete.")
    recommendation_list.append(f"Budget assessment: {status_msg}")
    return recommendation_list


async def recommendation(state: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- RECOMMENDATION AGENT INITIATED: AI Synthesis & Ranking ---")

    query = state.get("query", "")
    price_data = state.get("price_data", [])
    analysis_report = state.get("analysis_report", {})
    budget_status = state.get("budget_status", {})

    # Top candidates for the LLM to analyze (up to 5 best options)
    valid_candidates = [
        p for p in price_data
        if isinstance(p.get("extracted_price"), (int, float)) and p.get("extracted_price") > 0
    ][:5]

    if not valid_candidates:
        fallback = _algorithmic_fallback(price_data, budget_status, analysis_report)
        return {
            "recommendations": fallback,
            "logs": ["No valid candidates for LLM ranking. Used heuristic fallback."]
        }

    # Prepare condensed context for fast LLM inference (~1-2s)
    candidates_text = "\n".join([
        f"- {p.get('product_name', 'Unknown')} on {p.get('marketplace', 'Web')} | Price: Rs. {p.get('extracted_price')} | Verified: {p.get('is_verified', False)}"
        for p in valid_candidates
    ])

    sentiment_summary = analysis_report.get("summary") or "Neutral general sentiment."
    pros = ", ".join(analysis_report.get("pros", [])) or "Good build quality"
    cons = ", ".join(analysis_report.get("cons", [])) or "Standard market limitations"
    ceiling = budget_status.get("ceiling")
    budget_info = f"Max Rs. {ceiling}" if ceiling else "No strict ceiling set"

    prompt = f"""You are the SEAMAS Recommendation Specialist AI.
Analyze these marketplace listings for query: "{query}".

Candidate Products:
{candidates_text}

Constraints & Market Sentiment:
- Budget: {budget_info}
- Market Sentiment: {sentiment_summary}
- Pros: {pros}
- Cons: {cons}

Provide 3 to 4 concise, high-value bullet points (1 sentence each):
1. **Top Recommendation**: Which product offers the best balance of price, seller credibility, and match for "{query}".
2. **Best Budget Pick**: The most affordable reliable option and its trade-off.
3. **Market Insight**: Key takeaway regarding price variance or review sentiment across marketplaces.
4. **Buyer Tip**: One actionable advice before purchasing this product.

Output only the bullet points, clear and ready for the customer."""

    try:
        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        client = AsyncClient(host=ollama_host)
        
        response = await asyncio.wait_for(
            client.chat(
                model="qwen2.5",
                messages=[{"role": "user", "content": prompt}],
                options={
                    "temperature": 0.2,
                    "num_ctx": 2048,
                    "num_predict": 180,
                }
            ),
            timeout=15.0
        )

        content = response["message"]["content"].strip()
        cleaned = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()

        bullets = [
            line.strip().lstrip("-*•123456789. ").strip()
            for line in cleaned.split("\n")
            if line.strip() and len(line.strip()) > 10
        ]

        if bullets and len(bullets) >= 2:
            return {
                "recommendations": bullets,
                "logs": [f"AI Recommendation Agent synthesized {len(bullets)} strategic points."]
            }
        else:
            fallback = _algorithmic_fallback(price_data, budget_status, analysis_report)
            return {
                "recommendations": fallback,
                "logs": ["AI response parsed lightly; combined with heuristic verification."]
            }

    except Exception as e:
        print(f"[RecommendationAgent] LLM reasoning fallback triggered: {e}")
        fallback = _algorithmic_fallback(price_data, budget_status, analysis_report)
        return {
            "recommendations": fallback,
            "logs": [f"Heuristic fallback engaged: {str(e)}"]
        }


recommendation_agent = recommendation