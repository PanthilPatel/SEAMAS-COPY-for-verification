import json
import re
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field


class PriceItem(BaseModel):
    product_name: str = Field(description="Full product name including brand, model, storage/variant.")
    marketplace: str = Field(description="Store name, e.g. 'Amazon.in', 'Flipkart', 'Croma'.")
    extracted_price: int = Field(description="Price as a plain integer, no symbols or commas.")
    status: str = Field(description="'Target Match' or 'Out of Budget'.")


class PriceComparisonResponse(BaseModel):
    prices: List[PriceItem]


def clean_price(value: Any) -> int:
    """Turn whatever the model gave us ('89,990', '90k', '1.2L', 139.0) into a plain int."""
    if isinstance(value, (int, float)):
        return int(value)

    text = str(value).strip().replace(",", "").replace("₹", "").replace("Rs.", "").replace("$", "")

    try:
        if text.lower().endswith("k"):
            return int(float(text[:-1]) * 1_000)
        if text.lower().endswith("l"):
            return int(float(text[:-1]) * 100_000)
        if re.match(r"^[\d.]+$", text):
            return int(float(text))
    except ValueError:
        pass

    return 0


def prices_mentioned_in(text: str) -> set:
    """
    Every ₹/Rs/$ number that actually shows up in the raw search text.
    Used to sanity-check the model's output — Ollama sometimes inflates
    a price (e.g. reads ₹139 as 13900), and this catches it.
    Per-gram/per-kg prices are skipped since they're unit pricing noise,
    not the actual item price.
    """
    prices = set()
    for match in re.finditer(r"(?:₹|rs\.?|\$)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE):
        following_text = text[match.end():match.end() + 15].lower()
        if "per g" in following_text or "/g" in following_text or "/kg" in following_text or "per kg" in following_text:
            continue
        prices.add(int(float(match.group(1).replace(",", ""))))
    return prices


async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")

    print("\n--- OLLAMA PRICE COMPARISON AGENT INITIATED ---")

    if not search_results:
        return {"price_data": [], "logs": ["No search results to extract prices from."]}

    print(f"[DEBUG] Sample content: {[(r.get('content') or '')[:150] for r in search_results[:5]]}")

    context = "\n\n".join(
        f"[Record {i}]\nStore: {r.get('engine', 'Web')}\nTitle: {r.get('title', '')}\n"
        f"Content: {(r.get('content') or '')[:400]}"
        for i, r in enumerate(search_results, start=1)
    )

    prompt = f"""You are extracting product prices for Indian e-commerce.

Query: "{query}"

Look through the records below and pull out real price listings.
One row per store + product variant.

Rules:
- Use the store's actual name (Amazon.in, Flipkart, Croma...), never "Online" or "Web".
- Prices must be plain integers copied exactly as written — don't scale or round them.
  If the text says ₹139, the answer is 139, not 13900.
- If a price is in dollars ($), still extract it as a plain integer (e.g. $999 -> 999).
- Only include products that are actually the item being searched for, not unrelated
  accessories, reviews, or other products mentioned in passing.
- Skip anything with no clear price.

Records:
{context}
"""

    try:
        response = await AsyncClient().chat(
            model="llama3.1",
            messages=[{"role": "user", "content": prompt}],
            format=PriceComparisonResponse.model_json_schema(),
            options={"temperature": 0.05, "num_ctx": 8192},
        )

        rows = json.loads(response["message"]["content"]).get("prices", [])
        real_prices = prices_mentioned_in(context)

        results = []
        for row in rows:
            price = clean_price(row.get("extracted_price"))
            marketplace = str(row.get("marketplace", "")).strip()

            if price == 0 or marketplace.lower() in {"online", "web", "india", ""}:
                continue

            if price not in real_prices and price // 100 in real_prices:
                price = price // 100
            elif price not in real_prices:
                continue

            status = "Target Match" if not budget or price <= budget else "Out of Budget"

            results.append({
                "product_name": str(row.get("product_name", "")).strip(),
                "marketplace": marketplace,
                "extracted_price": price,
                "status": status,
            })

        if len(results) >= 3:
            median = sorted(r["extracted_price"] for r in results)[len(results) // 2]
            results = [r for r in results if r["extracted_price"] <= median * 15]

        print(f"Extracted {len(results)} price listings from {len(search_results)} search results.")
        return {"price_data": results, "logs": [f"Extracted {len(results)} price listings."]}

    except Exception as e:
        print(f"Price extraction failed: {e}")
        return {"price_data": [], "logs": [f"Price extraction failed: {e}"]}