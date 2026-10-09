"""
Benchmark tool to measure sequential vs parallel execution performance of the
SEAMAS LangGraph multi-agent graph.
Times sequential graph execution vs parallel graph execution with simulated/mocked I/O
and prints the measured % improvement.
"""

import asyncio
import time
import os
import sys
from typing import Dict, Any

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from langgraph.graph import StateGraph, END
from graph.state import AgentState


# Simulated agent workloads representing real I/O latency distributions
async def mock_search(state: Dict[str, Any]) -> Dict[str, Any]:
    await asyncio.sleep(0.05)
    return {
        "search_results": [{"title": "OnePlus 12", "url": "https://amazon.in/dp/B0CQG3QW2J", "content": "Deal"}]
    }

async def mock_price(state: Dict[str, Any]) -> Dict[str, Any]:
    # Price verification involves HTTP scraping & network latency
    await asyncio.sleep(0.30)
    return {
        "price_data": [{"product_name": "OnePlus 12", "extracted_price": 64999, "is_verified": True}]
    }

async def mock_reviews(state: Dict[str, Any]) -> Dict[str, Any]:
    # Review analysis involves sentiment scoring / summarization
    await asyncio.sleep(0.25)
    return {
        "analysis_report": {"summary": "Excellent battery and display quality", "pros": ["Battery"], "cons": ["Heavy"]}
    }

async def mock_budget(state: Dict[str, Any]) -> Dict[str, Any]:
    # Budget evaluation logic
    await asyncio.sleep(0.05)
    return {
        "budget_status": {"ceiling": 70000, "budget_type": "hard_limit", "status": "Budget ceiling locked at ₹70,000"}
    }

async def mock_recommendation(state: Dict[str, Any]) -> Dict[str, Any]:
    await asyncio.sleep(0.10)
    return {"recommendations": ["Top Pick: OnePlus 12 at ₹64,999"]}

async def mock_finalizer(state: Dict[str, Any]) -> Dict[str, Any]:
    await asyncio.sleep(0.02)
    return {"final_output": "SEAMAS Executive Evaluation Report Complete"}


def build_sequential_graph():
    wf = StateGraph(AgentState)
    wf.add_node("search", mock_search)
    wf.add_node("price", mock_price)
    wf.add_node("reviews", mock_reviews)
    wf.add_node("budget", mock_budget)
    wf.add_node("recommendation", mock_recommendation)
    wf.add_node("finalizer", mock_finalizer)

    wf.set_entry_point("search")
    wf.add_edge("search", "price")
    wf.add_edge("price", "reviews")
    wf.add_edge("reviews", "budget")
    wf.add_edge("budget", "recommendation")
    wf.add_edge("recommendation", "finalizer")
    wf.add_edge("finalizer", END)
    return wf.compile()


def build_parallel_graph():
    wf = StateGraph(AgentState)
    wf.add_node("search", mock_search)
    wf.add_node("price", mock_price)
    wf.add_node("reviews", mock_reviews)
    wf.add_node("budget", mock_budget)
    wf.add_node("recommendation", mock_recommendation)
    wf.add_node("finalizer", mock_finalizer)

    wf.set_entry_point("search")
    # Parallel Fan-Out from search to price, reviews, and budget
    wf.add_edge("search", "price")
    wf.add_edge("search", "reviews")
    wf.add_edge("search", "budget")
    # Fan-In at recommendation
    wf.add_edge("price", "recommendation")
    wf.add_edge("reviews", "recommendation")
    wf.add_edge("budget", "recommendation")
    wf.add_edge("recommendation", "finalizer")
    wf.add_edge("finalizer", END)
    return wf.compile()


async def run_benchmark(iterations: int = 5):
    print("=" * 60)
    print("SEAMAS Multi-Agent Graph Concurrency Benchmark")
    print(f"Executing {iterations} iterations for sequential vs parallel workflows...")
    print("=" * 60)

    seq_graph = build_sequential_graph()
    par_graph = build_parallel_graph()

    base_state = {
        "query": "OnePlus 12 under 70000",
        "category": "smartphones",
        "budget": 70000,
        "budget_type": "hard_limit",
        "logs": [],
        "errors": []
    }

    # Warmup
    await seq_graph.ainvoke(base_state.copy())
    await par_graph.ainvoke(base_state.copy())

    # Sequential timings
    seq_times = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        await seq_graph.ainvoke(base_state.copy())
        seq_times.append(time.perf_counter() - t0)

    # Parallel timings
    par_times = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        await par_graph.ainvoke(base_state.copy())
        par_times.append(time.perf_counter() - t0)

    avg_seq = sum(seq_times) / len(seq_times)
    avg_par = sum(par_times) / len(par_times)
    speedup_pct = ((avg_seq - avg_par) / avg_seq) * 100

    print(f"Sequential Average Latency: {avg_seq:.4f} s")
    print(f"Parallel Average Latency:   {avg_par:.4f} s")
    print(f"Measured Improvement:       {speedup_pct:.2f}% faster")
    print("=" * 60)
    return avg_seq, avg_par, speedup_pct


if __name__ == "__main__":
    asyncio.run(run_benchmark())
