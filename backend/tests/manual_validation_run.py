import asyncio
import json
import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from graph.graph import seamas_graph

def test_fastapi_e2e():
    print("==================================================")
    print("1. REAL FASTAPI E2E VALIDATION: /api/chat & /api/chat/stream")
    print("==================================================")
    client = TestClient(app)

    # 1A. /api/chat POST
    print("\n--- Testing /api/chat ---")
    payload = {"query": "best smartphone under ₹30000"}
    resp = client.post("/api/chat", json=payload)
    print(f"Status Code: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    print(f"Response Keys: {list(data.keys())}")
    assert "final_output" in data
    assert "price_data" in data
    print(f"Price items found: {len(data.get('price_data', []))}")
    print(f"Budget status: {data.get('budget_status', {}).get('status')}")
    print(f"Budget evaluations: {len(data.get('budget_evaluations', []))}")
    print(f"Final response excerpt:\n{data.get('final_output', '')[:200]}...")

    # 1B. /api/chat/stream POST (SSE)
    print("\n--- Testing /api/chat/stream ---")
    events = []
    with client.stream("POST", "/api/chat/stream", json=payload) as stream_resp:
        print(f"Stream Status Code: {stream_resp.status_code}")
        assert stream_resp.status_code == 200
        for line in stream_resp.iter_lines():
            if line.startswith("data:"):
                raw_json = line[len("data:"):].strip()
                try:
                    ev = json.loads(raw_json)
                    events.append(ev)
                except Exception:
                    pass

    print(f"Total SSE Events Received: {len(events)}")
    agent_ids = [e.get("agent_id") for e in events if e.get("agent_id")]
    print(f"Agent event sequence: {agent_ids}")
    assert "search" in agent_ids
    assert "price" in agent_ids
    assert "recommendation" in agent_ids
    assert "finalizer" in agent_ids
    final_event = next((e for e in reversed(events) if e.get("type") in ("result", "final_result")), None)
    assert final_event is not None, "Must receive a result event with payload"
    print(f"Final Stream Result Delivered successfully. Payload keys: {list(final_event.get('payload', {}).keys())}")


async def test_sanity_check_queries():
    print("\n==================================================")
    print("2. REALISTIC QUERY SANITY CHECK ACROSS 5 CATEGORIES")
    print("==================================================")
    
    queries = [
        ("best smartphone under ₹30000", 30000, "smartphones"),
        ("best laptop under ₹80000", 80000, "laptops"),
        ("best gaming laptop under ₹100000", 100000, "laptops"),
        ("best phone for camera under ₹50000", 50000, "smartphones"),
        ("wireless earbuds around ₹5000", 5000, "audio")
    ]

    for q, ceiling, expected_cat in queries:
        print(f"\n--- Checking Query: '{q}' ---")
        state = await seamas_graph.ainvoke({
            "query": q,
            "session_id": f"sanity_{expected_cat}",
            "intent": {},
            "raw_search_results": [],
            "price_data": [],
            "reviews_data": [],
            "budget_status": {},
            "budget_evaluations": [],
            "recommendations": {},
            "errors": [],
            "logs": [],
            "final_response": ""
        })

        b_status = state.get("budget_status", {})
        print(f"Detected Ceiling: {b_status.get('ceiling')} (Expected {ceiling})")
        print(f"Budget Type: {b_status.get('budget_type')}")
        assert b_status.get("ceiling") == ceiling, f"Expected {ceiling}, got {b_status.get('ceiling')}"

        recs = state.get("recommendations", [])
        print(f"Recommendations Count: {len(recs)}")
        for r in recs[:2]:
            print(f"  • {r}")
        
        evals = state.get("budget_evaluations", [])
        print(f"Evaluated offers: {len(evals)}")
        in_budget_items = [e for e in evals if e.get("status") in ("Target Match", "Stretch Match")]
        out_budget_items = [e for e in evals if e.get("status") == "Out of Budget"]
        print(f"In-budget offers: {len(in_budget_items)}, Out-of-budget offers: {len(out_budget_items)}")
        for ib in in_budget_items:
            assert ib.get("extracted_price") <= ceiling * (1.10 if b_status.get("budget_type") == "approximate" else 1.0)
        
        detected_category = state.get("category")
        print(f"Category detected: {detected_category} (Expected {expected_cat})")
        assert detected_category == expected_cat, f"Expected {expected_cat}, got {detected_category}"
        print(f"Sanity check for '{q}' PASSED.")

if __name__ == "__main__":
    test_fastapi_e2e()
    asyncio.run(test_sanity_check_queries())
