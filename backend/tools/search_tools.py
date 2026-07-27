import os
import re
import httpx
from urllib.parse import urlparse
from typing import List, Dict, Any

_DOMAIN_STORE_MAP = {
    "amazon.in": "Amazon",
    "amazon.com": "Amazon",
    "flipkart.com": "Flipkart",
    "croma.com": "Croma",
    "reliancedigital.in": "Reliance Digital",
    "vijaysales.com": "Vijay Sales",
    "tatacliq.com": "Tata CLIQ",
    "snapdeal.com": "Snapdeal",
    "myntra.com": "Myntra",
    "meesho.com": "Meesho",
    "paytmmall.com": "Paytm Mall",
    "nykaa.com": "Nykaa",
    "shopsy.in": "Shopsy",
    "jiomart.com": "JioMart",
    "samsung.com": "Samsung",
    "apple.com": "Apple",
    "mi.com": "Xiaomi",
    "oneplus.com": "OnePlus",
    "realme.com": "Realme",
    "asus.com": "ASUS",
    "lg.com": "LG",
    "sony.com": "Sony",
}


def _domain_to_store(url: str) -> str:
    """
    Extracts a human-readable store label from a result URL.
    Falls back to the clean main domain name if no direct mapping is found.
    """
    if not url:
        return "Web"
    try:
        hostname = urlparse(url).hostname or ""
        hostname = re.sub(r"^www\.", "", hostname).lower()
        if hostname in _DOMAIN_STORE_MAP:
            return _DOMAIN_STORE_MAP[hostname]
        parts = hostname.split(".")
        main_name = parts[-2] if len(parts) >= 2 and parts[-2] not in {"co", "com", "org", "gov", "net"} else parts[0]
        return main_name.capitalize() if main_name else "Web"
    except Exception:
        return "Web"


def _build_shopping_query(query: str) -> str:
    """
    Appends light commerce qualifiers to bias the search toward buyable
    listings, without restricting to a fixed set of big retailers — this
    lets smaller/local Indian e-commerce sites surface too, instead of
    only the handful of major platforms.
    """
    return query.strip() + " price buy online india"    


async def web_search_tool(
    query: str,
    max_results: int = 20,
    augment_query: bool = True,
    page: int = 1,
) -> List[Dict[str, Any]]:
    """
    Queries the live SearXNG instance for a specific page (pageno=page),
    falling back to Tavily ONLY if SearXNG fails, times out, or returns empty for that page.

    Args:
        query:          Raw user query string.
        max_results:    Maximum number of records to return for this call.
        augment_query:  If True, appends Indian e-commerce site qualifiers.
        page:           Page number to fetch (default 1).

    Returns:
        List of dicts: { engine, title, content, url, thumbnail }
    """
    effective_query = _build_shopping_query(query) if augment_query else query

    searxng_url = os.getenv("SEARXNG_BASE_URL", "http://localhost:8080").rstrip("/")
    if searxng_url:
        try:
            records = []
            seen_urls = set()

            async with httpx.AsyncClient(timeout=60.0) as client:
                print(f"[SearchTool] Querying SearXNG page {page}: {searxng_url} (query: '{effective_query}')")
                response = await client.get(
                    f"{searxng_url}/search",
                    params={
                        "q": effective_query,
                        "format": "json",
                        "language": "en-IN",
                        "engines": "google",
                        "safesearch": "0",
                        "pageno": page,
                    },
                )

                if response.status_code == 200:
                    raw_results = response.json().get("results", [])
                    if raw_results:
                        for r in raw_results:
                            url = r.get("url", "")
                            if not url or url in seen_urls:
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

                        print(f"[SearchTool] SearXNG page {page} returned {len(raw_results)} raw results, {len(records)} extracted records.")
                        return records
                    else:
                        print(f"[SearchTool] SearXNG page {page} returned 0 usable results. Triggering Tavily fallback for page {page}...")
                else:
                    print(f"[SearchTool] SearXNG page {page} returned HTTP {response.status_code}. Triggering Tavily fallback for page {page}...")

        except Exception as e:
            print(f"[SearchTool] SearXNG page {page} failed ({repr(e)}). Switching to Tavily fallback for page {page}...")

    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if tavily_key:
        try:
            print(f"[SearchTool] Querying fallback Tavily API for page {page}...")
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": tavily_key,
                        "query": effective_query,
                        "search_depth": "advanced",
                        "max_results": max(max_results, 20),
                        "include_images": True,
                        "include_raw_content": False,
                        "include_answer": False,
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

                    print(f"[SearchTool] Tavily fallback returned {len(records)} records for page {page}.")
                    return records
                else:
                    print(f"[SearchTool] Tavily HTTP {response.status_code}: {response.text[:200]}")
        except Exception as e:
            print(f"[SearchTool] Tavily fallback failed for page {page}: {repr(e)}")

    print(f"[SearchTool] All search sources exhausted for page {page}. Returning empty list.")
    return []