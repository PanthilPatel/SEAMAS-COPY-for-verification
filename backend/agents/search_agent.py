import asyncio
from typing import List, Dict, Any
from tools.search_tools import web_search_tool
from urllib.parse import urlparse

async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("query", "")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Aggregating web data for '{query}' ---")

    shopping_query_1 = f"{query} buy store product options"
    shopping_query_2 = f"{query} amazon flipkart myntra electronics pricing"
    shopping_query_3 = f"{query} marketplace listings online"
    sentiment_query = f"{query} review rating user feedback india"

    sem = asyncio.Semaphore(2)

    async def sem_search(q, max_res, aug):
        async with sem:
            return await web_search_tool(q, max_results=max_res, augment_query=aug)

    res_shop1, res_shop2, res_shop3, res_sentiment = await asyncio.gather(
        sem_search(shopping_query_1, 40, True),
        sem_search(shopping_query_2, 40, False),
        sem_search(shopping_query_3, 40, True),
        sem_search(sentiment_query, 20, False),
    )

    seen_urls: set = set()
    merged: List[Dict[str, Any]] = []

    for record in res_shop1 + res_shop2 + res_shop3 + res_sentiment:
        url = record.get("url", "").lower()
        if not url:
            continue
        if url in seen_urls:
            continue

        if "youtube.com" in url or "youtu.be" in url:
            continue
        if any(pc in url for pc in ["/news/", "/article/", "/articles/", "/press-release/", "/press/"]):
            continue
        try:
            domain = urlparse(url).netloc.lower()
        except Exception:
            domain = ""
        if any(dk in domain for dk in ["youtube", "twitter", "reddit", "quora", "facebook", "instagram"]):
            continue

        seen_urls.add(record.get("url", ""))
        merged.append(record)

    merged = merged[:150]

    print(f"Search complete. Collected {len(merged)} web records.")

    return {
        "search_results": merged,
        "logs": [
            f"Search agent aggregated {len(merged)} records for: '{query}'."
        ],
    }