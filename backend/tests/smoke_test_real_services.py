import asyncio
import time
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agents.orchestrator import run_orchestrator_pipeline
from core.config import resolve_ollama_model, settings


async def run_single_smoke_test(run_label: str, query: str):
    print(f"\n==================================================================")
    print(f"SMOKE TEST EXECUTION: {run_label} | Query: '{query}'")
    print(f"==================================================================")
    
    resolved_model = resolve_ollama_model()
    print(f"[Environment] SearXNG Target: {settings.SEARXNG_BASE_URL}")
    print(f"[Environment] Tavily Fallback: {'CONFIGURED' if settings.TAVILY_API_KEY else 'DISABLED (No Key)'}")
    print(f"[Environment] Ollama Model: {resolved_model or 'OFFLINE/UNAVAILABLE (Using Deterministic Non-LLM Fallback)'}")

    initial_state = {
        "query": query,
        "category": "general",
        "budget": None,
        "budget_type": "none",
        "user_preferences": {},
        "search_results": [],
        "price_data": [],
        "analysis_report": {},
        "recommendations": [],
        "budget_status": {},
        "steering_mode": "speed",
        "logs": []
    }

    t0 = time.time()
    result = await run_orchestrator_pipeline(initial_state)
    elapsed = time.time() - t0

    # Inspection of resulting state
    search_count = len(result.get("search_results", []))
    price_count = len(result.get("price_data", []))
    verified_price_count = sum(1 for p in result.get("price_data", []) if p.get("is_verified"))
    budget_eval_count = len(result.get("budget_evaluations", []))
    budget_ceiling = result.get("budget_status", {}).get("ceiling")
    recs = result.get("recommendations", [])
    report_length = len(result.get("final_output", ""))

    print(f"\n[Run Results: {run_label}]")
    print(f"  ↳ Total End-to-End Elapsed: {elapsed:.2f}s")
    print(f"  ↳ Search Records Collected: {search_count}")
    print(f"  ↳ Price Offers Extracted:   {price_count} (Verified: {verified_price_count})")
    print(f"  ↳ Budget Ceiling Extracted: ₹{budget_ceiling:,}" if budget_ceiling else "  ↳ Budget Ceiling: None")
    print(f"  ↳ Budget Evaluations Tagged:{budget_eval_count}")
    print(f"  ↳ Specs Extracted:          {len(specs)} keys: {list(specs.keys())[:5]}")
    print(f"  ↳ Recommendations Produced: {len(recs)}")
    print(f"  ↳ Final Report Size:        {report_length} characters")

    return {
        "label": run_label,
        "elapsed": elapsed,
        "search_count": search_count,
        "price_count": price_count,
        "verified_count": verified_price_count,
        "specs_count": len(specs),
        "recs_count": len(recs),
        "budget_status": result.get("budget_status"),
        "top_deal": result.get("price_data", [{}])[0] if result.get("price_data") else None,
        "top_rec": recs[0] if recs else None,
    }


async def main():
    query = "best smartphone under ₹30000"
    
    # Run 1: Cold run
    run1 = await run_single_smoke_test("Run 1 (Cold)", query)
    
    # Run 2: Warm run
    run2 = await run_single_smoke_test("Run 2 (Warm)", query)

    # Run 3: Warm run
    run3 = await run_single_smoke_test("Run 3 (Warm)", query)

    times = [run1["elapsed"], run2["elapsed"], run3["elapsed"]]
    avg_time = sum(times) / len(times)
    min_time = min(times)
    max_time = max(times)

    print("\n==================================================================")
    print("REAL-SERVICE SMOKE TEST BENCHMARK SUMMARY")
    print("==================================================================")
    print(f"Cold Run Latency:    {run1['elapsed']:.2f}s")
    print(f"Warm Run 1 Latency:  {run2['elapsed']:.2f}s")
    print(f"Warm Run 2 Latency:  {run3['elapsed']:.2f}s")
    print(f"Fastest Run:         {min_time:.2f}s")
    print(f"Slowest Run:         {max_time:.2f}s")
    print(f"Average Latency:     {avg_time:.2f}s")
    print(f"Top Extracted Deal:  {run1['top_deal']}")
    print(f"Top Recommendation:  {run1['top_rec']}")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(main())
