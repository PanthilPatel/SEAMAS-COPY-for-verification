import json
import re
from typing import Dict, Any, List
from ollama import AsyncClient
from pydantic import BaseModel, Field

class PriceItem(BaseModel):
    product_name: str = Field(description="Full product name including brand and style description.")
    marketplace: str = Field(description="Store name, e.g. 'Flipkart', 'Urban Monkey', 'Amazon.in'.")
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
    for match in re.finditer(r"(?:₹|rs\.?|\$|inr)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE):
        following_text = text[match.end():match.end() + 15].lower()
        if "per g" in following_text or "/g" in following_text or "/kg" in following_text or "per kg" in following_text:
            continue
        try:
            prices.add(int(float(match.group(1).replace(",", ""))))
        except ValueError:
            continue
    for match in re.finditer(r"\b\d{2,6}\b", text):
        try:
            prices.add(int(match.group(0)))
        except ValueError:
            continue
    return prices

def find_source_url(search_results: List[Dict[str, Any]], marketplace: str, price: int) -> str:
    for r in search_results:
        if r.get("engine") != marketplace and marketplace.lower() not in (r.get("url") or "").lower():
            continue
        content = r.get("content") or ""
        title = r.get("title") or ""
        combined = (title + " " + content).replace(",", "")
        if str(price) in combined:
            return r.get("url", "")
    for r in search_results:
        if marketplace.lower() in (r.get("url") or "").lower():
            return r.get("url", "")
    return ""

def is_specific_product_page(url: str) -> bool:
    if not url:
        return False

    from urllib.parse import urlparse
    parsed = urlparse(url)
    path = parsed.path.lower()
    domain = parsed.netloc.lower()
    last_segment = path.rstrip("/").split("/")[-1]

    brand_pass = ["urbanmonkey.com", "neweracap.in", "supervek.in"]
    if any(b in domain for b in brand_pass):
        if not any(word in path for word in ["about", "contact", "privacy", "terms"]):
            return True

    category_keywords = [
        "/category", "/categories", "/product-category", "/brands", "/shop-by", 
        "/catalog", "search", "impcat", "/list-of-", "buying-guide", "product-reviews", 
        "/reviews", "employee-review", "mutual-funds"
    ]
    if any(kw in path for kw in category_keywords):
        return False

    known_patterns = [
        r"/dp/[a-z0-9]{10}",        
        r"/p/itm[a-z0-9]+",           
        r"/product/[a-z0-9-]",        
        r"/products/[a-z0-9-]",       
        r"/buy-[a-z0-9-]"             
    ]
    if any(re.search(pattern, path, re.IGNORECASE) for pattern in known_patterns):
        return True

    if len(last_segment) > 20 or re.search(r"\d{4,}", last_segment) or last_segment.count("-") >= 3:
        if not any(word in path for word in ["review", "blog", "news", "article"]):
            return True

    return False

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")

    print("\n--- OLLAMA PRICE COMPARISON AGENT INITIATED ---")

    if not search_results:
        return {"price_data": [], "logs": ["No search results to extract prices from."]}

    junk_keywords = [
        "capsule", "mutual fund", "small-cap", "mid-cap", "flexi-cap", 
        "glassdoor", "interview", "jumper cap", "securities", "assimilation"
    ]
    
    filtered_records = []
    for r in search_results:
        url = r.get("url", "").lower()
        title_content = (r.get("title", "") + " " + (r.get("content") or "")).lower()
        if any(junk in title_content for junk in junk_keywords):
            continue
        
        if "youtube.com" in url or "youtu.be" in url:
            continue
        if any(pc in url for pc in ["/news/", "/article/", "/articles/", "/blog/", "/blogs/", "/press-release/", "/press/"]):
            continue
        
        from urllib.parse import urlparse
        try:
            domain = urlparse(url).netloc.lower()
        except Exception:
            domain = ""
        if any(dk in domain for dk in ["news", "article", "blog", "youtube", "twitter", "reddit", "quora", "facebook", "instagram"]):
            continue
            
        filtered_records.append(r)

    if not filtered_records:
        return {"price_data": [], "logs": ["All results flagged as semantic noise."]}

    context = "\n\n".join(
        f"[Record {i}]\nStore: {r.get('engine', 'Web')}\nTitle: {r.get('title', '')}\n"
        f"Content: {(r.get('content') or '')[:1000]}"
        for i, r in enumerate(filtered_records, start=1)
    )

    prompt = f"""You are extracting structural retail product prices for e-commerce.
Query: "{query}"

Look through the real records below and extract verified prices for actual headwear/hats/caps.
One row per variant or storefront offer.

Rules:
- Never include software, stock tickers, financial mutual funds, or medical pills.
- Extract the actual merchant store brand (e.g., 'Urban Monkey', 'Flipkart', 'Tata Cliq').
- Prices must be extracted as plain numbers exactly as written.

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
        full_text_corpus = context + "\n" + "\n".join(r.get("title", "") for r in filtered_records)
        real_prices = prices_mentioned_in(full_text_corpus)

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
            source_url = find_source_url(filtered_records, marketplace, price)

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

        priced_urls = {r["url"] for r in results if r.get("url")}
        for r in filtered_records:
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
        print(f"Extracted {priced_count} priced listing(s) after noise filtration.")
        return {"price_data": results, "logs": [f"Processed {len(results)} sanitized rows."]}

    except Exception as e:
        print(f"Price extraction failed: {e}")
        return {"price_data": [], "logs": [f"Price extraction failed: {e}"]}
