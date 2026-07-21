from typing import Dict, Any

async def finalizer_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- FINALIZER AGENT INITIATED ---")

    try:
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
            recommendations = ["No definitive product matching or verification could be compiled based on current search metrics."]

        markdown_output = []
        markdown_output.append("# SEAMAS Product Evaluation Report\n")

        if isinstance(budget_status, dict) and budget_status:
            markdown_output.append(f"### Budget Status\n- **Assessment:** {budget_status.get('status', 'N/A')}\n")

        if isinstance(analysis_report, dict) and analysis_report:
            sentiment_summary = analysis_report.get("summary") or analysis_report.get("sentiment_summary", "Neutral")
            markdown_output.append(f"### Market Sentiment\n- **Summary:** {sentiment_summary}")
            if analysis_report.get("pros"):
                pros = analysis_report["pros"]
                pros_str = ", ".join(str(p) for p in pros) if isinstance(pros, list) else str(pros)
                markdown_output.append("- **Pros:** " + pros_str)
            if analysis_report.get("cons"):
                cons = analysis_report["cons"]
                cons_str = ", ".join(str(c) for c in cons) if isinstance(cons, list) else str(cons)
                markdown_output.append("- **Cons:** " + cons_str + "\n")

        priced = [p for p in cleaned_prices if isinstance(p, dict) and p.get("extracted_price") is not None]
        unpriced = [p for p in cleaned_prices if isinstance(p, dict) and p.get("extracted_price") is None]

        verified_prices = [p for p in priced if p.get("is_verified")]
        unverified_prices = [p for p in priced if not p.get("is_verified")]

        if not verified_prices and not unverified_prices:
            markdown_output.append("### Verified Marketplace Offers\nNo confirmed listings found for this query")
        else:
            if verified_prices:
                markdown_output.append("### Verified Marketplace Offers")
                for p in verified_prices:
                    label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} ➔ **Rs. {p.get('extracted_price')}** ({p.get('status')})"
                    url = p.get("url")
                    markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

            if unverified_prices:
                for p in unverified_prices:
                    label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')} ➔ **~Rs. {p.get('extracted_price')}** (approximate)"
                    url = p.get("url")
                    markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

        if unpriced:
            for p in unpriced:
                label = f"**[{p.get('marketplace', 'Web')}]** {p.get('product_name')}"
                url = p.get("url")
                markdown_output.append(f"- [{label}]({url})" if url else f"- {label}")

        markdown_output.append("\n### Recommendations")
        for r in recommendations:
            markdown_output.append(f"- {str(r)}")

        return {
            "final_output": "\n".join(markdown_output),
            "logs": ["State sanitation completed successfully."]
        }
    except Exception as e:
        print(f"Finalizer Agent Error: {e}")
        return {
            "final_output": f"# SEAMAS Product Evaluation Report\n\nExecution completed with warnings: {str(e)}",
            "logs": ["State sanitation completed successfully."]
        }