import json
import re
from typing import Dict, Any, List, Optional
from ollama import AsyncClient
from pydantic import BaseModel, Field

class PriceItem(BaseModel):
    product_name: str = Field(description="Full product name including brand, model, and style specification.")
    marketplace: str = Field(description="Exact storefront name, e.g. 'Amazon', 'Flipkart', 'Myntra'.")
    extracted_price: int = Field(description="Price as a plain integer without symbols or commas.")
    currency: str = Field(default="₹", description="Currency symbol of the listing, e.g., ₹ or $.")
    brand: Optional[str] = Field(default=None, description="Brand name of the product.")
    rating:  Optional[float] = Field(default=0.0, description="Product rating value out of 5 stars (e.g., 4.5).")
    reviews: Optional[int] = Field(default=0, description="Total number of customer reviews counted.")
    delivery: Optional[str] = Field(default="Standard Delivery", description="Delivery info like 'Free Delivery' or 'Delivery charges apply'.")
    discount: Optional[str] = Field(default=None, description="Discount text if present, e.g., '20% OFF'.")
    image_url: str = Field(description="Clean, direct image asset link of the actual product.")
    url: str = Field(description="Direct target URL page to purchase the product.")
    status: str = Field(default="Target Match")
    
class PriceComparisonResponse(BaseModel):
    prices: List[PriceItem]
    detected_category: str = Field(description="Broad classification segment: 'clothing', 'electronics', or 'general'.")

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

def find_source_record(search_results: List[Dict[str, Any]], marketplace: str, price: int) -> Dict[str, Any]:
    for r in search_results:
        if r.get("engine") != marketplace and marketplace.lower() not in (r.get("url") or "").lower():
            continue
        content = r.get("content") or ""
        title = r.get("title") or ""
        combined = (title + " " + content).replace(",", "")
        if str(price) in combined:
            return r
    for r in search_results:
        if marketplace.lower() in (r.get("url") or "").lower():
            return r
    return {}

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

def select_real_product_image(matched_rec: Dict[str, Any]) -> str:
    tavily_images = matched_rec.get("images", [])
    logo_signatures = [
        "logo", "badge", "rating", "icon", "favicon", "banner", "avatar", 
        "brand", "header", "footer", "sprite", "og-image", "og_image",
        "myntra", "amazon", "flipkart", "croma", "peterengland", "octave", "superkicks"
    ]
    if isinstance(tavily_images, list) and len(tavily_images) > 0:
        for img in tavily_images:
            img_str = str(img).lower()
            if not any(sig in img_str for sig in logo_signatures):
                return img
        if not any(sig in str(tavily_images[0]).lower() for sig in ["logo", "banner"]):
            return tavily_images[0]
            
    fallback_thumb = matched_rec.get("thumbnail") or matched_rec.get("img_src") or matched_rec.get("thumbnail_src") or ""
    if fallback_thumb and not any(sig in str(fallback_thumb).lower() for sig in logo_signatures):
        return fallback_thumb
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80"

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")

    print("\n--- OLLAMA INTENT-CLASSIFYING PRICE COMPARISON INITIATED ---")
    if not search_results:
        return {"price_data": [], "category": "general", "logs": ["No search results found."]}

    junk_keywords = ["capsule", "mutual fund", "small-cap", "mid-cap", "flexi-cap", "glassdoor", "interview", "securities"]
    filtered_records = []
    for r in search_results:
        url = r.get("url", "").lower()
        title_content = (r.get("title", "") + " " + (r.get("content") or "")).lower()
        if any(junk in title_content for junk in junk_keywords) or "youtube.com" in url or "youtu.be" in url:
            continue
        filtered_records.append(r)

    if not filtered_records:
        return {"price_data": [], "category": "general", "logs": ["All structural noise filtered out."]}

    context = "\n\n".join(
        f"[Record {i}]\nStore: {r.get('engine', 'Web')}\nTitle: {r.get('title', '')}\nContent: {(r.get('content') or '')[:1000]}"
        for i, r in enumerate(filtered_records, start=1)
    )

    prompt = f"""You are a multi-agent parser extracting e-commerce arrays.
Query: "{query}"

Analyze the dataset records. Deduce if this query targets 'clothing' or 'electronics' or 'general'.
Extract every valid product matching the intent with its metadata attributes.

Rules:
- For clothing items: extract attributes like 'color', 'size' (e.g. S, M, L, XL, XXL) if stated.
- Parse standard integer discounts (e.g., if text says '40% off', discount_percentage is 40).

Records:
{context}
"""

    try:
        response = await AsyncClient().chat(
            model="qwen2.5:latest",
            messages=[{"role": "user", "content": prompt}],
            format=PriceComparisonResponse.model_json_schema(),
            options={"temperature": 0.2, "num_ctx": 8192},
        )

        parsed_payload = json.loads(response["message"]["content"])
        rows = parsed_payload.get("prices", [])
        detected_category = parsed_payload.get("detected_category", "general")
        
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
            matched_rec = find_source_record(filtered_records, marketplace, price)
            
            results.append({
                "product_name": str(row.get("product_name", "")).strip(),
                "marketplace": marketplace,
                "extracted_price": price,
                "status": status,
                "url": matched_rec.get("url", ""),
                "is_verified": is_specific_product_page(matched_rec.get("url", "")),
                "image_url": select_real_product_image(matched_rec),
                "color": row.get("color"),
                "size": row.get("size"),
                "discount_percentage": row.get("discount_percentage", 0)
            })

        # Drop duplicates by URL/Name
        best_by_url = {}
        for r in results:
            key = r["url"] or r["product_name"]
            if key not in best_by_url or r["extracted_price"] < best_by_url[key]["extracted_price"]:
                best_by_url[key] = r
        results = list(best_by_url.values())

        return {
            "price_data": results, 
            "category": detected_category, 
            "logs": [f"Successfully matched category context: {detected_category}"]
        }

    except Exception as e:
        print(f"Price comparison classification agent execution error: {e}")
        return {"price_data": [], "category": "general", "logs": [str(e)]}