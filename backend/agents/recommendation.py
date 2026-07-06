from typing import Dict, Any

async def recommendation_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    T9: Recommendation Agent Node.
    Consolidates Price data and Review Sentiments to calculate an optimized score.
    """
    price_data = state.get("price_data", [])
    analysis = state.get("analysis_report", {})
    
    print(f"\n--- RECOMMENDATION AGENT INITIATED: Evaluating Price & Sentiments ---")
    
    recommended_deals = []
    sentiment_summary = analysis.get("sentiment_summary", "").lower()
    
    if price_data:
        for item in price_data:
            base_score = 100000 - item.get("extracted_price", 0)  
            
            if "positive" in sentiment_summary or "high cost-to-performance" in sentiment_summary:
                base_score += 5000 
            
            recommended_deals.append({
                "store": item.get("marketplace"),
                "price": item.get("extracted_price"),
                "verdict": f"Scored and filtered using aggregated sentiment signals.",
                "confidence_score": round(min(max(base_score / 100000, 0.1), 0.99), 2)
            })
            
        recommended_deals.sort(key=lambda x: x["confidence_score"], reverse=True)
        
    return {
        "recommendations": recommended_deals,
        "logs": ["Successfully synthesized hybrid price-sentiment matrix values."]
    }