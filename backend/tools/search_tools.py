import os
import re
import httpx
from urllib.parse import urlparse
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

_DOMAIN_STORE_MAP = {
    # Major Indian Marketplaces
    "amazon.in": "Amazon",
    "amazon.com": "Amazon",
    "flipkart.com": "Flipkart",
    "croma.com": "Croma",
    "reliancedigital.in": "Reliance Digital",
    "vijaysales.com": "Vijay Sales",
    "tatacliq.com": "Tata CLIQ",
    "luxury.tatacliq.com": "Tata CLiQ Luxury",
    "snapdeal.com": "Snapdeal",
    "myntra.com": "Myntra",
    "meesho.com": "Meesho",
    "paytmmall.com": "Paytm Mall",
    "nykaa.com": "Nykaa",
    "nykaaman.com": "Nykaa Man",
    "shopsy.in": "Shopsy",
    "jiomart.com": "JioMart",
    "poorvika.com": "Poorvika",
    "sangeethamobil.com": "Sangeetha Mobiles",
    "ajio.com": "Ajio",
    "bewakoof.com": "Bewakoof",
    # Major Tech & Electronics Brands
    "samsung.com": "Samsung",
    "apple.com": "Apple",
    "mi.com": "Xiaomi",
    "oneplus.com": "OnePlus",
    "oneplus.in": "OnePlus",
    "realme.com": "Realme",
    "asus.com": "ASUS",
    "lenovo.com": "Lenovo",
    "hp.com": "HP",
    "dell.com": "Dell",
    "acer.com": "Acer",
    "lg.com": "LG",
    "sony.co.in": "Sony",
    "sony.com": "Sony",
    "boseindia.com": "Bose",
    "jbl.com": "JBL",
    # Audio & Wearables D2C Brands
    "boat-lifestyle.com": "boAt",
    "gonoise.com": "Noise",
    "fireboltt.com": "Fire-Boltt",
    "ptron.in": "ptron",
    "boultaudio.com": "Boult Audio",
    "goboult.co.in": "Boult Audio",
    "crossbeats.com": "Crossbeats",
    "pebblecart.com": "Pebble",
    # Watches & Fashion Brands
    "titan.co.in": "Titan",
    "fastrack.in": "Fastrack",
    "fossil.com": "Fossil",
    "casioindiashop.com": "Casio",
    "timexindia.com": "Timex",
    "helioswatchstore.com": "Helios Watches",
    "ethoswatches.com": "Ethos Watches",
    "garmin.co.in": "Garmin",
    "amazfit.co.in": "Amazfit",
}

NON_SHOPPING_DOMAINS = [
    # News, Editorial, & Media Portals (Must not be treated as e-commerce shopping storefronts)
    "livemint.com", "ndtv.com", "gadgets360.com", "91mobiles.com", "indiatimes.com",
    "timesofindia.com", "hindustantimes.com", "indianexpress.com", "news18.com",
    "zeenews.india.com", "businesstoday.in", "economictimes.indiatimes.com",
    "financialexpress.com", "moneycontrol.com", "theverge.com", "techradar.com",
    "cnet.com", "pcmag.com", "tomsguide.com", "gizmochina.com", "gsmarena.com",
    "analyticsinsight.net", "wareable.com", "digit.in", "smartprix.com",
    "mysmartprice.com", "bgr.in", "beebom.com", "thehindu.com", "firstpost.com",
    "cashify.in", "reuters.com", "bloomberg.com", "bbc.com", "cnn.com",
    "wired.com", "nytimes.com", "wsj.com", "zdnet.com", "engadget.com",
    "gizmodo.com", "mashable.com", "slashgear.com", "androidcentral.com",
    "androidauthority.com", "xda-developers.com", "zimsonwatches.com",
    "timesnownews.com", "abplive.com", "dnaindia.com", "jagran.com", "amarujala.com",
    "lokmat.com", "ndtvprofit.com", "techlusive.in", "indiatoday.in", "freepressjournal.in",
    "deccanherald.com", "financialexpress.com", "thequint.com", "outlookindia.com",
    "kotaku.com", "polygon.com", "ign.com", "gamespot.com", "eurogamer.net",
    "macrumors.com", "9to5mac.com", "appleinsider.com", "xdaforums.com",
    # Academic / Medical / Government / Non-Profit Repositories
    "nih.gov", "ncbi.nlm.nih.gov", "pmc.ncbi.nlm.nih.gov", "researchgate.net", "academia.edu",
    # B2B Directories & Classifieds (Not consumer e-commerce shopping storefronts)
    "dial4trade.com", "indiamart.com", "tradeindia.com", "exportersindia.com", "justdial.com", "sulekha.com",
    # Automotive / Vehicle Portals (Must never collide with electronics/wearables queries)
    "thebikejunction.com", "bikewale.com", "bikedekho.com", "bikencar.com",
    "zigwheels.com", "carwale.com", "cardekho.com", "autocarindia.com",
    "drivespark.com", "motorbeam.com",
    # Social Media, Forums, Video & Stock Photo Platforms (Not shopping storefronts)
    "youtube.com", "youtu.be", "facebook.com", "instagram.com", "twitter.com",
    "x.com", "tiktok.com", "pinterest.com", "reddit.com", "quora.com",
    "medium.com", "linkedin.com", "wikipedia.org",
    "pexels.com", "pixabay.com", "freepik.com", "unsplash.com", "shutterstock.com",
    "gettyimages.com", "istockphoto.com", "alamy.com"
]


def _domain_to_store(url: str) -> str:
    """
    Extracts a human-readable store label from a result URL.
    Falls back to the clean main domain name if no direct mapping is found,
    or 'Web' if domain is a known non-shopping portal.
    """
    if not url:
        return "Web"
    try:
        hostname = urlparse(url).hostname or ""
        hostname = re.sub(r"^www\.", "", hostname).lower()
        if any(nsd in hostname for nsd in NON_SHOPPING_DOMAINS):
            return "Web"
        if hostname in _DOMAIN_STORE_MAP:
            return _DOMAIN_STORE_MAP[hostname]
        for dom, name in _DOMAIN_STORE_MAP.items():
            if hostname == dom or hostname.endswith("." + dom):
                return name
        parts = hostname.split(".")
        main_name = parts[-2] if len(parts) >= 2 and parts[-2] not in {"co", "com", "org", "gov", "net"} else parts[0]
        return main_name.capitalize() if main_name else "Web"
    except Exception:
        return "Web"


def _build_shopping_query(query: str) -> str:
    """
    Appends light commerce qualifiers to bias the search toward buyable
    listings on verified shopping platforms.
    """
    return query.strip() + " price buy online shopping amazon flipkart croma india"


async def _query_tavily(effective_query: str, max_results: int, page: int, tavily_key: str) -> List[Dict[str, Any]]:
    if not tavily_key:
        return []
    try:
        print(f"[SearchTool] Querying Tavily API for page {page} (query: '{effective_query}')...")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_key,
                    "query": effective_query,
                    "search_depth": "advanced",
                    "max_results": max(max_results, 25),
                    "include_images": True,
                    "include_raw_content": False,
                    "include_answer": False,
                    "exclude_domains": NON_SHOPPING_DOMAINS[:60],
                },
            )
            if response.status_code == 200:
                res_json = response.json()
                raw_results = res_json.get("results", [])
                images = res_json.get("images", [])
                records = []
                seen_urls = set()
                for idx, r in enumerate(raw_results):
                    url = r.get("url", "")
                    if not url or url in seen_urls:
                        continue
                    # Skip any non-shopping domains that bypassed the API filter
                    url_lower = url.lower()
                    if any(nsd in url_lower for nsd in NON_SHOPPING_DOMAINS):
                        continue
                    seen_urls.add(url)
                    store_label = _domain_to_store(url)
                    
                    thumbnail = r.get("thumbnail") or r.get("image") or r.get("img_src")
                    if not thumbnail and idx < len(images):
                        thumbnail = images[idx]

                    records.append(
                        {
                            "engine": store_label,
                            "title": r.get("title", ""),
                            "content": r.get("content", r.get("snippet", "")),
                            "url": url,
                            "thumbnail": thumbnail or "",
                        }
                    )
                    if len(records) >= max_results:
                        break

                print(f"[SearchTool] Tavily returned {len(records)} verified records for page {page}.")
                return records
            else:
                print(f"[SearchTool] Tavily HTTP {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"[SearchTool] Tavily error for page {page}: {repr(e)}")
    return []


async def web_search_tool(
    query: str,
    max_results: int = 20,
    augment_query: bool = True,
    page: int = 1,
) -> List[Dict[str, Any]]:
    """
    Executes an e-commerce web search.
    PRIMARY: SearXNG (seamas-searxng.onrender.com or local) using bing, yandex, privacywall, zapmeta, duckduckgo, brave.
    BACKUP: Tavily API (triggered ONLY if SearXNG fails, times out, or returns contaminated/zero results).
    Uses up to 2 retry attempts before falling back to Tavily.
    """
    effective_query = _build_shopping_query(query) if augment_query else query
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    searxng_url = os.getenv("SEARXNG_BASE_URL", "https://seamas-searxng.onrender.com").rstrip("/")
    searxng_timeout = float(os.getenv("SEARXNG_TIMEOUT", "10.0"))

    # ── 1. PRIMARY SEARCH: SearXNG (with retry on transient timeout) ──────────
    if searxng_url:
        for attempt in range(2):  # Try up to 2 times before falling through to Tavily
            try:
                records = []
                seen_urls = set()

                async with httpx.AsyncClient(timeout=searxng_timeout) as client:
                    print(f"[SearchTool] [PRIMARY] Querying SearXNG page {page} (attempt {attempt+1}, timeout={searxng_timeout}s): {searxng_url} (query: '{effective_query}')")
                    response = await client.get(
                        f"{searxng_url}/search",
                        params={
                            "q": effective_query,
                            "format": "json",
                            "language": "en-IN",
                            "categories": "general",
                            "engines": "bing,yandex,privacywall,zapmeta,duckduckgo,brave",
                            "safesearch": "0",
                            "pageno": page,
                        },
                    )

                if response.status_code == 200:
                    raw_results = response.json().get("results", [])
                    if raw_results:
                        query_words = [w.lower() for w in query.split() if len(w) >= 3]
                        for r in raw_results:
                            url = r.get("url", "")
                            if not url or url in seen_urls:
                                continue
                            url_lower = url.lower()
                            if any(nsd in url_lower for nsd in NON_SHOPPING_DOMAINS):
                                continue
                            seen_urls.add(url)
                            store_label = _domain_to_store(url)
                            records.append({
                                "engine": store_label,
                                "title": r.get("title", ""),
                                "content": r.get("content", r.get("snippet", "")),
                                "url": url,
                                "thumbnail": r.get("thumbnail") or r.get("img_src") or r.get("image") or "",
                            })
                            if len(records) >= max_results:
                                break

                        # Relevance Validation: Verify SearXNG results actually match query keywords
                        relevant_count = 0
                        for rec in records:
                            combined = f"{rec.get('title', '')} {rec.get('content', '')}".lower()
                            if any(qw in combined for qw in query_words):
                                relevant_count += 1

                        relevance_ratio = (relevant_count / len(records)) if records else 0.0
                        if relevance_ratio >= 0.25 and len(records) >= 3:
                            print(f"[SearchTool] SearXNG page {page} SUCCESS: {len(records)} relevant records collected (relevance ratio {relevance_ratio:.2f}).")
                            return records
                        else:
                            print(f"[SearchTool] SearXNG page {page} returned low relevance ({relevance_ratio:.2f}). Switching to Tavily backup...")
                            break  # No retry for low-relevance; go to Tavily
                    else:
                        print(f"[SearchTool] SearXNG page {page} returned 0 results. Retrying..." if attempt == 0 else f"[SearchTool] SearXNG page {page} returned 0 results after retry. Switching to Tavily backup...")
                else:
                    print(f"[SearchTool] SearXNG page {page} returned HTTP {response.status_code}. Switching to Tavily backup...")
                    break  # No retry for explicit HTTP errors

            except Exception as e:
                if attempt == 0:
                    print(f"[SearchTool] SearXNG page {page} error ({e}). Retrying...")
                else:
                    print(f"[SearchTool] SearXNG page {page} error after retry ({e}). Switching to Tavily backup...")

    # ── 2. BACKUP SEARCH: Tavily ─────────────────────────────────────────────
    if tavily_key:
        print(f"[SearchTool] [BACKUP] Engaging Tavily for page {page}...")
        tavily_records = await _query_tavily(effective_query, max_results, page, tavily_key)
        if tavily_records:
            return tavily_records

    print(f"[SearchTool] All search sources exhausted for page {page}. Returning empty list.")
    return []