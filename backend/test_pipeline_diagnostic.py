import asyncio
from dotenv import load_dotenv
load_dotenv()
from agents.search_agent import search_agent
from agents.price_comparison_agent import price_comparison_agent

async def diagnose():
    state = {
        "query": "apple airpods pro 2",
        "category": "audio",
        "steering_mode": "balanced",
        "budget_status": {}
    }
    search_out = await search_agent(state)
    search_results = search_out.get("search_results", [])
    print(f"\n[DIAGNOSTIC] Normalized search results: {len(search_results)}")
    for i, r in enumerate(search_results[:15], 1):
        clean_title = str(r.get('title', '')).encode('ascii', 'ignore').decode()[:70]
        print(f"  {i}. [{r.get('engine')}] {clean_title} | Score: {r.get('score')} | URL: {r.get('url')[:60]}")
    
    price_state = {
        "query": "apple airpods pro 2",
        "category": "audio",
        "steering_mode": "balanced",
        "search_results": search_results,
        "budget_status": {}
    }
    price_out = await price_comparison_agent(price_state)
    price_data = price_out.get("price_data", [])
    print(f"\n[DIAGNOSTIC] Final price_data candidates: {len(price_data)}")
    for i, p in enumerate(price_data, 1):
        clean_pname = str(p.get('product_name', '')).encode('ascii', 'ignore').decode()
        print(f"  {i}. [{p.get('marketplace')}] {clean_pname} -> INR {p.get('extracted_price')} | Verified: {p.get('is_verified')} | URL: {p.get('url')[:60]}")

if __name__ == "__main__":
    asyncio.run(diagnose())
