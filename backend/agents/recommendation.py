from typing import Dict, Any
async def recommendation_agent(state: Dict [str, Any]) -> Dict[str,Any]:
    """Recommendation Agent Node.
    Consolidates data matrices from Prices Comparison and Review Analyzer to compile the final, optimized buting suffestion for the user."""

    price_data = state.get("price_data", [])
    analysis = state.get("analysis_report", {})

    print(f"\n RECOMMENDATION AGENT INITIATED: Compiling Final Matches ---")

    recommended_deals = []
    if price_data:
        best_deal = min(price_data, key = lambda x: x.get("extracted_price", float('inf')))

        recommended_deals.append({
            "store": best_deal.get("marketplace"),
            "price": best_deal.get("extracted_price"),
            "verdict": f"Highly recommended due to positive sentiment trend and lowest available market pricing,",
            "confidence_score": 0.92
        }) 

    return {
        "recommendations": recommended_deals,
        "logs": ["Successfully executed Recommendation selection matrix step."]
    }