import json
import re
import os
from typing import Dict, Any, List, Optional
from ollama import AsyncClient
from pydantic import BaseModel, Field
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse

class PriceItem(BaseModel):
    product_name: str = Field(description="Full product name including brand, model, and style specification.")
    marketplace: str = Field(description="Exact storefront name, e.g. 'Amazon', 'Flipkart', 'Myntra'.")
    extracted_price: int = Field(description="The CURRENT sale/offer price as a plain integer in Indian Rupees (INR). This is the price the customer actually pays today. Do NOT use EMI amounts or bank offer prices.")
    original_price: Optional[int] = Field(default=None, description="The original MRP or crossed-out price before discount, as a plain integer in INR. Only set this if a genuine MRP/strikethrough price is explicitly shown in the record. Leave null if not visible.")
    currency: str = Field(default="₹", description="Currency symbol of the listing, e.g., ₹ or $.")
    brand: Optional[str] = Field(default=None, description="Brand name of the product.")
    rating: Optional[float] = Field(default=0.0, description="Product rating value out of 5 stars (e.g., 4.5).")
    reviews: Optional[int] = Field(default=0, description="Total number of customer reviews counted.")
    delivery: Optional[str] = Field(default="Standard Delivery", description="Delivery info like 'Free Delivery' or 'Delivery charges apply'.")
    discount: Optional[str] = Field(default=None, description="Discount percentage text if present, e.g., '67% OFF'.")
    image_url: Optional[str] = Field(default="", description="Clean, direct image asset link of the actual product.")
    url: Optional[str] = Field(default="", description="Direct target URL page to purchase the product.")
    status: str = Field(default="Target Match")
    
class PriceComparisonResponse(BaseModel):
    prices: List[PriceItem]
    detected_category: str = Field(description="Broad classification segment: 'clothing', 'electronics', or 'general'.")

def clean_price(value: Any) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    if not value:
        return 0
    text = str(value).strip().lower()

    if any(w in text for w in ["/month", "per month", "p.m.", "emi", "cashback", "off"]):
        if any(w in text for w in ["/month", "per month", "p.m.", "emi"]):
            prices = prices_mentioned_in(text)
            if prices:
                return min(prices)
            return 0

    try:
        if "k" in text and re.search(r"(\d+(?:\.\d+)?)\s*k\b", text):
            m = re.search(r"(\d+(?:\.\d+)?)\s*k\b", text)
            return int(float(m.group(1)) * 1_000)
        if "l" in text and re.search(r"(\d+(?:\.\d+)?)\s*(?:l|lakh|lac)\b", text):
            m = re.search(r"(\d+(?:\.\d+)?)\s*(?:l|lakh|lac)\b", text)
            return int(float(m.group(1)) * 100_000)

        prices = prices_mentioned_in(text)
        if prices:
            return min(prices)

        clean_plain = text.replace(",", "").replace("₹", "").replace("$", "").strip()
        if re.fullmatch(r"\d+(?:\.\d+)?", clean_plain):
            val = float(clean_plain)
            if val > 0:
                return int(val)
    except Exception:
        pass
    return 0

def prices_mentioned_in(text: str) -> set:
    prices = set()
    
    # 1. Match standard currency expressions (e.g. ₹65,999, Rs. 79,900)
    for match in re.finditer(r"(?:₹|rs\.?|\$|inr|usd)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE):
        symbol = match.group(0).lower()
        following_text = text[match.end():match.end() + 25].lower()
        following_text_short = text[match.end():match.end() + 8].lower()
        preceding_text = text[max(0, match.start() - 25):match.start()].lower()
        prec_short = text[max(0, match.start() - 12):match.start()].lower()
        
        if any(w in following_text for w in ["per g", "/g", "/kg", "per kg", "/month", "per month", "p.m.", "emi", "month"]):
            continue
        if any(w in prec_short for w in ["mrp", "was ", "list price", "original"]):
            if not any(w in prec_short for w in ["offer", "sale", "deal", "now", "buy"]):
                continue
        if any(w in preceding_text for w in ["save ", "% off", "discount"]):
            continue
        if any(w in following_text_short for w in ["% off", "off", "cashback", "discount"]):
            continue

        try:
            raw_val = float(match.group(1).replace(",", ""))
            if "$" in symbol or "usd" in symbol:
                val = int(raw_val * 86.0)
            else:
                val = int(raw_val)
                
            if val > 0:
                prices.add(val)
        except ValueError:
            continue
            
    # 2. Match currency-free numbers that are formatted with commas or are high-probability price integers
    # e.g., "65,999", "79900" (avoid matching small numbers, years like 2024/2025, or resolutions like 1080/2160/3840)
    for match in re.finditer(r"\b([\d,]+)(?:\.\d+)?\b", text):
        raw_str = match.group(1)
        if "," in raw_str or (len(raw_str) >= 4 and len(raw_str) <= 6):
            try:
                val = int(float(raw_str.replace(",", "")))
                # Ignore common specs and years
                if val in {1080, 2024, 2025, 2026, 2160, 3840, 4096, 8192, 1920}:
                    continue
                if 100 <= val <= 1000000:
                    # check surrounding text for storage/RAM spec matches (like 128 gb, 256 gb, 512 gb, 8gb, 12gb, 16gb)
                    context_around = text[max(0, match.start() - 15):match.end() + 15].lower()
                    if any(spec in context_around for spec in ["gb", "ram", "rom", "hz", "mah", "fps"]):
                        # Unless it's explicitly written as a price, skip
                        if not any(kw in context_around for kw in ["rs", "price", "at", "for"]):
                            continue
                    prices.add(val)
            except ValueError:
                continue

    return prices

async def scrape_live_price(url: str) -> Dict[str, Any]:
    res_data = {"price": None, "image": None}
    if not url:
        return res_data
    
    # Do not try to scrape non-product page patterns
    if not is_specific_product_page(url):
        return res_data
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }
    
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return res_data
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Scrape Image: 1. og:image
            og_image = soup.find("meta", property="og:image") or soup.find("meta", name="og:image")
            if og_image:
                img_url = og_image.get("content")
                if img_url and img_url.startswith("http"):
                    res_data["image"] = img_url
            
            # Scrape Image: 2. twitter:image fallback
            if not res_data["image"]:
                twitter_image = soup.find("meta", name="twitter:image") or soup.find("meta", property="twitter:image")
                if twitter_image:
                    img_url = twitter_image.get("content")
                    if img_url and img_url.startswith("http"):
                        res_data["image"] = img_url
            
            # 1. JSON-LD parsing
            for script in soup.find_all("script", type="application/ld+json"):
                if not script.string:
                    continue
                try:
                    data = json.loads(script.string)
                    def extract_from_json(obj):
                        price_found = None
                        image_found = None
                        if isinstance(obj, dict):
                            if "image" in obj:
                                img = obj.get("image")
                                if isinstance(img, str) and img.startswith("http"):
                                    image_found = img
                                elif isinstance(img, list) and img and isinstance(img[0], str) and img[0].startswith("http"):
                                    image_found = img[0]
                                elif isinstance(img, dict) and "url" in img and isinstance(img["url"], str) and img["url"].startswith("http"):
                                    image_found = img["url"]

                            if obj.get("@type") == "Offer" or "price" in obj:
                                p = obj.get("price")
                                if p and str(p).strip():
                                    price_found = p
                            for k, v in obj.items():
                                sub_p, sub_img = extract_from_json(v)
                                if sub_p and not price_found:
                                    price_found = sub_p
                                if sub_img and not image_found:
                                    image_found = sub_img
                        elif isinstance(obj, list):
                            for item in obj:
                                sub_p, sub_img = extract_from_json(item)
                                if sub_p and not price_found:
                                    price_found = sub_p
                                if sub_img and not image_found:
                                    image_found = sub_img
                        return price_found, image_found
                        
                    raw_price, raw_image = extract_from_json(data)
                    if raw_price and not res_data["price"]:
                        val = int(float(str(raw_price).replace(",", "").replace("₹", "").replace("$", "").strip()))
                        if val > 0:
                            res_data["price"] = val
                    if raw_image and not res_data["image"]:
                        res_data["image"] = raw_image
                except Exception:
                    pass
            
            # 2. Store-specific parsing
            domain = urlparse(url).netloc.lower()
            
            if "amazon." in domain:
                price_whole = soup.select_one(".a-price-whole")
                if price_whole:
                    clean_txt = re.sub(r"[^\d]", "", price_whole.get_text())
                    if clean_txt:
                        res_data["price"] = int(clean_txt)
                        
            elif "flipkart." in domain:
                price_el = soup.select_one(".Nx95tz, ._30jeq3")
                if price_el:
                    clean_txt = re.sub(r"[^\d]", "", price_el.get_text())
                    if clean_txt:
                        res_data["price"] = int(clean_txt)
                        
            elif "croma." in domain:
                price_el = soup.select_one(".pdp-price, .amount, #pdp-price")
                if price_el:
                    clean_txt = re.sub(r"[^\d]", "", price_el.get_text())
                    if clean_txt:
                        res_data["price"] = int(clean_txt)
            
            # 3. Meta tag fallbacks
            meta_selectors = [
                {"property": "product:price:amount"},
                {"property": "og:price:amount"},
                {"name": "twitter:data1"},
                {"itemprop": "price"}
            ]
            for selector in meta_selectors:
                meta = soup.find("meta", **selector) or soup.find(attrs=selector)
                if meta:
                    content = meta.get("content") or meta.get("value")
                    if content:
                        clean_txt = re.sub(r"[^\d.]", "", content)
                        if clean_txt:
                            try:
                                val = int(float(clean_txt))
                                if val > 0 and not res_data["price"]:
                                    res_data["price"] = val
                            except ValueError:
                                pass
                                
    except Exception as e:
        print(f"[LiveScraper] Error fetching price/image from {url}: {e}")
        
    return res_data

def clean_marketplace_name(raw_marketplace: str, url: str = "") -> str:
    if url:
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace("www.", "")
            
            store_map = {
                "amazon.": "Amazon",
                "flipkart.": "Flipkart",
                "myntra.": "Myntra",
                "croma.": "Croma",
                "reliancedigital.": "Reliance Digital",
                "tatacliq.": "Tata CLIQ",
                "jiomart.": "JioMart",
                "meesho.": "Meesho",
                "nykaa.": "Nykaa",
                "snapdeal.": "Snapdeal",
                "blinkit.": "Blinkit",
                "zepto.": "Zepto",
                "instamart": "Instamart",
                "indiamart.": "IndiaMART",
                "industrybuying.": "Industrybuying",
                "ishopindian.": "iShopIndian",
                "quicklly.": "Quicklly",
                "chocoliz.": "Chocoliz",
                "apple.": "Apple",
                "samsung.": "Samsung",
                "sony.": "Sony",
                "vijaysales.": "Vijay Sales",
                "paytmmall.": "Paytm Mall",
                "pricee.": "Pricee"
            }
            for key, clean in store_map.items():
                if key in domain:
                    return clean
                    
            domain_parts = domain.split(".")
            main_name = domain_parts[-2] if len(domain_parts) >= 2 and domain_parts[-2] not in {"co", "com", "org", "gov", "net"} else domain_parts[0]
            if main_name and len(main_name) > 2:
                return main_name.capitalize()
        except Exception:
            pass

    if not raw_marketplace:
        return "Web"
        
    first_store = re.split(r"[,/|]", raw_marketplace)[0].strip()
    first_lower = first_store.lower()

    raw_map = {
        "amazon": "Amazon",
        "flipkart": "Flipkart",
        "myntra": "Myntra",
        "croma": "Croma",
        "reliance": "Reliance Digital",
        "tatacliq": "Tata CLIQ",
        "jiomart": "JioMart",
        "meesho": "Meesho",
        "nykaa": "Nykaa",
        "snapdeal": "Snapdeal",
        "blinkit": "Blinkit",
        "zepto": "Zepto",
        "indiamart": "IndiaMART",
        "industrybuying": "Industrybuying",
        "ishopindian": "iShopIndian",
        "quicklly": "Quicklly",
        "chocoliz": "Chocoliz",
        "pricee": "Pricee"
    }
    for key, clean in raw_map.items():
        if key in first_lower:
            return clean

    clean_name = re.sub(r"\.(com|in|co\.in|org|net|store|shop|io)$", "", first_store, flags=re.IGNORECASE).strip()
    return clean_name.capitalize() if clean_name else "Web"

def find_source_record(search_results: List[Dict[str, Any]], marketplace: str, price: int, product_name: str = "") -> Dict[str, Any]:
    if not search_results:
        return {}
        
    m_clean = re.sub(r"\s+", "", marketplace.lower())
    m_clean = re.sub(r"(india|official|store|online|shop|corporation|inc|co|ltd)$", "", m_clean)
    
    stop_words = {"with", "from", "inch", "full", "brand", "official", "store", "buy", "online", "india", "price", "best", "and", "for", "the", "pro", "max", "plus"}
    p_tokens = set(w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", product_name) if w.lower() not in stop_words)

    best_score = -1.0
    best_record = None

    for r in search_results:
        engine = (r.get("engine") or "").lower()
        engine_clean = re.sub(r"\s+", "", engine)
        url = (r.get("url") or "").lower()
        url_clean = re.sub(r"\s+", "", url)
        title = r.get("title") or ""
        content = r.get("content") or ""
        combined = (title + " " + content).replace(",", "")

        match_engine = bool(m_clean) and ((m_clean in engine_clean) or (engine_clean in m_clean))
        match_url = bool(m_clean) and ((m_clean in url_clean) or (url_clean in m_clean) or any(w in url_clean for w in m_clean.split() if len(w) > 3))
        m_score = 1.0 if (match_engine or match_url) else 0.0

        c_tokens = set(w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", title) if w.lower() not in stop_words)
        overlap = len(p_tokens.intersection(c_tokens)) if p_tokens else 0
        t_score = overlap / max(1, len(p_tokens)) if p_tokens else 0.0

        has_price = str(price) in combined if price > 0 else False
        p_score = 1.0 if has_price else 0.0

        total_score = (t_score * 0.7) + (m_score * 0.2) + (p_score * 0.1)

        if total_score > best_score:
            best_score = total_score
            best_record = r

    return best_record or search_results[0]

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

    return True

def _is_store_logo(url: str) -> bool:
    if not url:
        return True
    u = str(url).lower()

    # Product CDN whitelist (ALWAYS KEEP REAL PRODUCT IMAGES!)
    product_cdn_whitelist = [
        "media-amazon.com/images/", "ssl-images-amazon.com/images/",
        "flixcart.com/image/", "myntassets.com", "croma.com/medias/",
        "reliancedigital.in/medias/", "meesho.com", "tatacliq.com",
        "tavily", "searxng", "unsplash.com", "images.unsplash.com"
    ]
    if any(cdn in u for cdn in product_cdn_whitelist):
        if any(logo in u for logo in ["amazon-logo", "flipkart-logo", "myntra-logo", "croma-logo", "favicon", "site-logo"]):
            return True
        return False

    forbidden_keywords = [
        "logo", "badge", "rating", "icon", "favicon", "avatar", "sprite",
        "og-image", "og_image", "opengraph", "open-graph",
        "header", "footer", "nav", "menu", "theme", "bg-", "background",
        "sidebar", "widget", "banner", "billboard", "square-logo",
        "ytimg", "youtube", "hqdefault", "mqdefault", "sddefault", "maxresdefault",
        "author", "profile", "portrait", "user", "gravatar"
    ]
    if any(kw in u for kw in forbidden_keywords):
        return True

    return False

def select_real_product_image(matched_rec: Dict[str, Any], product_name: str = "", all_records: List[Dict[str, Any]] = None) -> str:
    if matched_rec:
        tavily_images = matched_rec.get("images", [])
        if isinstance(tavily_images, list):
            for img in tavily_images:
                if img and not _is_store_logo(str(img)):
                    return str(img)

        fallback_thumb = (
            matched_rec.get("thumbnail")
            or matched_rec.get("img_src")
            or matched_rec.get("thumbnail_src")
            or matched_rec.get("og_image")
            or ""
        )
        if fallback_thumb and not _is_store_logo(str(fallback_thumb)):
            thumb_str = str(fallback_thumb)
            if not thumb_str.startswith("/") and "localhost" not in thumb_str and "127.0.0.1" not in thumb_str:
                return thumb_str

    if all_records and product_name:
        prod_words = [
            w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", product_name)
            if w.lower() not in {"with", "from", "inch", "full", "brand", "official", "store", "buy", "online", "india", "price", "best", "pro", "max", "plus"}
        ]
        if prod_words:
            for r in all_records:
                thumb = (
                    r.get("thumbnail")
                    or r.get("img_src")
                    or r.get("thumbnail_src")
                    or r.get("og_image")
                    or ""
                )
                if not thumb or _is_store_logo(str(thumb)):
                    continue
                if "unsplash.com" in str(thumb).lower():
                    continue

                title_lower = r.get("title", "").lower()
                if any(w in title_lower for w in prod_words[:2]):
                    return str(thumb)

    fallback_thumb = (
        matched_rec.get("thumbnail")
        or matched_rec.get("img_src")
        or matched_rec.get("thumbnail_src")
        or ""
    )
    if fallback_thumb and not _is_store_logo(str(fallback_thumb)):
        thumb_str = str(fallback_thumb)
        if not thumb_str.startswith("/") and "localhost" not in thumb_str and "127.0.0.1" not in thumb_str:
            return thumb_str

    # Search entire corpus for a matching thumbnail
    if all_records and product_name:
        generic_words = {
            "with", "from", "inch", "full", "backlit", "panel", "brand", "official", "store",
            "laptop", "phone", "shoe", "stand", "buy", "online", "india", "price", "best",
            "new", "set", "pack", "combo", "value", "deal", "offer", "free", "delivery",
            "and", "for", "the", "pro", "max", "plus", "lite", "mini", "ultra"
        }
        prod_words = [
            w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", product_name)
            if w.lower() not in generic_words
        ]

        if prod_words:
            brand_word = prod_words[0]
            required_matches = max(2, min(3, len(prod_words)))

            for r in all_records:
                thumb = (
                    r.get("thumbnail")
                    or r.get("img_src")
                    or r.get("thumbnail_src")
                    or ""
                )
                if not thumb or _is_store_logo(str(thumb)):
                    continue
                if "unsplash.com" in str(thumb).lower() or str(thumb).startswith("/") or "localhost" in str(thumb) or "127.0.0.1" in str(thumb):
                    continue

                title_lower = r.get("title", "").lower()
                if brand_word not in title_lower:
                    continue
                match_count = sum(1 for w in prod_words if w in title_lower)
                if match_count >= required_matches:
                    return thumb

    # ── Category-specific Unsplash fallback pools ────────────────────────────
    prod_name_lower = product_name.lower()
    idx = abs(hash(product_name + str(matched_rec.get('url', ''))))

    phone_pool = [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80",
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80",
        "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80",
        "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=400&q=80"
    ]
    laptop_pool = [
        "https://images.unsplash.com/photo-1496181130204-755241544e35?w=400&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80"
    ]
    shoe_pool = [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80"
    ]

    if any(k in prod_name_lower for k in ["powerbank", "power bank", "mah", "charger", "battery pack", "power bank 45w", "powerbank 45w"]):
        return "https://images.unsplash.com/photo-1608503396060-36c8d9e0d7d5?w=400&q=80"
    elif any(k in prod_name_lower for k in ["shoe", "sneaker", "boot", "footwear", "sandal", "clog", "puma", "adidas", "nike", "reebok", "under armour", "asics", "skechers", "crocs"]):
        return shoe_pool[idx % len(shoe_pool)]
    elif any(k in prod_name_lower for k in ["laptop stand", "laptop riser", "laptop mount", "notebook stand", "desk stand", "adjustable stand", "ergonomic stand"]):
        return "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80"
    elif any(k in prod_name_lower for k in ["cooler", "cooling fan", "cpu fan", "phone cooler", "mobile cooler", "cooling pad", "laptop cooler"]):
        return "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&q=80"
    elif any(k in prod_name_lower for k in ["headphone", "earbud", "pods", "audio", "soundbar", "earphones", "headset", "tws", "airpods"]):
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
    elif "watch" in prod_name_lower:
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
    elif any(k in prod_name_lower for k in ["keyboard", "mechanical keyboard", "gaming keyboard"]):
        return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80"
    elif any(k in prod_name_lower for k in ["mouse", "gaming mouse", "wireless mouse"]):
        return "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80"
    elif any(k in prod_name_lower for k in ["laptop", "notebook", "macbook", "computer", "pc", "asus", "hp", "dell", "lenovo", "acer", "msi", "strix", "thinkpad", "ideapad", "predator", "inspiron", "latitude", "zenbook", "vivobook", "ryzen", "intel core", "g16", "g15", "rog"]):
        return laptop_pool[idx % len(laptop_pool)]
    elif any(k in prod_name_lower for k in ["phone", "iphone", "mobile", "samsung", "pixel", "oneplus", "smartphone", "galaxy", "redmi", "realme", "xiaomi", "vivo", "oppo", "motorola", "moto", "infinix", "tecno", "x300", "x30"]):
        return phone_pool[idx % len(phone_pool)]
    elif any(k in prod_name_lower for k in ["monitor", "tv", "display", "screen", "led", "ips", "panel", "backlit"]):
        return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80"
    elif any(k in prod_name_lower for k in ["headphone", "earbud", "pods", "audio", "soundbar", "earphones", "headset", "tws", "airpods"]):
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
    elif any(k in prod_name_lower for k in ["bag", "backpack", "case", "cover", "sleeve", "pouch"]):
        return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"
    elif any(k in prod_name_lower for k in ["cable", "charger", "adapter", "hub", "usb", "type-c", "power bank"]):
        return "https://images.unsplash.com/photo-1608503396060-36c8d9e0d7d5?w=400&q=80"
        
    return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80"

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling")
    if not budget:
        from agents.budget_advisor_agent import _extract_budget
        budget = _extract_budget(query)

    print("\n--- OLLAMA INTENT-CLASSIFYING PRICE COMPARISON INITIATED ---")
    if not search_results:
        print("[PriceAgent] No search_results received — nothing to extract from.")
        return {"price_data": [], "category": "general", "logs": ["No search results found."]}

    cleaned_records = []
    for r in search_results:
        url = (r.get("url") or "").lower()
        if any(ignored in url for ignored in ["wikipedia.org", "youtube.com", "facebook.com", "instagram.com"]):
            continue
        cleaned_records.append(r)

    filtered_records = cleaned_records if cleaned_records else search_results
    if not filtered_records:
        return {"price_data": [], "category": "general", "logs": ["All structural noise filtered out."]}

    product_pages = [r for r in filtered_records if is_specific_product_page(r.get("url", ""))]
    other_pages = [r for r in filtered_records if r not in product_pages]
    prioritized_records = product_pages + other_pages

    try:
        # ── Batch Processing Configuration ───────────────────────────────────────
        # No fixed limits ([:75] or [:50]) are applied. ALL records enter batching.
        BATCH_SIZE = int(os.getenv("PRICE_AGENT_BATCH_SIZE", "50"))
        batches = [
            prioritized_records[i : i + BATCH_SIZE]
            for i in range(0, len(prioritized_records), BATCH_SIZE)
        ]

        total_collected = len(search_results)
        total_batch_input = len(prioritized_records)
        num_batches = len(batches)

        print(f"\n[PriceAgent] === PRICE COMPARISON BATCHING INITIATED ===")
        print(f"[PriceAgent] Total search records collected: {total_collected}")
        print(f"[PriceAgent] Total records entering batch processing: {total_batch_input}")
        print(f"[PriceAgent] Number of batches created: {num_batches} (Batch Size: {BATCH_SIZE})")

        all_raw_extracted_rows: List[Dict[str, Any]] = []
        detected_category_counts: Dict[str, int] = {}
        batch_logs: List[str] = [
            f"Total search records collected: {total_collected}",
            f"Total records entering batch processing: {total_batch_input}",
            f"Number of batches created: {num_batches}",
        ]

        client = AsyncClient(host=os.getenv("OLLAMA_HOST", "http://localhost:11434"))

        for batch_idx, batch_records in enumerate(batches, start=1):
            print(f"\n[PriceAgent] ---> Processing Batch {batch_idx}/{num_batches} ({len(batch_records)} records)...")
            context_list = []
            for i, r in enumerate(batch_records, start=1):
                snippet = (r.get("content") or r.get("snippet") or "")[:350]
                context_list.append(f"[{i}] Store: {r.get('engine', 'Web')} | Title: {r.get('title', '')} | Details: {snippet}")
            context = "\n".join(context_list)

            prompt = f"""You are a multi-agent parser extracting e-commerce product listings.
Query: "{query}"

Analyze the dataset records. Deduce if this query targets 'clothing' or 'electronics' or 'general'.
Extract EVERY single valid individual product matching the intent with its metadata attributes from the records.
You must extract as many individual products, listings, prices, configurations, and store offers as possible.

PRICE EXTRACTION RULES (follow strictly):
- extracted_price: Must be the FINAL current payable purchase price today as a plain integer in INR (Indian Rupees). This is the exact amount the customer actually pays today at checkout.
- IGNORE EMI per-month values (e.g., "Rs. 1,200/month", "₹899 p.m."), bank cashback offers, exchange bonuses, and crossed-out original MRPs.
- If a price range exists in the text (e.g., "Rs. 18,900 - Rs. 24,900"), extract the lowest active buying price.
- original_price: The original MRP or crossed-out price ONLY if explicitly shown.
- NEVER invent, hallucinate, or calculate prices. If a price is NOT explicitly written in the snippet, you MUST set `extracted_price` to null.
- CRITICAL: ONLY extract the MAIN product requested. Do NOT extract accessories, cases, covers, straps.

MASSIVE DATA REQUIREMENT:
- You MUST extract EVERY SINGLE product variation, listing, or link you find in the context.
- DO NOT deduplicate! If 5 different stores sell the exact same product, extract it 5 separate times!
- If the exact price is MISSING in the snippet, YOU MUST STILL EXTRACT THE PRODUCT! Just set `extracted_price` to null.
- Do NOT stop at 8 or 9 items. Extract every store, color variant, and configuration found in the context.

Records:
{context}
"""
            try:
                response = await client.chat(
                    model="qwen2.5:latest",
                    messages=[{"role": "user", "content": prompt}],
                    format=PriceComparisonResponse.model_json_schema(),
                    options={"temperature": 0.5, "num_ctx": 8192, "num_predict": 4096},
                )

                raw_content = response["message"]["content"].strip()
                cleaned_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
                if cleaned_content.startswith("```"):
                    cleaned_content = re.sub(r"^```(?:json)?\n?|```$", "", cleaned_content, flags=re.MULTILINE).strip()

                json_match = re.search(r"\{.*\}", cleaned_content, re.DOTALL)
                final_json_str = json_match.group(0) if json_match else cleaned_content

                try:
                    parsed_payload = json.loads(final_json_str)
                except json.JSONDecodeError:
                    print(f"[PriceAgent] Batch {batch_idx}: JSON parse failed, attempting regex recovery.")
                    parsed_payload = {"prices": [], "detected_category": "general"}
                    object_blocks = re.findall(r'\{[^{}]*"product_name"[^{}]*\}', final_json_str)
                    for block in object_blocks:
                        try:
                            parsed_payload["prices"].append(json.loads(block))
                        except json.JSONDecodeError:
                            pass

                batch_rows = parsed_payload.get("prices") or parsed_payload.get("Metadata") or parsed_payload.get("metadata") or []
                b_cat = parsed_payload.get("detected_category") or parsed_payload.get("Category") or parsed_payload.get("category") or "general"
                detected_category_counts[b_cat] = detected_category_counts.get(b_cat, 0) + 1

                all_raw_extracted_rows.extend(batch_rows)
                msg = f"Batch {batch_idx}/{num_batches}: Processed {len(batch_records)} records -> Extracted {len(batch_rows)} raw product items."
                print(f"[PriceAgent] {msg}")
                batch_logs.append(msg)

            except Exception as b_err:
                err_msg = f"Batch {batch_idx}/{num_batches} failed: {b_err}. Continuing with remaining batches..."
                print(f"[PriceAgent] {err_msg}")
                batch_logs.append(err_msg)

        # Determine predominant category
        detected_category = max(detected_category_counts, key=detected_category_counts.get) if detected_category_counts else "general"

        print(f"\n[PriceAgent] Total extracted products before product-level deduplication: {len(all_raw_extracted_rows)}")
        batch_logs.append(f"Total extracted products before product-level deduplication: {len(all_raw_extracted_rows)}")

        # ── Post-Batch Validation & Product-Level Deduplication ───────────────────
        results = []
        min_price_floor = 99 if detected_category == "electronics" else 49

        for row in all_raw_extracted_rows:
            price = clean_price(row.get("extracted_price") or row.get("Price") or row.get("price"))
            marketplace = str(row.get("marketplace") or row.get("Store") or row.get("store") or "").strip()

            if price < min_price_floor:
                continue

            if price == 0 or marketplace.lower() in {"", "india"}:
                continue

            prod_name = str(row.get("product_name") or row.get("Title") or row.get("title") or "").strip()
            prod_name_lower = prod_name.lower()

            matched_rec = find_source_record(filtered_records, marketplace, price, prod_name)
            target_url = (matched_rec.get("url") or "").strip()
            clean_store = clean_marketplace_name(marketplace, target_url)
            is_product_page = is_specific_product_page(target_url)

            # Source snippet price verification double-lock
            source_snippet = (matched_rec.get("content") or "") + " " + (matched_rec.get("title") or "")
            snippet_prices = prices_mentioned_in(source_snippet)
            if snippet_prices and (price == 0 or price not in snippet_prices):
                closest = min(snippet_prices, key=lambda x: abs(x - price) if price > 0 else x)
                if price == 0 or abs(closest - price) < (price * 0.5) or price < min_price_floor:
                    price = closest

            if price < min_price_floor:
                continue

            if any(tld in target_url for tld in [".cz/", ".sk/", ".pl/", ".de/", ".eu/", ".nl/", ".fr/", ".it/", ".es/", ".br/", ".pt/", ".mx/", ".ar/", ".cl/"]):
                continue

            if clean_store.lower() in {"usados", "usado", "mercadolivre", "olx.br", "olx.pt"}:
                continue

            # Flagship phone/laptop anomaly guard (prevents $1,098 USD being misparsed as ₹1,098 INR)
            flagship_keywords = ["iphone 17 pro", "iphone 16 pro", "iphone 15 pro", "galaxy s24 ultra", "galaxy s25 ultra", "macbook pro", "ipad pro"]
            if any(fk in prod_name_lower for fk in flagship_keywords):
                if not any(acc in prod_name_lower for acc in ["case", "cover", "skin", "protector", "glass", "film", "strap", "stand", "pouch", "bag"]):
                    if price < 25000:
                        continue

            known_brands = [
                "noise", "samsung", "apple", "iphone", "macbook", "sony", "jbl", "boat", "bose", 
                "realme", "oneplus", "xiaomi", "redmi", "puma", "adidas", "nike", "asus", 
                "lenovo", "dell", "hp", "acer", "msi", "crocs", "fossil", "titan", "casio"
            ]
            q_lower = query.lower()
            target_brands = [b for b in known_brands if b in q_lower]
            if target_brands and not any(tb in prod_name_lower for tb in target_brands):
                continue

            if prod_name_lower in ["fossil watches", "fossil watches for women", "fossil watches for men", "watches"]:
                continue

            bad_name_keywords = [
                "eligible for", "pay on delivery", "how to", "reliable", "faq", 
                "terms of", "privacy policy", "about us", "contact us", "refund", 
                "shipping", "delivery charges", "customer care", "help center", 
                "sign in", "login", "register", "cart", "wishlist", "checkout", "search",
                "store page", "asus store", "official store",
                "ear pad", "ear cushion", "replacement cushion", "replacement pad",
                "headphone case", "carrying case", "protective case", "silicone cover",
                "headband cover", "audio cable", "aux cable"
            ]
            if any(bw in prod_name_lower for bw in bad_name_keywords):
                continue
            if len(prod_name) < 6 or prod_name_lower in ["shop", "buy", "online", "product", "item", "cables", "cable", "usb"]:
                continue

            image_url = select_real_product_image(matched_rec, prod_name, filtered_records)
            status = "Target Match" if not budget or price <= budget else "Out of Budget"
            
            is_verified = True
            if "unsplash.com" in image_url or "photo-" in image_url or not is_product_page:
                is_verified = False

            raw_original = row.get("original_price")
            original_price = None
            if raw_original:
                op = clean_price(raw_original)
                if op > price:
                    original_price = op

            results.append({
                "product_name": prod_name,
                "marketplace": clean_store,
                "extracted_price": price,
                "original_price": original_price,
                "status": status,
                "url": target_url,
                "is_verified": is_verified,
                "image_url": image_url,
                "color": row.get("color"),
                "size": row.get("size"),
                "discount": row.get("discount"),
            })

        # Product-level deduplication: preserve distinct listings across marketplaces
        best_by_key = {}
        for r in results:
            m_key = (r["marketplace"] or "").lower().strip()
            u_key = (r["url"] or "").lower().strip()
            p_key = (r["product_name"] or "").lower().strip()
            px_key = r["extracted_price"]

            if u_key:
                key = (m_key, u_key, p_key)
            else:
                key = (m_key, p_key, px_key)

            if key not in best_by_key or r["extracted_price"] < best_by_key[key]["extracted_price"]:
                best_by_key[key] = r
        results = list(best_by_key.values())

        # Stage: Live Web Scraping for accurate prices
        import asyncio
        scrape_tasks = []
        for r in results:
            url = r.get("url")
            scrape_tasks.append(scrape_live_price(url))
        
        scraped_data_list = await asyncio.gather(*scrape_tasks)
        
        for r, live_data in zip(results, scraped_data_list):
            live_price = live_data.get("price")
            live_image = live_data.get("image")
            
            if live_price and live_price >= min_price_floor:
                print(f"[PriceAgent] Live price match success! Updated {r['product_name']} from {r['marketplace']}: {r['extracted_price']} -> {live_price}")
                r["extracted_price"] = live_price
                r["status"] = "Target Match" if not budget or live_price <= budget else "Out of Budget"
                r["is_verified"] = True
                
            if live_image:
                print(f"[PriceAgent] Live image match success! Updated {r['product_name']} image: {r['image_url']} -> {live_image}")
                r["image_url"] = live_image

        results.sort(key=lambda x: x.get("extracted_price") or float('inf'))

        print(f"[PriceAgent] Final price_data count after product-level validation & deduplication: {len(results)}")
        batch_logs.append(f"Final price_data count: {len(results)}")

        return {
            "price_data": results, 
            "category": detected_category, 
            "logs": batch_logs
        }

    except Exception as e:
        print(f"Price comparison classification agent execution error: {e}")
        return {"price_data": [], "category": "general", "logs": [f"Price comparison agent error: {str(e)}"]}