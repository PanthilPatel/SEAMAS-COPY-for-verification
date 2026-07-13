from typing import Dict, Any

async def finalizer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- FINALIZER AGENT INITIATED ---")

    recommendations = state.get("recommendations", [])
    price_data = state.get("price_data", [])
    analysis_report = state.get("analysis_report", {})
    budget_status = state.get("budget_status", {})

    bad_phrases = ["ollama unreachable", "error:", "exception:", "missing api key", "failed to parse"]

    cleaned_prices = []
    for item in price_data:
        prod_name = str(item.get("product_name", "")).lower()
        if not any(phrase in prod_name for phrase in bad_phrases):
            cleaned_prices.append(item)

    if not recommendations:
        recommendations = ["No definitive product matching or verification could be compiled based on current search metrics."]

    markdown_output = []
    markdown_output.append("# SEAMAS Product Evaluation Report\n")

    if budget_status:
        markdown_output.append(f"### Budget Status\n- **Assessment:** {budget_status.get('status', 'N/A')}\n")

    if analysis_report:
        markdown_output.append(f"### Market Sentiment\n- **Summary:** {analysis_report.get('sentiment_summary', 'Neutral')}")
        if analysis_report.get("pros"):
            markdown_output.append("- **Pros:** " + ", ".join(analysis_report["pros"]))
        if analysis_report.get("cons"):
            markdown_output.append("- **Cons:** " + ", ".join(analysis_report["cons"]) + "\n")

    verified_prices = [p for p in cleaned_prices if p.get("is_verified")]
    unverified_prices = [p for p in cleaned_prices if not p.get("is_verified")]

    if not verified_prices and not unverified_prices:
        markdown_output.append("### Verified Marketplace Offers\nNo confirmed listings found for this query")
    else:
        if verified_prices:
            markdown_output.append("### Verified Marketplace Offers")
            for p in verified_prices:
                label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} ➔ **Rs. {p.get('extracted_price')}** ({p.get('status')})"
                url = p.get("url")
                if url:
                    markdown_output.append(f"- [{label}]({url})")
                else:
                    markdown_output.append(f"- {label}")

        if unverified_prices:
            markdown_output.append("\n### Other Mentions (unconfirmed pricing — from category/search pages)")
            for p in unverified_prices:
                label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} ➔ **~Rs. {p.get('extracted_price')}** (approximate)"
                url = p.get("url")
                if url:
                    markdown_output.append(f"- [{label}]({url})")
                else:
                    markdown_output.append(f"- {label}")    
    markdown_output.append("\n### Recommendations")
    for r in recommendations:
        markdown_output.append(f"- {r}")

    return {
        "final_output": "\n".join(markdown_output),
        "logs": ["State sanitation completed successfully."]
    }