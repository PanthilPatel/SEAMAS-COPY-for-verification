import json
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field

class PriceItem(BaseModel):
    product_name: str = Field(description="Name, model, and specific variant of the product, e.g., iPhone 15 Pro Max (256GB) or Stainless Steel Water Bottle (1 Litre)")
    marketplace: str = Field(description="Platform name e.g., Amazon, Flipkart")
    extracted_price: int = Field(description="Numeric price integer without currency symbols. Convert shorthand notations like 'k', 'K', or 'thousand' to full numeric integers (e.g., 90k/90K/90 thousand -> 90000). Always output the full absolute value.")
    status: str = Field(description="'Target Match' or 'Out of Budget'")

class PriceComparisonResponse(BaseModel):
    prices: List[PriceItem]

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    
    print(f"\n--- OLLAMA PRICE COMPARISON AGENT INITIATED ---")
    if not search_results:
        return {"price_data": [], "logs": ["Price comparison skipped - no input snippets."]}

    context_data = "\n".join([
        f"Platform: {item.get('engine')}\nTitle: {item.get('title')}\nText: {item.get('content')}\n"
        for item in search_results
    ])
    
    prompt = f"""
    Analyze the following web context data for the query: '{query}'.
    Identify and extract the pricing for the individual variants mentioned in the context.
    
    EXTRACTION RULES:
    1. Only if the query/product is an electronic device with storage sizes (like phones or laptops), extract separate entries for each capacity option (e.g., 128GB, 256GB) found.
    2. For regular household items, lifestyle products, or accessories (like water bottles, clothes, or shoes), extract their natural variations like size, volume, capacity (e.g., 1 Litre, 750ml, Pack of 2, Blue), or just their clean brand title. Do NOT invent 'GB' fields for non-electronic items.
    3. Convert all price shorthands to full integers. If a price is listed as "90k", "90K", or "90,000", you MUST extract it as 90000.
    4. The 'extracted_price' field must contain the absolute numeric integer value.
    
    Context data:
    {context_data}
    """
    
    try:
        response = await AsyncClient().chat(
            model='llama3.1',
            messages=[{'role': 'user', 'content': prompt}],
            format=PriceComparisonResponse.model_json_schema(), 
            options={'temperature': 0.1}
        )
        
        raw_content = response['message']['content']
        parsed_json = json.loads(raw_content)
        extracted_rows = parsed_json.get("prices", [])
        
        log_msg = f"Ollama extracted {len(extracted_rows)} pricing records successfully."
        print(f"{log_msg}")
        return {"price_data": extracted_rows, "logs": [log_msg]}
        
    except Exception as e:
        print(f"Ollama Extraction Error: {e}")
        return {"price_data": [], "logs": [f"Ollama extraction failed: {str(e)}"]}