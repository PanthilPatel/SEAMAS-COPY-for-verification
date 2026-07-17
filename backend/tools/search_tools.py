import os
import re
import httpx
from urllib.parse import urlparse
from typing import List, Dict, Any

_DOMAIN_STORE_MAP = {
    "amazon.in": "Amazon.in",
    "amazon.com": "Amazon.com",
    "flipkart.com": "Flipkart",
    "croma.com": "Croma",
    "reliancedigital.in": "Reliance Digital",
    "vijaysales.com": "Vijay Sales",
    "tatacliq.com": "Tata Cliq",
    "snapdeal.com": "Snapdeal",
    "myntra.com": "Myntra",
    "meesho.com": "Meesho",
    "paytmmall.com": "Paytm Mall",
    "nykaa.com": "Nykaa",
    "shopsy.in": "Shopsy",
    "jiomart.com": "JioMart",
    "samsung.com": "Samsung Official",
    "apple.com": "Apple Official",
    "mi.com": "Mi/Xiaomi Official",
    "oneplus.com": "OnePlus Official",
    "realme.com": "Realme Official",
    "asus.com": "ASUS Official",
    "lg.com": "LG Official",
    "sony.com": "Sony Official",
}


def _domain_to_store(url: str) -> str:
    """
    Extracts a human-readable store label from a result URL.
    Falls back to the raw domain if no mapping found.
    """
    if not url:
        return "Web"
    try:
        hostname = urlparse(url).hostname or ""
        hostname = re.sub(r"^www\.", "", hostname)
        return _DOMAIN_STORE_MAP.get(hostname, hostname or "Web")
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
) -> List[Dict[str, Any]]:
    """
    Queries the live SearXNG instance (Render or localhost),
    falling back to Tavily if SearXNG is asleep / times out / returns empty.

    Args:
        query:          Raw user query string.
        max_results:    Maximum number of records to return (default 20).
        augment_query:  If True, appends Indian e-commerce site qualifiers.

    Returns:
        List of dicts: { engine, title, content, url, thumbnail }
    """
    effective_query = _build_shopping_query(query) if augment_query else query

    searxng_url = os.getenv("SEARXNG_BASE_URL", "http://localhost:8080").rstrip("/")
    if searxng_url:
        try:
            records = []
            seen_urls = set()
            max_pages = 5

            async with httpx.AsyncClient(timeout=4.0) as client:
                for page in range(1, max_pages + 1):
                    if len(records) >= max_results:
                        break

                    print(f"[SearchTool] Querying SearXNG page {page}: {searxng_url}")
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

                    if response.status_code != 200:
                        print(f"[SearchTool] SearXNG HTTP {response.status_code} on page {page}. Stopping pagination.")
                        break

                    raw_results = response.json().get("results", [])
                    if not raw_results:
                        print(f"[SearchTool] SearXNG page {page} returned 0 results. Stopping pagination.")
                        break

                    count_before = len(records)

                    for r in raw_results:
                        url = r.get("url", "")
                        if url in seen_urls:
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

                    new_this_page = len(records) - count_before
                    print(f"[SearchTool] Page {page}: SearXNG returned {len(raw_results)} raw results, "
                          f"{new_this_page} new unique record(s) added (running total: {len(records)})")

            if records:
                print(f"[SearchTool] SearXNG returned {len(records)} deduplicated records across pages.")
                return records
            else:
                print("[SearchTool] SearXNG returned 0 usable results across all pages.")

        except Exception as e:
            print(f"[SearchTool] SearXNG failed: {e}. Switching to Tavily...")

    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if tavily_key:
        try:
            print("[SearchTool] Querying fallback Tavily API (advanced depth)...")
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
                        if url in seen_urls:
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

                    print(
                        f"[SearchTool] Tavily returned {len(records)} records."
                    )
                    return records
                else:
                    print(f"[SearchTool] Tavily HTTP {response.status_code}: {response.text[:200]}")
        except Exception as e:
            print(f"[SearchTool] Tavily also failed: {e}")

    print("[SearchTool] All search sources exhausted. Returning empty list.")
    return []