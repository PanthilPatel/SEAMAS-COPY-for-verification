import json
import re
import os
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
    image_url: Optional[str] = Field(default="", description="Clean, direct image asset link of the actual product.")
    url: Optional[str] = Field(default="", description="Direct target URL page to purchase the product.")
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
    
    # 1. Match symbol-preceded prices (very reliable, e.g. ₹59,900, Rs. 14,900)
    for match in re.finditer(r"(?:₹|rs\.?|\$|inr)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE):
        following_text = text[match.end():match.end() + 15].lower()
        if "per g" in following_text or "/g" in following_text or "/kg" in following_text or "per kg" in following_text:
            continue
        try:
            val = int(float(match.group(1).replace(",", "")))
            if val > 0:
                prices.add(val)
        except ValueError:
            continue
            
    if prices:
        return prices

    # 2. Extract bare numbers only as a fallback, applying strict specs units filtering
    # Only allow 4 to 6 digit numbers (between 1,000 and 999,999) to avoid specs
    for match in re.finditer(r"\b(\d{4,6})\b", text):
        val_str = match.group(1)
        val = int(val_str)
        
        start_idx = max(0, match.start() - 15)
        end_idx = min(len(text), match.end() + 15)
        context_around = text[start_idx:end_idx].lower()
        
        forbidden_suffixes = [
            "gb", "tb", "mb", "kb", "ghz", "hz", "mah", "inch", "gen", "th", "rd", "st", "nd",
            "series", "px", "pixel", "resolution", "core", "thread", "watt", "volt", "amp",
            "rpm", "fps", "x", "p", "k", "%", "percent"
        ]
        
        match_end = match.end()
        following = text[match_end:match_end + 10].strip().lower()
        if any(following.startswith(fs) for fs in forbidden_suffixes):
            continue
            
        if any(word in context_around for word in ["year", "model", "since", "released in", "dated"]):
            if val in [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]:
                continue
                
        prices.add(val)
        
    return prices

def find_source_record(search_results: List[Dict[str, Any]], marketplace: str, price: int) -> Dict[str, Any]:
    m_clean = re.sub(r"\s+", "", marketplace.lower())
    m_clean = re.sub(r"(india|official|store|online|shop|corporation|inc|co|ltd)$", "", m_clean)
    
    for r in search_results:
        engine = (r.get("engine") or "").lower()
        engine_clean = re.sub(r"\s+", "", engine)
        url = (r.get("url") or "").lower()
        url_clean = re.sub(r"\s+", "", url)
        
        match_engine = (m_clean in engine_clean) or (engine_clean in m_clean)
        match_url = (m_clean in url_clean) or (url_clean in m_clean) or any(w in url_clean for w in m_clean.split() if len(w) > 3)
        
        if not match_engine and not match_url:
            continue
            
        content = r.get("content") or ""
        title = r.get("title") or ""
        combined = (title + " " + content).replace(",", "")
        if str(price) in combined:
            return r
            
    for r in search_results:
        engine = (r.get("engine") or "").lower()
        engine_clean = re.sub(r"\s+", "", engine)
        url = (r.get("url") or "").lower()
        url_clean = re.sub(r"\s+", "", url)
        
        match_engine = (m_clean in engine_clean) or (engine_clean in m_clean)
        match_url = (m_clean in url_clean) or (url_clean in m_clean) or any(w in url_clean for w in m_clean.split() if len(w) > 3)
        
        if match_engine or match_url:
            return r
            
    return {}

def is_specific_product_page(url: str) -> bool:
    if not url:
        return False
    from urllib.parse import urlparse
    parsed = urlparse(url)
    path = parsed.path.lower()
    domain = parsed.netloc.lower()
    
    known_domains = [
        "amazon.in", "amazon.com", "flipkart.com", "croma.com", "reliancedigital.in", 
        "vijaysales.com", "tatacliq.com", "snapdeal.com", "myntra.com", "meesho.com", 
        "paytmmall.com", "nykaa.com", "shopsy.in", "jiomart.com", "samsung.com", 
        "apple.com", "mi.com", "oneplus.com", "realme.com", "asus.com", "lg.com", "sony.com"
    ]
    is_known_store = any(kd in domain for kd in known_domains)

    brand_pass = ["urbanmonkey.com", "neweracap.in", "supervek.in"]
    if any(b in domain for b in brand_pass):
        if not any(word in path for word in ["about", "contact", "privacy", "terms"]):
            return True

    category_keywords = [
        "/category", "/categories", "/product-category", "/brands", "/shop-by", 
        "/catalog", "search", "impcat", "/list-of-", "buying-guide", "product-reviews", 
        "/reviews", "employee-review", "mutual-funds", "/s?", "search?", "query="
    ]
    if any(kw in path for kw in category_keywords) or any(kw in parsed.query for kw in ["k=", "q=", "search"]):
        return False

    # Marketplace-specific checks to filter out catalog/listing/search URLs
    if "amazon." in domain:
        if not any(pat in path for pat in ["/dp/", "/gp/product/", "/gp/"]):
            return False
    elif "flipkart.com" in domain:
        if "/p/" not in path:
            return False
    elif "myntra.com" in domain:
        if "/buy" not in path:
            return False
    elif "meesho.com" in domain:
        if "/p/" not in path:
            return False
    elif "nykaa.com" in domain:
        if not any(pat in path for pat in ["/p/", "/product/"]):
            return False
    elif "shopsy.in" in domain:
        if "/p/" not in path:
            return False
    elif "jiomart.com" in domain:
        if not any(pat in path for pat in ["/p/", "/products/"]):
            return False
    elif "snapdeal.com" in domain:
        if "/product/" not in path:
            return False
    elif "tatacliq.com" in domain:
        if not any(pat in path for pat in ["/p-", "/product/"]):
            return False
    elif "croma.com" in domain:
        if "/p/" not in path:
            return False
    elif "reliancedigital.in" in domain:
        if "/p/" not in path:
            return False

    if is_known_store:
        clean_path = path.strip("/")
        if clean_path and "/" in clean_path:
            last_segment = clean_path.split("/")[-1]
            generic_categories = {
                "watches", "shoes", "laptops", "mobiles", "phones", "tvs", "televisions", 
                "monitors", "headphones", "accessories", "bags", "shirts", "tshirts", 
                "jeans", "dresses", "kurtas", "clothing", "electronics", "appliances",
                "search", "catalog", "category", "categories", "brands", "brand"
            }
            if last_segment not in generic_categories:
                return True

    known_patterns = [
        r"/dp/[a-z0-9]{10}",        
        r"/p/itm[a-z0-9]+",           
        r"/product/[a-z0-9-]",        
        r"/products/[a-z0-9-]",       
        r"/buy-[a-z0-9-]",
        r"/buy$"
    ]
    if any(re.search(pattern, path, re.IGNORECASE) for pattern in known_patterns):
        return True

    last_segment = path.rstrip("/").split("/")[-1]
    if len(last_segment) > 20 or re.search(r"\d{4,}", last_segment) or last_segment.count("-") >= 3:
        if not any(word in path for word in ["review", "blog", "news", "article", "picks", "guide", "best-", "-best", "versus", "-vs-", "comparison"]):
            return True
    return False

def select_real_product_image(matched_rec: Dict[str, Any], product_name: str = "", all_records: List[Dict[str, Any]] = None) -> str:
    forbidden_patterns = [
        "logo", "badge", "rating", "icon", "favicon", "avatar", "sprite", "og-image", "og_image",
        "header", "footer", "nav", "menu", "theme", "bg-", "background", "sidebar", "widget",
        "banner", "billboard", "slider", "carousel", "hero-", "promotional", "campaign", "ad-",
        "myntra-logo", "flipkart-logo", "amazon-logo", "zimson-logo", "ajio-logo", "luxe",
        "horizontal", "landscape", "square-logo", "brand-identity", "store-front", "retailer"
    ]

    tavily_images = matched_rec.get("images", [])
    
    if isinstance(tavily_images, list) and len(tavily_images) > 0:
        for img in tavily_images:
            img_str = str(img).lower()
            if any(pattern in img_str for pattern in forbidden_patterns):
                continue
            if any(decoration in img_str for decoration in ["vector", "illustration", "graphic", "clipart"]):
                continue
            return img

    fallback_thumb = matched_rec.get("thumbnail") or matched_rec.get("img_src") or matched_rec.get("thumbnail_src") or ""
    if fallback_thumb:
        thumb_str = str(fallback_thumb).lower()
        if not any(pattern in thumb_str for pattern in forbidden_patterns) and not any(dec in thumb_str for dec in ["vector", "banner", "logo"]):
            return fallback_thumb

    # Search entire search results corpus for a matching thumbnail image if matched_rec has none
    if all_records and product_name:
        # Extract all significant words, excluding super-generic ones
        generic_words = {
            "with", "from", "inch", "full", "backlit", "panel", "brand", "official", "store",
            "laptop", "phone", "shoe", "stand", "buy", "online", "india", "price", "best",
            "new", "set", "pack", "combo", "value", "deal", "offer", "free", "delivery",
            "and", "for", "the", "pro", "max", "plus", "lite", "mini", "ultra"
        }
        prod_words = [w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", product_name)
                      if w.lower() not in generic_words]

        if prod_words:
            # The first significant word is almost always the brand/unique ID — it MUST match
            brand_word = prod_words[0]
            # Need strict match: brand present + at least 2 more specific words match
            required_matches = max(2, min(3, len(prod_words)))

            for r in all_records:
                thumb = r.get("thumbnail") or r.get("img_src") or r.get("thumbnail_src") or ""
                if not thumb:
                    continue
                thumb_str = str(thumb).lower()
                if any(pattern in thumb_str for pattern in forbidden_patterns) or any(dec in thumb_str for dec in ["vector", "banner", "logo"]):
                    continue
                # Skip unsplash — that's a category fallback, not a real product image
                if "unsplash.com" in thumb_str:
                    continue

                title_lower = r.get("title", "").lower()
                # Brand/unique word MUST be present in the title
                if brand_word not in title_lower:
                    continue
                match_count = sum(1 for w in prod_words if w in title_lower)
                if match_count >= required_matches:
                    return thumb

    # Dynamically select a beautiful category-specific fallback image
    prod_name_lower = product_name.lower()
    if any(k in prod_name_lower for k in ["shoe", "sneaker", "boot", "footwear", "sandal", "clog", "puma", "adidas", "nike", "reebok", "under armour", "asics", "skechers", "crocs"]):
        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
    elif any(k in prod_name_lower for k in ["laptop", "notebook", "macbook", "computer", "pc", "asus", "hp", "dell", "lenovo", "acer", "msi", "strix", "thinkpad", "ideapad", "predator", "inspiron", "latitude", "zenbook", "vivobook", "ryzen", "intel core", "g16", "g15", "rog"]):
        return "https://images.unsplash.com/photo-1496181130204-755241544e35?w=400&q=80"
    elif any(k in prod_name_lower for k in ["phone", "iphone", "mobile", "samsung", "pixel", "oneplus", "smartphone", "galaxy", "redmi", "realme", "xiaomi", "vivo", "oppo", "motorola", "moto", "infinix", "tecno", "x300", "x30"]):
        return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"
    elif any(k in prod_name_lower for k in ["monitor", "tv", "display", "screen", "led", "ips", "panel", "backlit"]):
        return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80"
    elif "watch" in prod_name_lower:
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
    elif any(k in prod_name_lower for k in ["headphone", "earbud", "pods", "audio", "soundbar", "earphones", "headset", "tws", "airpods"]):
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
        
    return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80"

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")

    print("\n--- OLLAMA INTENT-CLASSIFYING PRICE COMPARISON INITIATED ---")
    if not search_results:
        print("[PriceAgent] No search_results received — nothing to extract from.")
        return {"price_data": [], "category": "general", "logs": ["No search results found."]}

    junk_keywords = ["capsule", "mutual fund", "small-cap", "mid-cap", "flexi-cap", "glassdoor", "interview", "securities"]
    # Only filter on junk keywords that are NOT mentioned in the search query to prevent false-positives
    active_junk_keywords = [j for j in junk_keywords if j not in query.lower()]
    
    filtered_records = []
    for r in search_results:
        url = r.get("url", "").lower()
        title_content = (r.get("title", "") + " " + (r.get("content") or "")).lower()
        if any(junk in title_content for junk in active_junk_keywords) or "youtube.com" in url or "youtu.be" in url:
            continue
        filtered_records.append(r)

    if not filtered_records:
        print(f"[PriceAgent] All {len(search_results)} records filtered out as junk/YouTube — 0 remained for extraction.")
        return {"price_data": [], "category": "general", "logs": ["All structural noise filtered out."]}

    # Prioritize specific product pages first for the LLM context to ensure we get specific offers
    product_pages = [r for r in filtered_records if is_specific_product_page(r.get("url", ""))]
    other_pages = [r for r in filtered_records if r not in product_pages]
    prioritized_records = product_pages + other_pages

    # Build optimized context using first 60 records
    context_list = []
    for i, r in enumerate(prioritized_records[:60], start=1):
        snippet = (r.get("content") or r.get("snippet") or "")[:150]
        # Extremely compact format to maximize context usage and prevent token budget exhaustion
        context_list.append(f"[{i}] Store: {r.get('engine', 'Web')} | Title: {r.get('title', '')} | Details: {snippet}")
    context = "\n".join(context_list)

    prompt = f"""You are a multi-agent parser extracting e-commerce arrays.
    Query: "{query}"

    Analyze the dataset records. Deduce if this query targets 'clothing' or 'electronics' or 'general'.
    Extract EVERY single valid individual product matching the intent with its metadata attributes from the records.
    You must extract as many individual products, listings, prices, configurations, and store offers as possible.
    CRITICAL: Do not return an empty array if e-commerce product titles and prices are present. You must be exhaustive and extract up to 30 items. For each record mentioning a product name and its price, create an entry in the 'prices' array.
    CRITICAL: Every extracted product in the list must be a unique, distinct product model or specific listing. Do not repeat the same product name and price block to fill the array. Be diverse and extract different models from the different records.
    Aim to extract a large list of 20 to 30 products from the records, including variations in colors, storage capacities, models, specifications, and different e-commerce stores.
    If the exact model in the query is not available but a closely related or newer model is shown in the records, you may extract it as long as you use its exact name and model designation as specified in the record.

    Records:
    {context}
    """

    try:
        response = await AsyncClient(host=os.getenv("OLLAMA_HOST", "http://localhost:11434")).chat(
            model="qwen2.5:latest",
            messages=[{"role": "user", "content": prompt}],
            format=PriceComparisonResponse.model_json_schema(),
            options={"temperature": 0.5, "num_ctx": 8192},
        )

        raw_content = response["message"]["content"].strip()
        cleaned_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
        
        if cleaned_content.startswith("```"):
            cleaned_content = re.sub(r"^```(?:json)?\n?|```$", "", cleaned_content, flags=re.MULTILINE).strip()

        json_match = re.search(r"\{.*\}", cleaned_content, re.DOTALL)
        final_json_str = json_match.group(0) if json_match else cleaned_content

        parsed_payload = json.loads(final_json_str)
        rows = parsed_payload.get("prices") or parsed_payload.get("Metadata") or parsed_payload.get("metadata") or []
        detected_category = parsed_payload.get("detected_category") or parsed_payload.get("Category") or parsed_payload.get("category") or "general"
        
        print(f"[PriceAgent] LLM raw response: {raw_content.encode('ascii', 'replace').decode('ascii')}")
        print(f"[PriceAgent] Parsed {len(rows)} rows: {str(rows).encode('ascii', 'replace').decode('ascii')}")
        
        full_text_corpus = context + "\n" + "\n".join(r.get("title", "") for r in filtered_records)
        real_prices = prices_mentioned_in(full_text_corpus)

        agent_logs = [f"Successfully matched category context: {detected_category}"]
        results = []
        
        for row in rows:
            price = clean_price(row.get("extracted_price") or row.get("Price") or row.get("price"))
            marketplace = str(row.get("marketplace") or row.get("Store") or row.get("store") or "").strip()

            # Filter out trivially low prices that are likely EMI rates or delivery charges rather than actual product prices
            if price < 150:
                agent_logs.append(f"[PriceAgent] Row skipped (price too low/suspicious): {row}")
                continue

            if price == 0 or marketplace.lower() in {"online", "web", "india", ""}:
                agent_logs.append(f"[PriceAgent] Row skipped (price=0 or marketplace invalid): {row}")
                continue
            
            if price not in real_prices and price // 100 in real_prices:
                price = price // 100

            matched_rec = find_source_record(filtered_records, marketplace, price)
            target_url = matched_rec.get("url", "")
            is_product_page = is_specific_product_page(target_url)
            
            agent_logs.append(f"[PriceAgent] Row evaluate: {marketplace} - Price: {price} - URL: {target_url} - IsProductPage: {is_product_page}")
            

            prod_name = str(row.get("product_name") or row.get("Title") or row.get("title") or "").strip()
            if prod_name.lower() in ["fossil watches", "fossil watches for women", "fossil watches for men", "watches"]:
                continue

            bad_name_keywords = [
                "eligible for", "pay on delivery", "how to", "reliable", "faq", 
                "terms of", "privacy policy", "about us", "contact us", "refund", 
                "shipping", "delivery charges", "customer care", "help center", 
                "sign in", "login", "register", "cart", "wishlist", "checkout", "search",
                "store page", "asus store", "official store"
            ]
            prod_name_lower = prod_name.lower()
            if any(bw in prod_name_lower for bw in bad_name_keywords):
                continue
            if len(prod_name) < 6 or prod_name_lower in ["shop", "buy", "online", "product", "item", "cables", "cable", "usb"]:
                continue

            image_url = select_real_product_image(matched_rec, prod_name, filtered_records)
            status = "Target Match" if not budget or price <= budget else "Out of Budget"
            
            is_verified = True
            if "unsplash.com" in image_url or "photo-" in image_url or not is_product_page:
                is_verified = False

            results.append({
                "product_name": prod_name,
                "marketplace": marketplace,
                "extracted_price": price,
                "status": status,
                "url": target_url,
                "is_verified": is_verified,
                "image_url": image_url,
                "color": row.get("color"),
                "size": row.get("size"),
                "discount_percentage": row.get("discount_percentage", 0)
            })

        best_by_url = {}
        for r in results:
            key = (r["url"] or "", r["product_name"].lower())
            if key not in best_by_url or r["extracted_price"] < best_by_url[key]["extracted_price"]:
                best_by_url[key] = r
        results = list(best_by_url.values())

        return {
            "price_data": results, 
            "category": detected_category, 
            "logs": agent_logs
        }

    except Exception as e:
        print(f"Price comparison classification agent execution error: {e}")
        return {"price_data": [], "category": "general", "logs": [f"Price comparison agent error: {str(e)}"]}