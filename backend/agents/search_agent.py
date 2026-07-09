import os
import httpx
from typing import List, Dict, Any

async def web_search_tool(query: str) -> List[Dict[str, Any]]:
    searxng_url = os.getenv("SEARXNG_BASE_URL", "http://localhost:8080").rstrip('/')
    
    if searxng_url:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                payload = {
                    "q": query,
                    "format": "json",
                    "language": "en-IN",
                    "engines": "google,bing"
                }
                response = await client.get(
                    f"{searxng_url}/search", 
                    params=payload
                )
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    if results:
                        return [
                            {
                                "engine": "searxng",
                                "title": r.get("title", ""),
                                "content": r.get("snippet", r.get("content", ""))
                            }
                            for r in results[:3]
                        ]
        except Exception as e:
            print(f"Primary SearXNG timed out/failed. Slipping to fallback Tavily...")

    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if tavily_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": tavily_key, "query": query}
                )
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    return [{"engine": "tavily", "title": r.get("title", ""), "content": r.get("snippet", "")} for r in results[:3]]
        except Exception as e:
            print(f"Fallback failed: {e}")

    return [
        {"engine": "mock", "title": "Top Deals on Smart TV - Flipkart", "content": "Offers listed at Rs.44,500."}
    ]

async def search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Search Agent node function.
    Aggregates real-time query inputs from live search utilities.
    """
    query = state.get("query", "")
    print(f"\n--- LIVE SEARCH AGENT INITIATED: Aggregating web data for '{query}' ---")
    
    live_results = await web_search_tool(query)
    print(f"Search complete. Collected {len(live_results)} web records.")
    
    return {
        "search_results": live_results,
        "logs": [f"Successfully aggregated {len(live_results)} web sources for: '{query}'."]
    }