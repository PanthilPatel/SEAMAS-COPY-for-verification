import os
import re
import asyncio
from typing import Dict, Any, List, Optional
from ollama import AsyncClient


def _build_markdown_report(
    query: str,
    budget_status: Dict[str, Any],
    analysis_report: Dict[str, Any],
    recommendations: List[Any],
    verified_prices: List[Dict[str, Any]],
    unverified_prices: List[Dict[str, Any]],
    unpriced: List[Dict[str, Any]],
    ai_verdict: str = "",
    eval_map: Optional[Dict[str, Any]] = None
) -> str:
    """Builds structured markdown report with executive verdict."""
    markdown_output = []
    markdown_output.append(f"# SEAMAS Product Evaluation Report: {query.title()}\n")

    if ai_verdict:
        markdown_output.append(f"### Executive Buyer Verdict\n{ai_verdict}\n")

    if isinstance(budget_status, dict) and budget_status:
        markdown_output.append(f"### Budget Status\n- **Assessment:** {budget_status.get('status', 'N/A')}\n")

    if isinstance(analysis_report, dict) and analysis_report:
        sentiment_summary = analysis_report.get("summary") or analysis_report.get("sentiment_summary", "Neutral")
        avg_rating = analysis_report.get("average_rating")
        rating_str = f" ({avg_rating}★ / 5)" if avg_rating else ""
        markdown_output.append(f"### Market Sentiment\n- **Summary:** {sentiment_summary}{rating_str}")
        if analysis_report.get("pros"):
            pros = analysis_report["pros"]
            pros_str = ", ".join(str(p) for p in pros) if isinstance(pros, list) else str(pros)
            markdown_output.append("- **Pros:** " + pros_str)
        if analysis_report.get("cons"):
            cons = analysis_report["cons"]
            cons_str = ", ".join(str(c) for c in cons) if isinstance(cons, list) else str(cons)
            markdown_output.append("- **Cons:** " + cons_str + "\n")

    if not verified_prices and not unverified_prices:
        markdown_output.append("### Verified Marketplace Offers\nNo confirmed listings found for this query.")
    else:
        if verified_prices:
            markdown_output.append("### Verified Marketplace Offers")
            for p in verified_prices:
                eval_item = (eval_map or {}).get(p.get("url") or p.get("product_name"), {})
                status_label = eval_item.get("status", p.get('status', 'Target Match'))
                label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} -> **₹{p.get('extracted_price'):,}** ({status_label})"
                url = p.get("url")
                markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

        if unverified_prices:
            for p in unverified_prices:
                label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} -> **~₹{p.get('extracted_price'):,}** (approximate)"
                url = p.get("url")
                markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

    if unpriced:
        for p in unpriced:
            label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')}"
            url = p.get("url")
            markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

    if recommendations:
        markdown_output.append("\n### Strategic Recommendations")
        for r in recommendations:
            markdown_output.append(f"- {str(r)}")

    return "\n".join(markdown_output)


async def finalizer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- FINALIZER AGENT INITIATED: Trust Verification & Decision Synthesis ---")

    query = state.get("query", "")
    recommendations = state.get("recommendations", [])
    price_data = state.get("price_data", [])
    analysis_report = state.get("analysis_report", {})
    budget_status = state.get("budget_status", {})

    bad_phrases = ["ollama unreachable", "error:", "exception:", "missing api key", "failed to parse"]

    cleaned_prices = []
    if isinstance(price_data, list):
        for item in price_data:
            if isinstance(item, dict):
                prod_name = str(item.get("product_name", "")).lower()
                if not any(phrase in prod_name for phrase in bad_phrases):
                    cleaned_prices.append(item)

    if not recommendations or not isinstance(recommendations, list):
        recommendations = ["Product matching and price verification compiled."]

    priced = [p for p in cleaned_prices if isinstance(p, dict) and p.get("extracted_price") is not None]
    unpriced = [p for p in cleaned_prices if isinstance(p, dict) and p.get("extracted_price") is None]

    verified_prices = [p for p in priced if p.get("is_verified")]
    unverified_prices = [p for p in priced if not p.get("is_verified")]

    budget_evaluations = state.get("budget_evaluations", [])
    eval_map = {e.get("url") or e.get("product_name"): e for e in budget_evaluations}

    # Deterministic Executive Verdict: Finalizer is synthesis-only (0 external LLM/network calls)
    # Synthesizes the verdict purely from existing recommendation insights, ratings, and top offer.
    ai_verdict = ""
    top_deal = verified_prices[0] if verified_prices else None
    
    if top_deal:
        top_rec = recommendations[0] if recommendations else "The source page price was checked during this search."
        ai_verdict = (
            f"Source-page price checked. Recommended option: "
            f"**{top_deal.get('product_name')}** at **₹{top_deal.get('extracted_price'):,}** on "
            f"**{top_deal.get('marketplace')}**. {top_rec}"
        )
    elif unpriced:
        ai_verdict = "Current source-page prices could not be verified. Listings are shown without price claims."

    final_report = _build_markdown_report(
        query,
        budget_status,
        analysis_report,
        recommendations,
        verified_prices,
        unverified_prices,
        unpriced,
        ai_verdict,
        eval_map
    )

    return {
        "final_output": final_report,
        "logs": ["Finalizer Agent: Executive trust report and markdown summary synthesized."]
    }
