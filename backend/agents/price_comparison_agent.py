import os
from typing import Dict, Any, List
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class PriceItem(BaseModel):
    product_name: str = Field(description="Name or model of the product")
    marketplace: str = Field(description="Platform name e.g., Amazon, Flipkart, Star Tech")
    extracted_price: int = Field(description="Numeric price integer without currency symbols")
    status: str = Field(description="'Target Match' or 'Out of Budget'")

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Price Comparison Agent (Asynchronous & Schema Enforced)
    """
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    
    print(f"\n--- PRICE COMPARISON AGENT INITIATED ---")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not search_results:
        return {"price_data": [], "logs": ["Price comparison skipped or missing API key."]}
        
    client = genai.Client(api_key=api_key)
    
    context_data = "\n".join([
        f"Platform: {item.get('engine')}\nTitle: {item.get('title')}\nText: {item.get('content')}\n"
        for item in search_results
    ])
    
    prompt = f"""
    Extract specific structural product price rows matching the query: "{query}".
    Context text lines:
    {context_data}
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[PriceItem],
                temperature=0.1
            )
        )
        
        extracted_rows = [item.model_dump() for item in response.parsed] if response.parsed else []
        log_msg = f"Successfully extracted {len(extracted_rows)} real pricing rows."
        print(f"{log_msg}")
        
        return {
            "price_data": extracted_rows,
            "logs": [log_msg]
        }
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {"price_data": [], "logs": [f"Price extraction failed: {str(e)}"]}