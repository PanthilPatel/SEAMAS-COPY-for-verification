import json
import re
import os
import asyncio
import ipaddress
import socket
from typing import Dict, Any, List, Optional
from ollama import AsyncClient
from pydantic import BaseModel, Field
import httpx
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from tools.search_tools import _domain_to_store, NON_SHOPPING_DOMAINS
from core.config import resolve_ollama_model, settings

class PriceItem(BaseModel):
    record_id: Optional[int] = Field(default=None, description="The integer index [i] of the source record this product was extracted from.")
    product_name: str = Field(description="Full product name including brand, model, and style specification.")
    marketplace: str = Field(description="Exact storefront name, e.g. 'Amazon', 'Flipkart', 'Tata CLIQ', 'Myntra'.")
    extracted_price: Optional[int] = Field(default=None, description="The CURRENT sale/offer price as a plain integer in Indian Rupees (INR). This is the price the customer actually pays today. Do NOT use EMI amounts or bank offer prices.")
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

    # Reject EMI, monthly installment rates, or cashbacks pretending to be sale price
    if any(w in text for w in ["/month", "per month", "p.m.", "emi"]):
        full_price_match = re.search(r"(?:full\s*price|mrp|total\s*cost)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)", text)
        if full_price_match:
            try:
                return int(full_price_match.group(1).replace(",", ""))
            except Exception:
                pass
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

def parse_snippet_pricing(text: str) -> Dict[str, Any]:
    """
    Extracts authentic current sale price and genuine original MRP from search snippets or titles.
    Supports table markdown (| Price: 390 | | MRP: | 445 |), labeled prices (Best Price of Rs 390, OFF 662 MRP 755),
    Indian comma formats (1,44,900), and unit retail labels (650/Bottle).
    Filters out per-month EMIs, card discounts, and cachebacks.
    """
    if not text:
        return {"current_price": None, "original_price": None, "all_prices": set()}

    text_clean = text.replace("\xa0", " ").replace("&nbsp;", " ")
    current_price: Optional[int] = None
    original_price: Optional[int] = None
    all_prices: set = set()

    # 1. Match explicit labeled current purchase prices
    sale_label_patterns = [
        r"(?:sale\s+price|deal\s+price|offer\s+price|discount\s+price|our\s+price|best\s+price|special\s+price|buy\s+at|now\s+at|price)\s*[:\-–=\|]+\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",
        r"(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:\([^\)]+\))?\s*(?:deal|offer|sale|only|today)",
        r"(?:deal|price|sale|off)\s+([\d,]+)\s+(?:mrp|list|was)\s+([\d,]+)"
    ]
    for pat in sale_label_patterns:
        for m in re.finditer(pat, text_clean, re.IGNORECASE):
            try:
                val = int(float(m.group(1).replace(",", "")))
                if 20 <= val <= 5000000:
                    context = text_clean[max(0, m.start() - 15):min(len(text_clean), m.end() + 15)].lower()
                    if not any(u in context for u in ["per g", "/g", "/kg", "/month", "emi", "month"]):
                        if not current_price:
                            current_price = val
                        all_prices.add(val)
                if len(m.groups()) >= 2 and m.group(2):
                    val_mrp = int(float(m.group(2).replace(",", "")))
                    if 20 <= val_mrp <= 5000000:
                        if not original_price:
                            original_price = val_mrp
                        all_prices.add(val_mrp)
            except:
                pass

    # 2. Match explicit MRP labels
    mrp_patterns = [
        r"(?:m\.?r\.?p\.?|list\s+price|was|original\s+price)(?:\s*[:\-–=\|]+\s*)+([\d,]+(?:\.\d+)?)",
        r"(?:m\.?r\.?p\.?|list\s+price|was|original\s+price)\s*[:\-–=\|]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",
    ]
    for pat in mrp_patterns:
        for m in re.finditer(pat, text_clean, re.IGNORECASE):
            try:
                val = int(float(m.group(1).replace(",", "")))
                if 20 <= val <= 5000000:
                    if not original_price:
                        original_price = val
                    all_prices.add(val)
            except:
                pass

    # 3. Match standard currency expressions (₹390, Rs. 1,44,900, $89)
    for m in re.finditer(r"(?:₹|rs\.?|\$|inr|usd)\s*([\d,]+(?:\.\d+)?)", text_clean, re.IGNORECASE):
        symbol = m.group(0).lower()
        prec = text_clean[max(0, m.start() - 20):m.start()].lower()
        immediate_foll = text_clean[m.end():min(len(text_clean), m.end() + 10)].lower().strip()
        if any(immediate_foll.startswith(u) for u in ["/month", "per month", "/m", "/g", "per g", "/kg", "per kg"]):
            continue
        # If the prefix indicates a discount amount or EMI rate, skip it
        if any(u in prec for u in ["save ", "cashback ", "flat ", "upto ", "emi of ", "emi from ", "emi starting "]):
            continue
        try:
            raw_v = float(m.group(1).replace(",", ""))
            val = int(raw_v * 86.0) if ("$" in symbol or "usd" in symbol) else int(raw_v)
            if 20 <= val <= 5000000:
                all_prices.add(val)
                if not current_price:
                    current_price = val
        except:
            pass

    # 4. Match unit-based retail pricing (e.g. "650/Bottle", "450/piece", "390/jar")
    for m in re.finditer(r"\b([\d,]+)\s*\/\s*(?:bottle|jar|piece|item|pc|pack|unit|box)\b", text_clean, re.IGNORECASE):
        try:
            val = int(float(m.group(1).replace(",", "")))
            if 20 <= val <= 5000000:
                all_prices.add(val)
                if not current_price:
                    current_price = val
        except:
            pass

    # 5. Match Indian comma numbers without symbol (e.g. "1,44,900" or "1,295")
    for m in re.finditer(r"\b(\d{1,3}(?:,\d{2,3})+)\b", text_clean):
        try:
            val = int(float(m.group(1).replace(",", "")))
            context = text_clean[max(0, m.start() - 15):min(len(text_clean), m.end() + 15)].lower()
            if not any(spec in context for spec in ["gb", "ram", "rom", "hz", "mah", "fps", "ml", "gm", "watt", "pin"]):
                if 100 <= val <= 5000000:
                    all_prices.add(val)
                    if not current_price:
                        current_price = val
        except:
            pass

    # If current_price and original_price exist and original_price < current_price, ensure current is lower
    if current_price and original_price and original_price < current_price:
        current_price, original_price = original_price, current_price

    return {
        "current_price": current_price,
        "original_price": original_price,
        "all_prices": all_prices
    }


def prices_mentioned_in(text: str) -> set:
    pricing = parse_snippet_pricing(text)
    return pricing.get("all_prices") or set()


async def scrape_live_price(url: str) -> Dict[str, Any]:
    res_data = {"price": None, "original_price": None, "image": None}
    if not url:
        return res_data
    parsed_url = urlparse(url)
    if parsed_url.scheme != "https" or not parsed_url.hostname or parsed_url.username or parsed_url.password:
        return res_data
    if parsed_url.hostname.lower() in {"localhost", "127.0.0.1", "::1"}:
        return res_data
    try:
        addresses = await asyncio.get_running_loop().getaddrinfo(parsed_url.hostname, parsed_url.port or 443, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(info[4][0]).is_global for info in addresses):
            return res_data
    except (OSError, ValueError):
        return res_data

    # Do not try to scrape non-product page patterns
    if not is_specific_product_page(url):
        return res_data

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124"',
        "sec-ch-ua-platform": '"Windows"',
    }

    html_content = ""
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=False, timeout=3.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                html_content = response.text
    except Exception:
        pass

    # Reject empty responses, challenge blocks, and CAPTCHAs without attempting unsafe curl execution
    if not html_content or len(html_content) < 300 or "captcha" in html_content.lower():
        return res_data

    soup = BeautifulSoup(html_content, "html.parser")
    domain = urlparse(url).netloc.lower()

    # 1. Image extraction
    og_image = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
    if og_image and og_image.get("content") and og_image.get("content").startswith("http"):
        res_data["image"] = og_image.get("content")
    if not res_data["image"]:
        tw_image = soup.find("meta", attrs={"name": "twitter:image"}) or soup.find("meta", property="twitter:image")
        if tw_image and tw_image.get("content") and tw_image.get("content").startswith("http"):
            res_data["image"] = tw_image.get("content")

    # 2. Store-specific high precision CSS selectors
    if "amazon." in domain:
        pw = soup.select_one(".a-price-whole")
        if pw:
            clean_txt = re.sub(r"[^\d]", "", pw.get_text())
            if clean_txt:
                res_data["price"] = int(clean_txt)
        smrp = soup.select_one(".a-price.a-text-price[data-a-strike='true'] .a-offscreen")
        if smrp:
            clean_mrp = re.sub(r"[^\d]", "", smrp.get_text())
            if clean_mrp:
                res_data["original_price"] = int(clean_mrp)

    elif "flipkart." in domain:
        pw = soup.select_one(".Nx95tz, ._30jeq3, ._16Jk6d, .CxhGGd")
        if pw:
            clean_txt = re.sub(r"[^\d]", "", pw.get_text())
            if clean_txt:
                res_data["price"] = int(clean_txt)
        smrp = soup.select_one("._3I9_wc, ._2p6lqe")
        if smrp:
            clean_mrp = re.sub(r"[^\d]", "", smrp.get_text())
            if clean_mrp:
                res_data["original_price"] = int(clean_mrp)

    elif "croma." in domain:
        pw = soup.select_one(".pdp-price, .amount, #pdp-price")
        if pw:
            clean_txt = re.sub(r"[^\d]", "", pw.get_text())
            if clean_txt:
                res_data["price"] = int(clean_txt)
        smrp = soup.select_one(".pdp-mrp, .old-price")
        if smrp:
            clean_mrp = re.sub(r"[^\d]", "", smrp.get_text())
            if clean_mrp:
                res_data["original_price"] = int(clean_mrp)

    elif "tatacliq." in domain or "myntra." in domain:
        pw = soup.select_one(".pdp-price, .product-price, .discountedPrice")
        if pw:
            clean_txt = re.sub(r"[^\d]", "", pw.get_text())
            if clean_txt:
                res_data["price"] = int(clean_txt)

    # 3. Deep JSON-LD schema.org parsing
    if not res_data["price"]:
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string)
                def scan_ld(obj):
                    if isinstance(obj, dict):
                        if not res_data["image"] and "image" in obj:
                            im = obj["image"]
                            if isinstance(im, str) and im.startswith("http"):
                                res_data["image"] = im
                            elif isinstance(im, list) and im and isinstance(im[0], str):
                                res_data["image"] = im[0]
                        if obj.get("@type") in ("Offer", "Product") or "price" in obj or "lowPrice" in obj:
                            p = obj.get("price") or obj.get("lowPrice")
                            if p and not res_data["price"]:
                                try:
                                    pval = int(float(str(p).replace(",", "").replace("₹", "").strip()))
                                    if 20 <= pval <= 5000000:
                                        res_data["price"] = pval
                                except:
                                    pass
                            m = obj.get("highPrice")
                            if m and not res_data["original_price"]:
                                try:
                                    mval = int(float(str(m).replace(",", "").replace("₹", "").strip()))
                                    if 20 <= mval <= 5000000:
                                        res_data["original_price"] = mval
                                except:
                                    pass
                        for v in obj.values():
                            scan_ld(v)
                    elif isinstance(obj, list):
                        for it in obj:
                            scan_ld(it)
                scan_ld(data)
            except Exception:
                pass

    # 4. Meta tag price extraction
    if not res_data["price"]:
        meta_selectors = [
            {"property": "product:price:amount"},
            {"property": "og:price:amount"},
            {"name": "twitter:data1"},
            {"itemprop": "price"}
        ]
        for sel in meta_selectors:
            meta = soup.find("meta", attrs=sel)
            if meta and (meta.get("content") or meta.get("value")):
                m = re.search(r"(\d+(?:\.\d+)?)", (meta.get("content") or meta.get("value")).replace(",", ""))
                if m:
                    pval = int(float(m.group(1)))
                    if 20 <= pval <= 5000000:
                        res_data["price"] = pval
                        break

    # 5. Embedded hydration JSON state scan (Next.js __NEXT_DATA__, Redux, React state)
    if not res_data["price"]:
        state_patterns = [
            r'\"selling_price\":\s*"?([0-9.]+)"?',
            r'\"final_price\":\s*"?([0-9.]+)"?',
            r'\"offer_price\":\s*"?([0-9.]+)"?',
            r'\"special_price\":\s*"?([0-9.]+)"?',
            r'\"discountedPrice\":\s*"?([0-9.]+)"?',
            r'\"sp\":\s*([0-9.]+)',
            r'\"price\":\s*([0-9.]+)'
        ]
        sample_text = html_content[:400000]
        for pat in state_patterns:
            matches = re.findall(pat, sample_text)
            for m in matches:
                try:
                    val = int(float(m))
                    if 50 <= val <= 5000000:
                        res_data["price"] = val
                        break
                except:
                    pass
            if res_data["price"]:
                break

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

    stop_words = {
        "with", "from", "inch", "full", "brand", "official", "store", "buy", "online", "india",
        "price", "best", "and", "for", "the", "pro", "max", "plus",
        "bottle", "water", "steel", "stainless", "pack", "piece", "set", "insulated", "flask"
    }
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

    # Do not arbitrarily fall back to search_results[0] if match score is too low (< 0.25)
    if best_score >= 0.25 and best_record:
        return best_record
    return best_record if (best_record and m_clean and (m_clean in (best_record.get("engine","").lower() or best_record.get("url","").lower()))) else {}

def is_specific_product_page(url: str) -> bool:
    if not url:
        return False
    from urllib.parse import urlparse
    parsed = urlparse(url)
    path = parsed.path.lower()
    domain = parsed.netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]

    # Never treat non-shopping domains, blogs, news, or vehicle portals as product pages
    if any(ns in domain for ns in NON_SHOPPING_DOMAINS):
        return False

    known_domains = [
        "amazon.in", "amazon.com", "flipkart.com", "croma.com", "reliancedigital.in",
        "vijaysales.com", "tatacliq.com", "luxury.tatacliq.com", "snapdeal.com", "myntra.com",
        "meesho.com", "paytmmall.com", "nykaa.com", "nykaaman.com", "shopsy.in", "jiomart.com",
        "poorvika.com", "sangeethamobil.com", "samsung.com", "apple.com", "mi.com", "oneplus.com",
        "oneplus.in", "realme.com", "asus.com", "lenovo.com", "hp.com", "dell.com", "acer.com",
        "lg.com", "sony.co.in", "sony.com", "boseindia.com", "jbl.com", "boat-lifestyle.com",
        "gonoise.com", "fireboltt.com", "titan.co.in", "fastrack.in", "fossil.com", "casioindiashop.com",
        "timexindia.com", "helioswatchstore.com", "garmin.co.in", "amazfit.co.in", "ajio.com", "bewakoof.com"
    ]
    is_known_store = any(kd in domain for kd in known_domains)

    brand_pass = ["urbanmonkey.com", "neweracap.in", "supervek.in"]
    if any(b in domain for b in brand_pass):
        if not any(word in path for word in ["about", "contact", "privacy", "terms"]):
            return True

    category_keywords = [
        "/category", "/categories", "/product-category", "/brands", "/shop-by",
        "/catalog", "search", "impcat", "/list-of-", "buying-guide", "product-reviews",
        "/reviews", "employee-review", "mutual-funds", "/s?", "search?", "query=",
        "/collections/", "/collection/", "/all-products/", "/products-list/", "/browse/"
    ]
    if any(kw in path for kw in category_keywords) or any(kw in parsed.query for kw in ["k=", "q=", "search"]):
        return False

    known_product_markers = ["/dp/", "/gp/product/", "/p/", "/product/", "/products/", "/buy/", "/item/", "/pd/"]
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
        elif any(marker in path for marker in known_product_markers):
            return True
        return False

    return any(marker in path for marker in known_product_markers)

def _is_store_logo(url: str) -> bool:
    if not url:
        return True
    u = str(url).lower()

    # Product CDN whitelist (ALWAYS KEEP REAL PRODUCT IMAGES!)
    product_cdn_whitelist = [
        "media-amazon.com/images/", "ssl-images-amazon.com/images/",
        "flixcart.com/image/", "myntassets.com", "croma.com/medias/",
        "reliancedigital.in/medias/", "meesho.com", "tatacliq.com",
        "tavily", "searxng", "unsplash.com", "images.unsplash.com",
        "encrypted-tbn0.gstatic.com", "gstatic.com/images"
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

    # Search entire corpus for a matching thumbnail if matched_rec has none
    if all_records and product_name:
        generic_words = {
            "with", "from", "inch", "full", "backlit", "panel", "brand", "official", "store",
            "laptop", "phone", "shoe", "stand", "buy", "online", "india", "price", "best",
            "new", "set", "pack", "combo", "value", "deal", "offer", "free", "delivery",
            "and", "for", "the", "pro", "max", "plus", "lite", "mini", "ultra",
            "bottle", "water", "steel", "stainless"
        }
        prod_words = [
            w.lower() for w in re.findall(r"\b[a-zA-Z0-9]{3,}\b", product_name)
            if w.lower() not in generic_words
        ]

        if prod_words:
            brand_word = prod_words[0]
            for r in all_records:
                thumb = (
                    r.get("thumbnail")
                    or r.get("img_src")
                    or r.get("thumbnail_src")
                    or r.get("image")
                    or ""
                )
                if not thumb or _is_store_logo(str(thumb)):
                    continue
                if "unsplash.com" in str(thumb).lower() or str(thumb).startswith("/") or "localhost" in str(thumb) or "127.0.0.1" in str(thumb):
                    continue

                title_lower = r.get("title", "").lower()
                if brand_word in title_lower:
                    return thumb

    # If no genuine product image or storefront thumbnail is found, return empty string
    # to indicate neutral image-missing state (preventing fake or stock product images).
    return ""

async def price_comparison_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    search_results = state.get("search_results", [])
    query = state.get("query", "")
    budget = state.get("budget_status", {}).get("ceiling") or state.get("budget")
    if not budget:
        try:
            from agents.budget_advisor_agent import _extract_budget
            budget = _extract_budget(query)
        except Exception:
            budget = None

    print("\n--- OLLAMA INTENT-CLASSIFYING PRICE COMPARISON INITIATED ---")
    if not search_results:
        print("[PriceAgent] No search_results received — nothing to extract from.")
        return {"price_data": [], "logs": ["No search results found."]}

    cleaned_records = []
    for r in search_results:
        url = (r.get("url") or "").lower()
        if any(ignored in url for ignored in NON_SHOPPING_DOMAINS):
            continue
        if any(ext in url for ext in [".pdf", ".doc", ".docx", ".ppt"]):
            continue
        if any(p in url for p in ["/product-reviews/", "/customer-reviews/", "/reviews/", "/pb/", "/catalog/", "/categories/"]):
            continue
        cleaned_records.append(r)

    filtered_records = cleaned_records
    if not filtered_records:
        return {"price_data": [], "logs": ["All non-shopping records filtered out."]}

    product_pages = [r for r in filtered_records if is_specific_product_page(r.get("url", ""))]
    other_pages = [
        r for r in filtered_records
        if r not in product_pages
        and not any(p in (r.get("url") or "").lower() for p in ["/articles/", "/article/", "/knowledgebase/", "/gallery/", "/news/", "/blog/", "/blogs/"])
        and not any(ns in (r.get("url") or "").lower() for ns in NON_SHOPPING_DOMAINS)
    ]
    # Dynamically include all bona-fide product pages and qualified shopping candidates (do not truncate to 10)
    prioritized_records = (product_pages + other_pages) if product_pages else other_pages

    try:
        # ── Batch Processing Configuration ───────────────────────────────────────
        BATCH_SIZE = int(os.getenv("PRICE_AGENT_BATCH_SIZE", "10"))
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

        model_name = resolve_ollama_model()
        client = AsyncClient(host=settings.OLLAMA_HOST) if model_name and settings.OLLAMA_HOST else None

        for batch_idx, batch_records in enumerate(batches, start=1):
            print(f"\n[PriceAgent] ---> Processing Batch {batch_idx}/{num_batches} ({len(batch_records)} records)...")
            if client is None:
                batch_logs.append(f"Batch {batch_idx}/{num_batches}: Ollama is not configured; deterministic extraction will be used.")
                continue
            context_list = []
            for i, r in enumerate(batch_records, start=1):
                snippet = (r.get("content") or r.get("snippet") or "")[:280]
                context_list.append(f"[{i}] Store: {r.get('engine', 'Web')} | Title: {r.get('title', '')} | Details: {snippet}")
            context = "\n".join(context_list)

            prompt = f"""You are a multi-agent parser extracting e-commerce product listings.
Query: "{query}"

Analyze the dataset records. Deduce if this query targets 'clothing' or 'electronics' or 'general'.
Extract EVERY valid individual product matching the query intent from the records.

Output a valid JSON object matching this schema specification exactly:
{{
  "prices": [
    {{
      "record_id": 1,
      "product_name": "Full product brand and model name",
      "marketplace": "Storefront name (e.g. Amazon, Flipkart, Croma, Tata CLiQ)",
      "extracted_price": 1299,
      "original_price": 1999
    }}
  ],
  "detected_category": "electronics"
}}

Rules:
- record_id: Set to the integer index [i] of the source record (1, 2, 3, etc.).
- extracted_price: CURRENT payable purchase price as an integer in INR. If not found in text, set to null.
- original_price: Original crossed-out MRP only if explicitly shown.
- Do NOT extract accessories like cases, covers, or cables.

Records:
{context}
"""
            try:
                import asyncio
                response = await asyncio.wait_for(
                    client.chat(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        format="json",
                        options={"temperature": 0.1, "num_ctx": 2048, "num_predict": 350},
                    ),
                    timeout=90.0
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
                for item in batch_rows:
                    rec_id = item.get("record_id")
                    if isinstance(rec_id, int) and 1 <= rec_id <= len(batch_records):
                        item["_source_record"] = batch_records[rec_id - 1]
                b_cat = parsed_payload.get("detected_category") or parsed_payload.get("Category") or parsed_payload.get("category") or "general"
                detected_category_counts[b_cat] = detected_category_counts.get(b_cat, 0) + 1

                all_raw_extracted_rows.extend(batch_rows)
                msg = f"Batch {batch_idx}/{num_batches}: Processed {len(batch_records)} records -> Extracted {len(batch_rows)} raw product items."
                print(f"[PriceAgent] {msg}")
                batch_logs.append(msg)

            except Exception as b_err:
                err_msg = f"Batch {batch_idx}/{num_batches} exception/timeout ({b_err}). Engaging direct snippet extraction..."
                print(f"[PriceAgent] {err_msg}")
                batch_logs.append(err_msg)

        # Comprehensive Product Harvest:
        # Augment LLM extractions with candidate records that contain authentic snippet pricing
        is_electronics_query = any(
            k in query.lower() for k in [
                "watch", "smartwatch", "phone", "mobile", "smartphone", "laptop",
                "earphone", "headphone", "earbuds", "tv", "audio", "wearable"
            ]
        )
        auto_words_check = ["scooter", "bike", "motorcycle", "car", "vehicle"]

        for i, r in enumerate(filtered_records, start=1):
            url = (r.get("url") or "").lower()
            if any(bad in url for bad in ["/blog/", "/news/", "/article/", "wikipedia.org", "youtube.com", "youtu.be", "buying-guide", "price-list", "pricelist"]):
                continue
            if any(ns in url for ns in NON_SHOPPING_DOMAINS):
                continue
            if is_electronics_query and any(re.search(rf"\b{aw}\b", (r.get("title", "") + " " + url).lower()) for aw in auto_words_check):
                continue
            s_text = ((r.get("content") or "") + " " + (r.get("title") or ""))
            s_pricing = parse_snippet_pricing(s_text)
            curr = s_pricing.get("current_price")
            if curr and curr >= 50:
                r_url = r.get("url", "")
                if not any(row.get("_source_record") == r or (row.get("url") and row.get("url") == r_url) for row in all_raw_extracted_rows):
                    store = clean_marketplace_name(r.get("engine", ""), r_url)
                    if store.lower() in ("web", "india") or any(ns in r_url.lower() for ns in NON_SHOPPING_DOMAINS):
                        continue
                    all_raw_extracted_rows.append({
                        "record_id": i,
                        "product_name": r.get("title", ""),
                        "marketplace": store,
                        "extracted_price": curr,
                        "original_price": s_pricing.get("original_price"),
                        "url": r_url,
                        "_source_record": r,
                    })

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

            matched_rec = row.get("_source_record")
            if not matched_rec:
                matched_rec = find_source_record(filtered_records, marketplace, price, prod_name)

            target_url = (matched_rec.get("url") or "").strip() if matched_rec else ""
            clean_store = clean_marketplace_name(marketplace or (matched_rec.get("engine") if matched_rec else ""), target_url)
            is_product_page = is_specific_product_page(target_url)

            # Check if source record has a cleaner, genuine title from the store
            src_title = (matched_rec.get("title") or "").strip() if matched_rec else ""
            if src_title and len(src_title) >= 10:
                clean_src_title = re.sub(r"^(Buy\s+|Order\s+)", "", src_title, flags=re.IGNORECASE)
                clean_src_title = re.sub(r"\s+at\s+(Tata CLiQ|Amazon|Flipkart|Myntra|Croma|Reliance Digital).*$", "", clean_src_title, flags=re.IGNORECASE)
                clean_src_title = re.sub(r"\s*\|\s*.*$", "", clean_src_title).strip()
                if len(clean_src_title) >= 8 and not any(bad in clean_src_title.lower() for bad in ["search results", "online shopping", "buy online"]):
                    prod_name = clean_src_title
                    prod_name_lower = prod_name.lower()

            # Source snippet price verification double-lock
            source_snippet = ((matched_rec.get("content") or "") + " " + (matched_rec.get("title") or "")) if matched_rec else ""
            snippet_pricing = parse_snippet_pricing(source_snippet)
            snippet_current = snippet_pricing.get("current_price")
            snippet_mrp = snippet_pricing.get("original_price")
            snippet_prices = snippet_pricing.get("all_prices") or set()

            snippet_verified = False
            if snippet_current and snippet_current >= min_price_floor:
                if price <= 0 or price not in snippet_prices:
                    price = snippet_current
                snippet_verified = True
            elif price in snippet_prices:
                snippet_verified = True

            if price < min_price_floor:
                continue

            if any(tld in target_url for tld in [".cz/", ".sk/", ".pl/", ".de/", ".eu/", ".nl/", ".fr/", ".it/", ".es/", ".br/", ".pt/", ".mx/", ".ar/", ".cl/"]):
                continue

            if clean_store.lower() in {"usados", "usado", "mercadolivre", "olx.br", "olx.pt"}:
                continue

            # Flagship phone/laptop anomaly guard (prevents $582 USD or accessories being misparsed as ₹5,829 INR)
            flagship_keywords = ["iphone 17", "iphone 16", "iphone 15", "galaxy s24", "galaxy s25", "macbook", "ipad", "laptop"]
            if any(fk in prod_name_lower for fk in flagship_keywords) or any(fk in query.lower() for fk in ["macbook", "laptop", "iphone"]):
                if not any(acc in prod_name_lower for acc in ["case", "cover", "skin", "protector", "glass", "film", "strap", "stand", "pouch", "bag", "sleeve", "adapter"]):
                    # Genuine MacBook in India is never below ₹45,000 INR
                    if "macbook" in prod_name_lower or "macbook" in query.lower():
                        if price < 45000:
                            continue
                    elif "iphone" in prod_name_lower and any(num in prod_name_lower for num in ["14", "15", "16", "17"]):
                        if price < 25000:
                            continue
                    elif "laptop" in prod_name_lower or "laptop" in query.lower():
                        if price < 15000:
                            continue

            if any(hk in query.lower() for hk in ["headphone", "earphone", "earbud", "tws", "neckband", "headset"]):
                # Allow premium flagship headphones/AirPods (e.g. AirPods Max up to ₹70,000)
                if price > 80000:
                    continue

            # Cross-category automotive collision guard
            is_electronics_wearable = any(
                k in query.lower() for k in [
                    "watch", "smartwatch", "phone", "mobile", "smartphone", "laptop",
                    "earphone", "headphone", "earbuds", "tv", "audio", "wearable"
                ]
            )
            if is_electronics_wearable:
                auto_terms = ["scooter", "bike", "motorcycle", "car", "vehicle", "electric bike", "electric scooter", "activa", "jupiter", "ather", "ola s1"]
                if any(re.search(rf"\b{term}\b", prod_name_lower) for term in auto_terms):
                    continue
                if any(re.search(rf"\b{term}\b", target_url.lower()) for term in auto_terms):
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

            # Semantic Product & Generation Recognition:
            # When query specifically requests AirPods Pro 2 (or 2nd gen Pro):
            if any(p2 in q_lower for p2 in ["pro 2", "2nd gen", "pro 2nd", "generation 2"]):
                if "airpods" in q_lower:
                    # 1. Must be a Pro model (reject standard AirPods 2 / AirPods 2nd Gen non-Pro)
                    if "pro" not in prod_name_lower:
                        continue
                    # 2. Reject explicit conflict generations (1st gen, 3rd gen, 4th gen, Pro 3)
                    if any(bad_gen in prod_name_lower for bad_gen in [
                        "1st gen", "generation 1", "gen 1", "1st generation",
                        "3rd gen", "generation 3", "gen 3", "3rd generation", "pro 3",
                        "4th gen", "generation 4", "gen 4", "4th generation"
                    ]):
                        continue
                    # 3. Accept semantic 2nd gen equivalents:
                    # ("2", "2nd", "second", "gen 2", "gen-2", "2nd generation")
                    has_gen2_semantic = any(g2 in prod_name_lower for g2 in [
                        " 2", " 2nd", "second", "gen 2", "gen-2", "generation 2", "(2nd", "( 2nd", "2022"
                    ])
                    if not has_gen2_semantic:
                        continue

            if prod_name_lower in ["fossil watches", "fossil watches for women", "fossil watches for men", "watches"]:
                continue

            bad_name_keywords = [
                "eligible for", "pay on delivery", "how to", "reliable", "faq",
                "terms of", "privacy policy", "about us", "contact us", "refund",
                "shipping", "delivery charges", "customer care", "help center",
                "sign in", "login", "register", "cart", "wishlist", "checkout", "search",
                "store page", "asus store", "official store",
                # Counterfeit / clone / replica exclusions
                "cloned", "clone", "replica", "first copy", "1st copy", "mastercopy", "fake", "dupe",
                # Unrelated accessories & parts
                "ear pad", "ear cushion", "replacement cushion", "replacement pad",
                "headphone case", "carrying case", "protective case", "silicone cover",
                "headband cover", "audio cable", "aux cable", "ear tips", "anti-lost strap",
                "press stud", "tws skin", "ear hooks", "earbuds case", "case for", "cover for", "skin for",
                "top 10", "top 5", "buying guide", "best gaming monitors",
                "bikes in india", "scooters in india", "top under", "best under"
            ]
            if any(bw in prod_name_lower for bw in bad_name_keywords):
                continue

            # Reject generic documentation/news/aggregator/stock-photo domains pretending to be storefronts
            if any(ns in target_url.lower() for ns in [
                "docs.", "historiadenia.", "ndtvprofit.", "techlusive.", "notebookcheck.",
                "indiatoday.", "buyhatke.", "fundacionsierrablanca.", "pricehistory.app",
                "pexels.com", "pixabay.com", "freepik.com", "unsplash.com", "shutterstock.com",
                "deshgujarat.com", "mymobileindia.com",
                "/news/", "/article/", "/articles/", "/blog/", "/unboxed/", "-vs-", "vs-",
                "compare", "launch", "announced", "rumor", "/search/"
            ]):
                continue

            if clean_store.lower() in ("web", "india", "historiadenia", "techlusive", "ndtvprofit", "notebookcheck", "indiatoday", "buyhatke", "fundacionsierrablanca", "pricehistory", "pexels", "pixabay", "freepik", "unsplash", "deshgujarat", "mymobileindia"):
                continue
            t_url_lower = target_url.lower()
            if any(tld in t_url_lower for tld in [".gov", ".edu", ".mil", ".ac.in"]):
                continue
            generic_cat_names = [
                "shop", "buy", "online", "product", "item", "cables", "cable", "usb",
                "watches", "all smartwatches", "smart watches", "smartwatches", "smartphones",
                "all laptops", "all phones", "all products"
            ]
            if len(prod_name) < 6 or prod_name_lower in generic_cat_names:
                continue

            image_url = select_real_product_image(matched_rec, prod_name, filtered_records)
            status = "Price unavailable"

            results.append({
                "product_name": prod_name,
                "marketplace": clean_store,
                "extracted_price": None,
                "original_price": None,
                "status": status,
                "url": target_url,
                "is_verified": False,
                "price_verified": False,
                "price_verified_at": None,
                "price_verification_method": None,
                "currency": "INR",
                "availability_status": "unknown",
                "quantity": None,
                "quantity_source": None,
                "quantity_checked_at": None,
                "_snippet_verified": snippet_verified,
                "_snippet_price": price if price >= min_price_floor else None,
                "_snippet_mrp": snippet_mrp if snippet_mrp and snippet_mrp > price else None,
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

            if key not in best_by_key:
                best_by_key[key] = r
            else:
                existing_px = best_by_key[key].get("extracted_price")
                current_px = r.get("extracted_price")
                if current_px is not None and (existing_px is None or current_px < existing_px):
                    best_by_key[key] = r
        results = list(best_by_key.values())

        # Stage: Live Web Scraping for accurate prices
        import asyncio
        scrape_tasks = []
        scrape_indices = []
        verify_limit = max(1, int(os.getenv("MAX_PRODUCTS_TO_VERIFY", "20")))
        semaphore = asyncio.Semaphore(max(1, int(os.getenv("PRICE_VERIFICATION_CONCURRENCY", "4"))))

        async def bounded_scrape(target_url):
            async with semaphore:
                return await scrape_live_price(target_url)

        for idx, r in enumerate(results[:verify_limit]):
            url = r.get("url")
            if url and url.startswith("https://") and is_specific_product_page(url):
                scrape_tasks.append(bounded_scrape(url))
                scrape_indices.append(idx)

        if scrape_tasks:
            scraped_data_list = await asyncio.gather(*scrape_tasks)
            for idx, live_data in zip(scrape_indices, scraped_data_list):
                r = results[idx]
                live_price = live_data.get("price")
                live_mrp = live_data.get("original_price")
                live_image = live_data.get("image")

                if live_price and live_price >= min_price_floor:
                    # Apply flagship anomaly guard to live price
                    prod_name_lower = r.get("product_name", "").lower()
                    is_valid_live_price = True
                    flagship_keywords = ["iphone 17 pro", "iphone 16 pro", "iphone 15 pro", "galaxy s24 ultra", "galaxy s25 ultra", "macbook pro", "ipad pro"]
                    if any(fk in prod_name_lower for fk in flagship_keywords):
                        if not any(acc in prod_name_lower for acc in ["case", "cover", "skin", "protector", "glass", "film", "strap", "stand", "pouch", "bag"]):
                            if live_price < 25000:
                                is_valid_live_price = False

                    if is_valid_live_price:
                        clean_name = str(r.get('product_name', '')).encode('ascii', 'ignore').decode()
                        clean_market = str(r.get('marketplace', '')).encode('ascii', 'ignore').decode()
                        print(f"[PriceAgent] Live price match success! Updated {clean_name} from {clean_market}: {r['extracted_price']} -> {live_price}")
                        r["extracted_price"] = live_price
                        r["status"] = "Target Match" if not budget or live_price <= budget else "Out of Budget"
                        r["is_verified"] = True
                        r["_is_live_verified"] = True
                        if live_mrp and live_mrp > live_price:
                            r["original_price"] = live_mrp

                if live_image:
                    clean_name = str(r.get('product_name', '')).encode('ascii', 'ignore').decode()
                    print(f"[PriceAgent] Live image match success! Updated {clean_name} image: {r['image_url']} -> {live_image}")
                    r["image_url"] = live_image

        verified_results = []
        for r in results:
            snippet_price = r.pop("_snippet_price", None)
            snippet_mrp = r.pop("_snippet_mrp", None)
            snippet_verified = r.pop("_snippet_verified", False)
            is_live = r.pop("_is_live_verified", False)

            if is_live and r.get("extracted_price"):
                # Tier 1: Authoritative Live Page Verified
                r["is_verified"] = True
                r["price_verified"] = True
                r["price_verified_at"] = datetime.now(timezone.utc).isoformat()
                r["price_verification_method"] = "source_page"
                r["tags"] = ["Store Listing", "Live Verified"]
                verified_results.append(r)
            elif (snippet_verified or snippet_price) and snippet_price and snippet_price >= min_price_floor:
                # Tier 2: Search Index Verified (from authentic e-commerce product index/snippet)
                r["extracted_price"] = snippet_price
                if snippet_mrp and snippet_mrp > snippet_price:
                    r["original_price"] = snippet_mrp
                r["is_verified"] = True
                r["price_verified"] = True
                r["price_verified_at"] = datetime.now(timezone.utc).isoformat()
                r["price_verification_method"] = "store_index"
                r["status"] = "Target Match" if not budget or snippet_price <= budget else "Out of Budget"
                r["tags"] = ["Store Listing", "Indexed Offer"]
                verified_results.append(r)
            else:
                r["extracted_price"] = None
                r["original_price"] = None
                r["is_verified"] = False
                r["price_verified"] = False
                r["status"] = "Price unavailable"
                r["tags"] = ["Search Index", "Price Pending"]
                verified_results.append(r)

        # Sort prioritizing premier national marketplaces (Amazon, Flipkart, Croma, Reliance, etc.) first,
        # then regional retailers, with available prices preceding unavailable ones.
        PREMIER_MARKETPLACES = [
            "amazon", "flipkart", "croma", "reliance digital", "tata cliq", 
            "vijay sales", "apple", "samsung", "myntra", "poorvika"
        ]

        def marketplace_priority_key(x):
            # Has price? 0 if yes, 1 if not
            has_px = 0 if (x.get("extracted_price") and x.get("extracted_price") > 0) else 1
            m = str(x.get("marketplace", "")).lower()
            # Find store tier
            tier = 99
            for idx, pm in enumerate(PREMIER_MARKETPLACES):
                if pm in m:
                    tier = idx
                    break
            px = x.get("extracted_price") or float('inf')
            return (has_px, tier, px)

        results.sort(key=marketplace_priority_key)

        print(f"[PriceAgent] Final price_data count after product-level validation & deduplication: {len(results)}")
        batch_logs.append(f"Final price_data count: {len(results)}")

        return {
            "price_data": results,
            "logs": batch_logs
        }

    except Exception as e:
        print(f"Price comparison classification agent execution error: {e}")
        return {"price_data": [], "logs": [f"Price comparison agent error: {str(e)}"]}
