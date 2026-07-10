import asyncio
from typing import List, Dict, Any
from tools.search_tools import web_search_tool


async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Search Agent LangGraph node.

    Fires two parallel searches:
      1. Shopping-focused  — forces Indian storefront coverage
      2. Sentiment-focused — review/rating/specification signals

    The two result sets are merged and deduplicated by URL before
    being returned on the `search_results` key (Annotated / operator.add).
    """
    query = state.get("query", "")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Aggregating web data for '{query}' ---")

    sentiment_query = f"{query} review rating user feedback india"

    shopping_query = query
    shopping_results, sentiment_results = await asyncio.gather(
        web_search_tool(shopping_query,  max_results=15, augment_query=True),
        web_search_tool(sentiment_query, max_results=10, augment_query=False),
    )

    seen_urls: set = set()
    merged: List[Dict[str, Any]] = []

    for record in shopping_results + sentiment_results:
        url = record.get("url", "")
        if url and url in seen_urls:
            continue
        seen_urls.add(url)
        merged.append(record)

    merged = merged[:20]

    print(f"Search complete. Collected {len(merged)} web records "
          f"({len(shopping_results)} shopping + {len(sentiment_results)} sentiment, deduplicated).")

    return {
        "search_results": merged,
        "logs": [
            f"Search agent aggregated {len(merged)} records for: '{query}' "
            f"({len(shopping_results)} shopping, {len(sentiment_results)} sentiment)."
        ],
    }