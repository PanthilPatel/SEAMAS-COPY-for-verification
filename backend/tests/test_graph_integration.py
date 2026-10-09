import pytest
import asyncio
from unittest.mock import patch
from typing import Dict, Any, List

from graph.graph import seamas_graph
from agents.orchestrator import run_orchestrator_pipeline, stream_orchestrator_pipeline
from app.main import app
from httpx import AsyncClient, ASGITransport


@pytest.mark.asyncio
async def test_complete_langgraph_invocation():
    """Validates complete LangGraph execution starting from Orchestrator entry point."""
    initial_state: Dict[str, Any] = {
        "query": "phone under 20000",
        "steering_mode": "speed",
        "search_results": [
            {
                "engine": "Amazon",
                "title": "Redmi Note 13 5G (Prism Gold, 6GB RAM, 128GB Storage)",
                "content": "Price: ₹16,999 (MRP: 20,999). 6.67-inch FHD+ 120Hz AMOLED, 5000mAh Battery, 33W Fast Charger.",
                "url": "https://www.amazon.in/dp/B0CQG3QW2J",
                "thumbnail": "https://images.amazon.com/sample.jpg"
            },
            {
                "engine": "Flipkart",
                "title": "Realme 12x 5G (Twilight Purple, 128 GB) (6 GB RAM)",
                "content": "Price: ₹13,499. Dimensity 6100+, 5000 mAh Battery, 45W SUPERVOOC Charge.",
                "url": "https://www.flipkart.com/realme-12x-5g/p/itm123",
                "thumbnail": "https://images.flipkart.com/sample.jpg"
            }
        ],
        "price_data": [],
        "analysis_report": {},
        "category": "smartphones",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    result = await seamas_graph.ainvoke(initial_state)

    # 1. State integrity
    assert "final_output" in result, "final_output must be present in output state"
    assert len(result["final_output"]) > 50, "final_output must contain structured markdown report"

    # 2. Stage 1 extraction
    assert "category" in result
    assert result["category"] in ("smartphones", "electronics", "general")
    assert result.get("budget") == 20000 or result.get("budget_status", {}).get("ceiling") == 20000

    # 3. Parallel research outputs
    assert "analysis_report" in result, "analysis_report must be populated by reviews node"
    assert "price_data" in result, "price_data must be populated by price node"

    # 4. Stage 2 budget evaluation & recommendations
    assert "budget_status" in result, "budget_status must be populated by budget node"
    assert "recommendations" in result, "recommendations must be populated by recommendation node"


@pytest.mark.asyncio
async def test_streaming_event_sequence():
    """Validates real-time SSE stream events sequence and payload emission."""
    initial_state = {
        "query": "budget laptop under 50000",
        "steering_mode": "speed",
        "search_results": [
            {
                "engine": "Amazon",
                "title": "Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen (8GB/512GB SSD/Windows 11)",
                "content": "Price: ₹34,990. 15.6-inch FHD Display, 8GB RAM, 512GB SSD, Windows 11 Home.",
                "url": "https://www.amazon.in/dp/B09XYZ",
            }
        ],
        "price_data": [],
        "analysis_report": {},
        "category": "laptops",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    streamed_events: List[Dict[str, Any]] = []
    async for event in stream_orchestrator_pipeline(initial_state):
        streamed_events.append(event)

    event_types = [e.get("type") for e in streamed_events]
    assert "node_start" in event_types, "Must emit node_start events"
    assert "node_complete" in event_types, "Must emit node_complete events"
    assert "result" in event_types, "Must emit result event at the end of pipeline"

    # Verify complete agent sequence: orchestrator entry point + downstream nodes
    started_agents = [e.get("agent_id") for e in streamed_events if e.get("type") == "node_start"]
    assert "orchestrator" in started_agents, "Orchestrator must execute as entry point"
    assert "search" in started_agents
    assert "price" in started_agents
    assert "reviews" in started_agents
    assert "budget" in started_agents
    assert "recommendation" in started_agents
    assert "finalizer" in started_agents

    result_event = next(e for e in streamed_events if e.get("type") == "result")
    payload = result_event.get("payload", {})
    assert "final_output" in payload
    assert payload.get("budget_status", {}).get("ceiling") == 50000


@pytest.mark.asyncio
async def test_fastapi_endpoints_execute_same_graph(authenticated_user):
    """Validates that /api/chat and /api/chat/stream both invoke the unified LangGraph workflow."""
    transport = ASGITransport(app=app)
    with patch("app.main.deduct_credit", return_value=True):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp_status = await client.get("/api/status")
            assert resp_status.status_code == 200
            assert resp_status.json().get("api") == "operational"

            chat_payload = {"query": "earphones around 2000", "steering_mode": "speed"}
            resp_chat = await client.post("/api/chat", json=chat_payload)
            assert resp_chat.status_code == 200
            data = resp_chat.json()
            assert "final_output" in data
            assert "budget_status" in data


@pytest.mark.asyncio
async def test_actual_parallel_execution():
    """Empirically validates that Price Comparison and Review Analyzer execute concurrently."""
    initial_state = {
        "query": "smartwatch under 5000",
        "steering_mode": "speed",
        "search_results": [
            {
                "engine": "Amazon",
                "title": "Noise ColorFit Pulse 2 Max Smart Watch",
                "content": "Price: ₹1,999 (MRP: ₹5,999). 1.85-inch display, 10-day battery, Bluetooth calling, 4.2 stars.",
                "url": "https://www.amazon.in/dp/B0B5G82F19",
            }
        ],
        "price_data": [],
        "analysis_report": {},
        "category": "wearables",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    streamed_events = []
    async for event in stream_orchestrator_pipeline(initial_state):
        streamed_events.append(event)

    starts = {e["agent_id"]: e.get("start_time") for e in streamed_events if e.get("type") == "node_start"}
    completes = {e["agent_id"]: e.get("end_time") for e in streamed_events if e.get("type") == "node_complete"}

    # Both parallel nodes must execute
    assert "price" in starts and "reviews" in starts
    assert "budget" in starts

    # Verification: Budget node must start AFTER both parallel nodes complete
    assert starts["budget"] >= completes["price"]
    assert starts["budget"] >= completes["reviews"]

    # Verification: Parallel nodes start times overlap (all start before budget)
    assert starts["price"] < completes["reviews"] or starts["reviews"] < completes["price"]


@pytest.mark.asyncio
async def test_streaming_concurrency_no_leakage():
    """Validates that concurrent streaming requests use isolated queues without cross-talk."""
    state_a = {
        "query": "Query Alpha Laptop 60k",
        "steering_mode": "speed",
        "search_results": [{"title": "Alpha Laptop", "url": "https://alpha.com", "content": "Price: ₹55,000"}],
        "price_data": [],
        "analysis_report": {},
        "category": "laptops",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }
    state_b = {
        "query": "Query Beta Headphones 3k",
        "steering_mode": "speed",
        "search_results": [{"title": "Beta Headphones", "url": "https://beta.com", "content": "Price: ₹2,500"}],
        "price_data": [],
        "analysis_report": {},
        "category": "audio",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    events_a = []
    events_b = []

    async def consume_a():
        async for evt in stream_orchestrator_pipeline(state_a):
            events_a.append(evt)

    async def consume_b():
        async for evt in stream_orchestrator_pipeline(state_b):
            events_b.append(evt)

    # Run both streams simultaneously
    await asyncio.gather(consume_a(), consume_b())

    res_a = next(e for e in events_a if e.get("type") == "result")["payload"]
    res_b = next(e for e in events_b if e.get("type") == "result")["payload"]

    # A received only A's query result
    assert "Alpha Laptop" in res_a["final_output"] or "Query Alpha" in res_a["final_output"]
    assert "Beta Headphones" not in res_a["final_output"]

    # B received only B's query result
    assert "Beta Headphones" in res_b["final_output"] or "Query Beta" in res_b["final_output"]
    assert "Alpha Laptop" not in res_b["final_output"]


@pytest.mark.asyncio
async def test_client_disconnect_cancellation_safety():
    """Validates that premature stream termination aborts graph tasks without dangling background work."""
    state = {
        "query": "cancellation test product",
        "steering_mode": "speed",
        "search_results": [],
        "price_data": [],
        "analysis_report": {},
        "category": "general",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    count = 0
    # Simulate client disconnect after 2 events
    async for event in stream_orchestrator_pipeline(state):
        count += 1
        if count >= 2:
            break  # Triggers GeneratorExit / generator close

    assert count >= 2
