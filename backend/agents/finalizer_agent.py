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

    if cleaned_prices:
        markdown_output.append("### Verified Marketplace Offers")
        for p in cleaned_prices:
            markdown_output.append(f"- **[{p.get('marketplace', 'Web')}]** {p.get('product_name')} \u2192 **Rs. {p.get('extracted_price')}** ({p.get('status')})")

    markdown_output.append("\n### Recommendations")
    for r in recommendations:
        markdown_output.append(f"- {r}")

    return {
        "final_output": "\n".join(markdown_output),
        "logs": ["State sanitation completed successfully."]
    }