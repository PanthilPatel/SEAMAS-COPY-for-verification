import json
import re
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured Ollama Output
# ---------------------------------------------------------------------------
class PriceItem(BaseModel):
    product_name: str = Field(
        description=(
            "Full descriptive name including brand, model, and variant. "
            "For electronics include storage/RAM (e.g. 'Samsung Galaxy S24 Ultra 256GB'). "
            "For non-electronics include natural variant (e.g. 'SanDisk Extreme SSD 4TB')."
        )
    )
    marketplace: str = Field(
        description=(
            "Exact storefront name as it appears in the Store field of the context record. "
            "Examples: 'Amazon.in', 'Flipkart', 'Croma', 'Reliance Digital', 'Vijay Sales'. "
            "Do NOT use generic values like 'Online' or 'India'."
        )
    )
    extracted_price: int = Field(
        description=(
            "Numeric price as an absolute integer with NO currency symbol or commas. "
            "Convert ALL shorthand: '90k' → 90000, '1.2L' → 120000, '₹89,990' → 89990. "
            "If multiple prices appear for the same store+variant, use the lowest (sale) price."
        )
    )
    status: str = Field(
        description="'Target Match' if price is within the user's budget, otherwise 'Out of Budget'."
    )


class PriceComparisonResponse(BaseModel):
    prices: List[PriceItem]


# ---------------------------------------------------------------------------
# Price Normalisation Helper (post-LLM safety net)
# ---------------------------------------------------------------------------
def _sanitize_price(raw_price: Any) -> int:
    """
    Converts whatever the LLM returned into a clean integer.
    Handles strings like '89,990', '90k', '1.2L', floats, etc.
    """
    if isinstance(raw_price, int):
        return raw_price
    if isinstance(raw_price, float):
        return int(raw_price)
    s = str(raw_price).strip().replace(",", "").replace("₹", "").replace("Rs.", "").strip()
    # Handle shorthand: 90k, 90K
    k_match = re.match(r"^([\d.]+)\s*[kK]$", s)
    if k_match:
        return int(float(k_match.group(1)) * 1_000)
    # Handle lakh shorthand: 1.2L, 1L
    l_match = re.match(r"^([\d.]+)\s*[lL]$", s)
    if l_match:
        return int(float(l_match.group(1)) * 100_000)
    # Plain numeric
    num_match = re.match(r"^[\d.]+$", s)
    if num_match:
        return int(float(s))
    return 0


# ---------------------------------------------------------------------------
# LangGraph Node
# ---------------------------------------------------------------------------
async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query          = state.get("query", "")
    budget_ceiling = state.get("budget_status", {}).get("ceiling", None)

    print(f"\n--- OLLAMA PRICE COMPARISON AGENT INITIATED ---")

    if not search_results:
        return {"price_data": [], "logs": ["Price comparison skipped — no input snippets."]}

    context_blocks = []
    for idx, item in enumerate(search_results, start=1):
        store   = item.get("engine", "Web")
        title   = item.get("title", "")
        content = item.get("content", "")
        url     = item.get("url", "")
        context_blocks.append(
            f"[Record {idx}]\n"
            f"Store  : {store}\n"
            f"Title  : {title}\n"
            f"Content: {content}\n"
            f"URL    : {url}"
        )

    context_data = "\n\n".join(context_blocks)

    budget_instruction = (
        f"The user's maximum budget is Rs. {budget_ceiling}. "
        f"Mark 'status' as 'Target Match' if extracted_price <= {budget_ceiling}, "
        f"else 'Out of Budget'."
        if budget_ceiling
        else "Mark 'status' as 'Target Match' for all items (no budget ceiling provided)."
    )

    prompt = f"""You are a precision price extraction engine for Indian e-commerce.

Query: "{query}"
{budget_instruction}

TASK:
Analyse ALL records below and extract INDIVIDUAL price line items.
Produce ONE row per UNIQUE combination of (Store + Product Variant).

STRICT RULES:
1. Use the exact "Store" value from each record as the `marketplace` field.
   Valid storefronts: Amazon.in, Flipkart, Croma, Reliance Digital, Vijay Sales, Tata Cliq, etc.
   Do NOT output "Online", "Web", or vague marketplace names.
2. For electronics (phones, laptops, SSDs, TVs): create separate rows for each storage/RAM variant.
3. For non-electronics (bottles, shoes, cables): use natural variants (size, colour, pack).
4. `extracted_price` MUST be a full integer — no symbols, no commas, no shorthand.
   Convert: "90k" → 90000 | "₹89,990" → 89990 | "1.2L" → 120000
5. If a record contains multiple prices for one store, use the LOWEST (sale/offer) price.
6. Skip any record with no parseable price.
7. Do NOT invent stores or prices not present in the context.

Context Records:
{context_data}
"""

    try:
        response = await AsyncClient().chat(
            model="llama3.1",
            messages=[{"role": "user", "content": prompt}],
            format=PriceComparisonResponse.model_json_schema(),
            options={"temperature": 0.05},
        )

        raw_content = response["message"]["content"]
        parsed_json = json.loads(raw_content)
        raw_rows    = parsed_json.get("prices", [])

        # Post-process: sanitize prices and filter bad rows
        cleaned_rows = []
        for row in raw_rows:
            price = _sanitize_price(row.get("extracted_price", 0))
            if price == 0:
                continue  # Skip rows where price could not be parsed
            marketplace = str(row.get("marketplace", "")).strip()
            if not marketplace or marketplace.lower() in {"online", "web", "india", "internet"}:
                continue  # Skip non-informative marketplace tags
            cleaned_rows.append(
                {
                    "product_name":    str(row.get("product_name", "")).strip(),
                    "marketplace":     marketplace,
                    "extracted_price": price,
                    "status":          str(row.get("status", "Target Match")).strip(),
                }
            )

        log_msg = (
            f"Ollama extracted {len(cleaned_rows)} verified pricing records "
            f"from {len(search_results)} search snippets."
        )
        print(log_msg)
        return {"price_data": cleaned_rows, "logs": [log_msg]}

    except Exception as e:
        print(f"Ollama Extraction Error: {e}")
        return {
            "price_data": [],
            "logs": [f"Ollama price extraction failed: {str(e)}"],
        }