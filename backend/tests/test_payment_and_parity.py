import pytest
import json
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
import razorpay

from app.main import app, create_initial_state, current_user
from schemas.request_models import ChatRequest
from core.config import settings


def mock_payment_db(transaction):
    db = MagicMock()
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [transaction]
    db.rpc.return_value.execute.return_value.data = 599
    return db


@pytest.mark.asyncio
async def test_create_initial_state_consistency():
    """Validates that create_initial_state constructs the exact required schema and defaults."""
    req = ChatRequest(
        query="wireless headphones under 3000",
        steering_mode="speed",
        user_id="test-user-123"
    )
    state = create_initial_state(req)

    assert state["query"] == "wireless headphones under 3000"
    assert state["steering_mode"] == "speed"
    assert state["category"] == "general"
    assert state["budget"] is None
    assert state["budget_type"] == "none"
    assert state["user_preferences"] == {}
    assert state["search_results"] == []
    assert state["price_data"] == []
    assert state["analysis_report"] == {}
    assert state["recommendations"] == []
    assert state["budget_status"] == {}
    assert isinstance(state["logs"], list) and len(state["logs"]) == 1


@pytest.mark.asyncio
async def test_chat_and_stream_endpoint_semantic_parity(authenticated_user):
    """
    Proves that equivalent /api/chat and /api/chat/stream requests produce
    equivalent final result semantics (products, budget evaluations, recommendations, final_output).
    """
    transport = ASGITransport(app=app)
    mock_final_state = {
        "query": "phone under 20000",
        "category": "smartphones",
        "budget": 20000,
        "budget_type": "hard_limit",
        "user_preferences": {},
        "search_results": [
            {"title": "Redmi Note 13", "url": "https://store.com/redmi", "content": "Price: 15000"}
        ],
        "price_data": [
            {
                "product_name": "Redmi Note 13",
                "marketplace": "Amazon",
                "extracted_price": 15000,
                "status": "Target Match",
                "is_verified": True
            }
        ],
        "analysis_report": {
            "summary": "Excellent battery and screen.",
            "pros": ["Battery", "Screen"],
            "cons": []
        },
        "budget_status": {
            "ceiling": 20000,
            "budget_type": "hard_limit",
            "status": "Target Match"
        },
        "budget_evaluations": [
            {"product_name": "Redmi Note 13", "status": "Target Match", "price": 15000}
        ],
        "recommendations": ["Redmi Note 13 is the top choice under 20k."],
        "final_output": "# SEAMAS Evaluation Report\n\nTop Pick: Redmi Note 13 at ₹15,000.",
        "logs": ["Done"]
    }

    payload = {
        "query": "phone under 20000",
        "steering_mode": "speed"
    }

    async def fake_stream(_state):
        yield {"type": "result", "payload": mock_final_state}

    with patch("app.main.deduct_credit", return_value=True), patch("graph.graph.seamas_graph.ainvoke", return_value=mock_final_state), patch("app.main.stream_orchestrator_pipeline", fake_stream):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Non-streaming endpoint
                resp_chat = await client.post("/api/chat", json=payload)
                assert resp_chat.status_code == 200
                chat_res = resp_chat.json()

                # 2. Streaming endpoint
                resp_stream = await client.post("/api/chat/stream", json=payload)
                assert resp_stream.status_code == 200
                assert "text/event-stream" in resp_stream.headers.get("content-type", "")

                stream_events = []
                for line in resp_stream.text.split("\n"):
                    line = line.strip()
                    if line.startswith("data: "):
                        stream_events.append(json.loads(line[6:]))

                result_event = next(e for e in stream_events if e.get("type") == "result")
                stream_res = result_event.get("payload", {})

                # Parity Assertions
                assert chat_res["category"] == stream_res["category"] == "smartphones"
                assert chat_res["price_data"] == stream_res["price_data"]
                assert chat_res["budget_status"] == stream_res["budget_status"]
                assert chat_res["budget_evaluations"] == stream_res["budget_evaluations"]
                assert chat_res["recommendations"] == stream_res["recommendations"]
                assert chat_res["final_output"] == stream_res["final_output"]


@pytest.mark.asyncio
async def test_payment_missing_credentials_fails_safely(authenticated_user):
    """Verifies that missing Razorpay credentials returns HTTP 503 without exposing secrets."""
    transport = ASGITransport(app=app)
    with patch("app.main.supabase", MagicMock()), patch.object(settings, "RAZORPAY_KEY_ID", ""):
        with patch.object(settings, "RAZORPAY_KEY_SECRET", ""):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/api/create-order", json={"plan_type": "pro_monthly"})
                assert resp.status_code == 503
                detail = resp.json().get("detail", "")
                assert "Payment service is not configured" in detail
                # Ensure no secrets or internal tokens are printed
                assert "rzp_" not in detail
                assert "secret" not in detail.lower() or "missing" in detail.lower()


@pytest.mark.asyncio
async def test_payment_create_order_rejects_unrecognized_client_fields(authenticated_user):
    """Checkout accepts only server-owned plan identifiers."""
    transport = ASGITransport(app=app)
    with patch.object(settings, "RAZORPAY_KEY_ID", "rzp_test_mock123"):
        with patch.object(settings, "RAZORPAY_KEY_SECRET", "mock_secret_abc"):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/api/create-order", json={"plan_type": "topup", "pack_id": "unlisted", "amount": 1, "credits": 999999})
                assert resp.status_code == 422


@pytest.mark.asyncio
async def test_payment_create_order_razorpay_api_failure(authenticated_user):
    """Validates that Razorpay upstream API failures return sanitized HTTP 500 without leaking credentials."""
    transport = ASGITransport(app=app)
    with patch.object(settings, "RAZORPAY_KEY_ID", "rzp_test_mock123"):
        with patch.object(settings, "RAZORPAY_KEY_SECRET", "mock_secret_abc"):
            mock_client = MagicMock()
            mock_client.payment_link.create.side_effect = Exception("Authorization: Bearer rzp_test_mock123 failed with 401")
            with patch("app.main.get_razorpay_client", return_value=mock_client):
                with patch("app.main.supabase", MagicMock()):
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        resp = await client.post("/api/create-order", json={"plan_type": "pro_monthly"})
                    assert resp.status_code == 502
                    detail = resp.json().get("detail", "")
                    assert "Payment initialization failed" in detail
                    assert "rzp_test_mock123" not in detail
                    assert "Bearer" not in detail


@pytest.mark.asyncio
async def test_payment_verify_tampered_signature_rejected(authenticated_user):
    transaction = {"id": "00000000-0000-0000-0000-000000000456", "user_id": authenticated_user["id"], "razorpay_payment_link_id": "plink_123", "plan_type": "pro_monthly", "credits": 500, "amount": 100, "currency": "INR", "status": "pending"}
    db = mock_payment_db(transaction)
    client_mock = MagicMock()
    client_mock.utility.verify_payment_link_signature.side_effect = razorpay.errors.SignatureVerificationError("Signature mismatch")
    with patch("app.main.supabase", db), patch("app.main.get_razorpay_client", return_value=client_mock):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/verify-payment", json={"razorpay_payment_link_id": "plink_123", "razorpay_payment_id": "pay_999", "razorpay_signature": "tampered_fake_signature_hash", "user_id": "attacker"})
    assert response.status_code == 400
    db.rpc.assert_not_called()


@pytest.mark.asyncio
async def test_payment_verify_uses_server_transaction_entitlement(authenticated_user):
    tx_id = "00000000-0000-0000-0000-000000000456"
    transaction = {"id": tx_id, "user_id": authenticated_user["id"], "razorpay_payment_link_id": "plink_123", "plan_type": "topup", "credits": 250, "amount": 200, "currency": "INR", "status": "pending"}
    db = mock_payment_db(transaction)
    client_mock = MagicMock()
    client_mock.payment.fetch.return_value = {"status": "captured", "amount": 200, "currency": "INR", "payment_link_id": "plink_123"}
    client_mock.payment_link.fetch.return_value = {"status": "paid", "amount": 200, "reference_id": tx_id}
    with patch("app.main.supabase", db), patch("app.main.get_razorpay_client", return_value=client_mock):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/verify-payment", json={"razorpay_payment_link_id": "plink_123", "razorpay_payment_id": "pay_999", "razorpay_signature": "valid_authentic_signature", "user_id": "attacker", "plan_type": "pro_monthly", "topup_credits": 999999})
    assert response.status_code == 200
    assert response.json()["credits"] == 599
    db.rpc.assert_called_once_with("complete_payment_and_credit", {"p_transaction_id": tx_id, "p_user_id": authenticated_user["id"], "p_payment_id": "pay_999"})


@pytest.mark.asyncio
async def test_payment_verification_requires_authenticated_user():
    app.dependency_overrides.pop(current_user, None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/verify-payment", json={"razorpay_payment_link_id": "plink_123", "razorpay_payment_id": "pay_999", "razorpay_signature": "valid_authentic_signature"})
    assert response.status_code == 401
