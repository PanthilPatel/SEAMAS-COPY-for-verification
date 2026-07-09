from typing import Dict, Any

async def recommendation(state: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- RECOMMENDATION AGENT INITIATED ---")
    
    try:
        price_data = state.get("price_data", [])
        analysis_report = state.get("analysis_report", {})
        budget_status = state.get("budget_status", {})
        
        recommendation_list = []
        
        if price_data:
            recommendation_list.append(f"Found {len(price_data)} relevant marketplace listings.")
            valid_prices = [x for x in price_data if isinstance(x.get("extracted_price"), (int, float))]
            
            if valid_prices:
                lowest_deal = min(valid_prices, key=lambda x: x.get("extracted_price"))
                recommendation_list.append(
                    f"Best deal found at {lowest_deal.get('marketplace')} for Rs. {lowest_deal.get('extracted_price')}."
                )
            else:
                recommendation_list.append(" Listings found, but prices could not be numerically verified.")
        else:
            recommendation_list.append("No clear pricing matches extracted from the raw search data.")
            
        sentiment = analysis_report.get("sentiment_summary", "")
        if sentiment and sentiment != "No data":
            recommendation_list.append(f"Market sentiment analysis: {sentiment}")
        
        status_msg = budget_status.get("status", "Evaluation complete.")
        recommendation_list.append(f"Budget assessment: {status_msg}")
        
        print("Final product evaluation compiled.")
        return {
            "recommendations": recommendation_list,
            "logs": ["Recommendation engine resolved successfully."]
        }
        
    except Exception as e:
        print(f"CRITICAL RUNTIME CRASH: {str(e)}")
        return {
            "recommendations": [f"Recommendation engine failed to parse internal data details."],
            "logs": [f"Crash log: {str(e)}"]
        }

recommendation_agent = recommendation