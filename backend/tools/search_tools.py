import os
import httpx
from typing import List, Dict, Any

async def web_search_tool(query: str) -> List[Dict[str, Any]]:
    """
    Queries the live SearXNG instance (Render or Localhost),
    falling back to Tavily if SearXNG is asleep, timing out, or empty.
    """
    searxng_url = os.getenv("SEARXNG_BASE_URL", "http://localhost:8080").rstrip('/')
    
    if searxng_url:
        try:
            print(f"Querying primary SearXNG instance at: {searxng_url}")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{searxng_url}/search", 
                    params={"q": query, "format": "json"},
                )
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    if results:
                        print(f"[SearXNG] Connected! Extracted {min(len(results), 3)} records.")
                        return [
                            {
                                "engine": "searxng",
                                "title": r.get("title", ""),
                                "content": r.get("snippet", r.get("content", ""))
                            }
                            for r in results[:3]
                        ]
                    else:
                        print("SearXNG returned 200 OK but 0 search results.")
        except Exception as e:
            print(f"Primary SearXNG failed to respond: {e}. Switching to Tavily...")

    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if tavily_key:
        try:
            print("Querying fallback Tavily API...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": tavily_key, "query": query, "search_depth": "basic"},
                    timeout=5.0
                )
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    return [
                        {
                            "engine": "tavily",
                            "title": r.get("title", ""),
                            "content": r.get("snippet", r.get("content", "")) 
                        }
                        for r in results[:3]
                    ]
        except Exception as e:
            print(f"Fallback Tavily API also failed: {e}")

    return []