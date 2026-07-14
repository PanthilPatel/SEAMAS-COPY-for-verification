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
    prices = set()
    for match in re.finditer(r"(?:₹|rs\.?|\$)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE):
        following_text = text[match.end():match.end() + 15].lower()
        if "per g" in following_text or "/g" in following_text or "/kg" in following_text or "per kg" in following_text:
            continue
        try:
            prices.add(int(float(match.group(1).replace(",", ""))))
        except ValueError:
            continue
    return prices


def find_source_url(search_results: List[Dict[str, Any]], marketplace: str, price: int) -> str:
    for r in search_results:
        if r.get("engine") != marketplace:
            continue
        content = r.get("content") or ""
        if str(price) in content.replace(",", ""):
            return r.get("url", "")
    for r in search_results:
        if r.get("engine") == marketplace:
            return r.get("url", "")
    return ""


def is_specific_product_page(url: str) -> bool:
    if not url:
        return False

    from urllib.parse import urlparse
    path = urlparse(url).path.lower()
    last_segment = path.rstrip("/").split("/")[-1]

    category_keywords = [
        "collections", "category", "categories", "product-category",
        "brand", "brands", "shop-by", "catalog", "search", "impcat", "pr",
    ]
    if not last_segment or any(kw in path for kw in category_keywords):
        return False

    known_patterns = [
        r"/dp/[A-Z0-9]{6,}",
        r"/p/itm[a-z0-9]+",
        r"/p/[A-Z0-9]{6,}",
        r"-p-[a-z0-9]+",
        r"/p-[a-z0-9]{6,}",
        r"/product/[a-z0-9-]*\d",
        r"/products/[a-z0-9-]*\d",
    ]
    if any(re.search(pattern, url, re.IGNORECASE) for pattern in known_patterns):
        return True

    if len(last_segment) > 20 or re.search(r"\d{3,}", last_segment) or last_segment.count("-") >= 3:
        return True

    return False


async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")

    print("\n--- OLLAMA PRICE COMPARISON AGENT INITIATED ---")

    if not search_results:
        return {"price_data": [], "logs": ["No search results to extract prices from."]}

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
            model="qwen2.5:latest",
            messages=[{"role": "user", "content": prompt}],
            format=PriceComparisonResponse.model_json_schema(),
            options={
                "temperature": 0.3,
                "num_ctx": 8192,
                "num_predict": 16138,
            },
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
            source_url = find_source_url(search_results, marketplace, price)

            results.append({
                "product_name": str(row.get("product_name", "")).strip(),
                "marketplace": marketplace,
                "extracted_price": price,
                "status": status,
                "url": source_url,
                "is_verified": is_specific_product_page(source_url),
            })

        best_by_url = {}
        for r in results:
            key = r["url"] or r["product_name"]
            if key not in best_by_url or r["extracted_price"] < best_by_url[key]["extracted_price"]:
                best_by_url[key] = r
        results = list(best_by_url.values())

        if len(results) >= 2:
            values = sorted(r["extracted_price"] for r in results)
            median = values[len(values) // 2]
            results = [
                r for r in results
                if median * 0.05 <= r["extracted_price"] <= median * 15
            ]

        priced_urls = {r["url"] for r in results if r.get("url")}
        for r in search_results:
            url = r.get("url", "")
            if url in priced_urls:
                continue
            results.append({
                "product_name": r.get("title", "Untitled"),
                "marketplace": r.get("engine", "Web"),
                "extracted_price": None,
                "status": "No price found",
                "url": url,
                "is_verified": False,
            })

        priced_count = sum(1 for r in results if r.get("extracted_price") is not None)
        print(f"Extracted {priced_count} priced listing(s), {len(results) - priced_count} unpriced record(s) — {len(results)} total from {len(search_results)} search results.")
        return {"price_data": results, "logs": [f"Extracted {priced_count} priced, {len(results)} total records."]}

    except Exception as e:
        print(f"Price extraction failed: {e}")
        return {"price_data": [], "logs": [f"Price extraction failed: {e}"]}
