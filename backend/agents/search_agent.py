import asyncio
import os
from typing import List, Dict, Any
from urllib.parse import urlparse
from tools.search_tools import web_search_tool

MAX_SEARCH_PAGES = int(os.getenv("MAX_SEARCH_PAGES", "4"))


def normalize_url(raw_url: str) -> str:
    """
    Normalizes a URL string for consistent deduplication.
    Strips whitespace, lowercases, removes 'www.', trailing slashes, etc.
    """
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url.strip())
        scheme = parsed.scheme.lower() or "http"
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/")
        query_str = f"?{parsed.query}" if parsed.query else ""
        return f"{scheme}://{netloc}{path}{query_str}"
    except Exception:
        return raw_url.strip().lower().rstrip("/")


async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("query", "")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Sequential multi-page search for '{query}' (Max Pages: {MAX_SEARCH_PAGES}) ---")

    shopping_query_1 = f"{query} buy store product options"
    shopping_query_2 = f"{query} amazon flipkart myntra electronics pricing"
    shopping_query_3 = f"{query} marketplace listings online"
    sentiment_query = f"{query} review rating user feedback india"

    sem = asyncio.Semaphore(4)

    async def sem_search(q: str, max_res: int, aug: bool, page_no: int):
        async with sem:
            return await web_search_tool(q, max_results=max_res, augment_query=aug, page=page_no)

    all_raw_results: List[Dict[str, Any]] = []
    page_logs: List[str] = []

    for current_page in range(1, MAX_SEARCH_PAGES + 1):
        print(f"\n[SearchAgent] ---> Fetching Search Results for Page {current_page} of {MAX_SEARCH_PAGES}...")
        page_results: List[Dict[str, Any]] = []

        try:
            res_shop1, res_shop2, res_shop3, res_sentiment = await asyncio.gather(
                sem_search(shopping_query_1, 15, True, current_page),
                sem_search(shopping_query_2, 15, False, current_page),
                sem_search(shopping_query_3, 15, True, current_page),
                sem_search(sentiment_query, 15, False, current_page),
                return_exceptions=True,
            )

            for res in [res_shop1, res_shop2, res_shop3, res_sentiment]:
                if isinstance(res, Exception):
                    print(f"[SearchAgent] Warning: Search query error on Page {current_page}: {res}")
                elif isinstance(res, list):
                    page_results.extend(res)

        except Exception as page_err:
            print(f"[SearchAgent] Error fetching Page {current_page}: {page_err}. Continuing to next page...")
            page_logs.append(f"Page {current_page} fetch failed: {page_err}")

        all_raw_results.extend(page_results)
        log_msg = f"Page {current_page}: Collected {len(page_results)} raw results. Running total accumulated: {len(all_raw_results)}."
        print(f"[SearchAgent] {log_msg}")
        page_logs.append(log_msg)

    merged: List[Dict[str, Any]] = []

    for record in all_raw_results:
        raw_url = record.get("url", "").strip()
        if not raw_url:
            continue

        norm_url = normalize_url(raw_url)

        if any(sm in norm_url for sm in ["youtube.com", "youtu.be", "twitter.com", "x.com", "instagram.com", "facebook.com", "tiktok.com"]):
            continue

        merged.append(record)

    summary_log_1 = f"Total raw results collected across all {MAX_SEARCH_PAGES} pages: {len(all_raw_results)}."
    summary_log_2 = f"Passing complete dataset: {len(merged)} results to downstream agents (Price Comparison, Review Analyzer, Recommendation)."
    handoff_log = f"[SearchAgent] Passing complete dataset ({len(merged)} records) to downstream agents."

    print(f"\n[SearchAgent] === MULTI-PAGE SEARCH SUMMARY ===")
    print(f"[SearchAgent] {summary_log_1}")
    print(f"[SearchAgent] {summary_log_2}")
    print(handoff_log)

    return {
        "search_results": merged,
        "logs": [
            f"Search Agent completed sequential multi-page search (Pages 1 to {MAX_SEARCH_PAGES}).",
            summary_log_1,
            summary_log_2,
            handoff_log,
        ] + page_logs,
    }
