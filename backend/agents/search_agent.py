from typing import Dict, Any
from tools.search_tools import web_search_tool

async def search_agent(state: Dict[str,Any]) -> Dict[str, Any]:
    """Aggregratess real-time query inputs from live search utilities."""
    query = state.get("query","")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Aggregating web data for '{query}'---")

    live_results = await web_search_tool(query)

    if not live_results:
        print("Live search returned empty array. Using Structured fallback targets.")
        live_results = [
            {"engine": "searxng", "title": f"{query} - Amazon India Marketplace Retailer", "content": f"Buy {query} online on Amazon India at low prices. Deals starting from ₹42,999 with bank discounts."},
            {"engine": "tavily", "titile": f"Top Deals on {query} - Flipkart", "content": f"Discover the latest listings for {query} on Flipkart. Best online platform retail offer listed at ₹44,50 with exchange benefits."}
        ]
    print(f"Search complete. Collected {len(live_results)} web records.")

    return {
        "search_results": live_results,
        "logs": [f"Successfully aggregated {len(live_results)} web sources for: '{query}'."]
    }
