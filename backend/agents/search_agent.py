import asyncio
from typing import List, Dict, Any
from tools.search_tools import web_search_tool


async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("query", "")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Aggregating web data for '{query}' ---")

    sentiment_query = f"{query} review rating user feedback india"

    shopping_query = query
    shopping_results, sentiment_results = await asyncio.gather(
        web_search_tool(shopping_query,  max_results=30, augment_query=True),
        web_search_tool(sentiment_query, max_results=20, augment_query=False),
    )

    seen_urls: set = set()
    merged: List[Dict[str, Any]] = []

    for record in shopping_results + sentiment_results:
        url = record.get("url", "")
        if url and url in seen_urls:
            continue
        seen_urls.add(url)
        merged.append(record)

    merged = merged[:50]

    print(f"Search complete. Collected {len(merged)} web records "
          f"({len(shopping_results)} shopping + {len(sentiment_results)} sentiment, deduplicated).")

    return {
        "search_results": merged,
        "logs": [
            f"Search agent aggregated {len(merged)} records for: '{query}' "
            f"({len(shopping_results)} shopping, {len(sentiment_results)} sentiment)."
        ],
    }