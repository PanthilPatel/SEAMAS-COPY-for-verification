import os
import json
from typing import Dict, Any
from google import genai
from google.genai import types

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses live search results using Gemini structured outputs to extract clean pricing matrices.
    """
    search_results = state.get("search_results", [])
    query = state.get("query", "")

    print("---PRICE COMPARISON AGENT INITIATED: Extracting Real Market Metrices ---")
    
    if not search_results:
        print("No search data available for price extraction.")
        return {"price_data": [], "logs": ["No web data available to parse prices."]}

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY missing from the environment. Falling back to mock data structures.")
        return {
            "price_data": [{"marketplace": "Error", "extracted_price": 0, "status": "Missing API Key"}],
            "logs": ["Failed price extraction due to missing API configurations."]
        }

    client = genai.Client(api_key=api_key)

    context_data = "\n".join([
        f"Source [{item.get('engine')}]: {item.get('title')}\nContent: {item.get('content')}\n"
        for item in search_results
    ])

    prompt = f"""
    You are a data extraction sub-agent specialized in e-commerce pricing matrix analysis.
    Analyze the following raw web text data collected for the target intent: "{query}".
    Extract up to 3 real, distinct marketplace listings or price estimations mentioned in the text.

    Return a clean JSON array containing objects with EXACTLY these four keys:
    - "product_name": The specific name/model of the smartphone or product. Be specific!
    - "marketplace" (String: Name of the store or source)
    - "extracted_price": The numerical price value as an integer. Strip out all currency symbols (₹, etc.) and commas.
    - "status": A brief performance comment based on the target benchmark query (e.g., 'Target Match', 'Budget Deal', or 'Market Average').

    Do not include any other text or explanation outside the JSON structure.

    Raw Search Context:
    {context_data}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents = prompt,
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        extracted_data = json.loads(response.text)
        print(f"Successfully extracted {len(extracted_data)} real pricing rows from live web results.")

        return {
            "price_data": extracted_data,
            "logs": [f"Successfully extracted live structured pricing data."]
        }
    
    except Exception as e:
        print(f"Gemini Pricing Extraction Failure: {e}")
        return {
            "price_data": [],
            "logs": [f"Price comparison failed: {str(e)}"]
        }
