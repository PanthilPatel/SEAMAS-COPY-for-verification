from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.main import app, charge_search_credits, fetch_my_credits, search_cost
from utils.credits_db import CreditServiceUnavailable, deduct_credit, get_credits


def test_search_costs_are_server_owned():
    assert search_cost("speed") == 5
    assert search_cost("balanced") == 10
    assert search_cost("accuracy") == 20


def test_deduction_accepts_only_explicit_rpc_boolean(monkeypatch):
    class Result:
        data = True

    class DB:
        def rpc(self, *_args):
            return self

        def execute(self):
            return Result()

    monkeypatch.setattr("utils.credits_db.supabase", DB())
    assert deduct_credit("auth-user", 10) is True


def test_deduction_storage_failure_is_not_insufficient(monkeypatch):
    class DB:
        def rpc(self, *_args):
            raise RuntimeError("database unavailable")

    monkeypatch.setattr("utils.credits_db.supabase", DB())
    with pytest.raises(CreditServiceUnavailable):
        deduct_credit("auth-user", 10)


def test_credit_balance_rejects_missing_or_invalid_value(monkeypatch):
    class Response:
        data = {"tier": "pro", "credits": "1470"}

    class Query:
        def select(self, *_args): return self
        def eq(self, *_args): return self
        def single(self): return self
        def execute(self): return Response()

    class DB:
        def table(self, *_args): return Query()

    monkeypatch.setattr("utils.credits_db.supabase", DB())
    with pytest.raises(CreditServiceUnavailable):
        get_credits("auth-user")


@pytest.mark.asyncio
async def test_declined_rpc_with_sufficient_balance_is_not_reported_insufficient(authenticated_user):
    with patch("app.main.enforce_rate_limit", new=AsyncMock()), \
         patch("app.main.deduct_credit", return_value=False) as deduct, \
         patch("app.main.get_credits", return_value={"tier": "pro", "credits": 1470}):
        with pytest.raises(HTTPException) as exc:
            charge_search_credits(authenticated_user, 10)

    assert exc.value.status_code == 503
    assert exc.value.detail == {
        "code": "credits_inconsistent",
        "message": "The credit service could not reconcile your balance. No search was started; please retry.",
        "available_credits": 1470,
        "required_credits": 10,
        "user_ref": authenticated_user["id"][:8],
    }
    deduct.assert_called_once_with(authenticated_user["id"], 10)


@pytest.mark.asyncio
@pytest.mark.parametrize("available", [0, 4])
async def test_true_insufficient_balance_returns_402_with_cost_and_current_balance(authenticated_user, available):
    with patch("app.main.deduct_credit", return_value=False), \
         patch("app.main.get_credits", return_value={"tier": "free", "credits": available}):
        with pytest.raises(HTTPException) as exc:
            charge_search_credits(authenticated_user, 5)
    assert exc.value.status_code == 402
    assert exc.value.detail["code"] == "insufficient_credits"
    assert exc.value.detail["available_credits"] == available
    assert exc.value.detail["required_credits"] == 5


def test_exactly_sufficient_balance_is_allowed_by_atomic_authority(authenticated_user):
    with patch("app.main.deduct_credit", return_value=True) as deduct:
        charge_search_credits(authenticated_user, 5)
    deduct.assert_called_once_with(authenticated_user["id"], 5)


@pytest.mark.asyncio
async def test_stream_endpoint_returns_diagnostic_credit_response(authenticated_user):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with patch("app.main.enforce_rate_limit", new=AsyncMock()), \
             patch("app.main.deduct_credit", return_value=False) as deduct, \
             patch("app.main.get_credits", return_value={"tier": "free", "credits": 0}):
            response = await client.post("/api/chat/stream", json={"query": "iPhone", "steering_mode": "balanced", "user_id": "another-user"})

    assert response.status_code == 402
    assert response.json()["detail"] == {
        "code": "insufficient_credits",
        "message": "Insufficient search credits. Please upgrade your plan.",
        "available_credits": 0,
        "required_credits": 10,
        "user_ref": authenticated_user["id"][:8],
    }
    deduct.assert_called_once_with(authenticated_user["id"], 10)


@pytest.mark.asyncio
async def test_credit_service_failure_returns_503_not_false_insufficient(authenticated_user):
    with patch("app.main.deduct_credit", side_effect=CreditServiceUnavailable("offline")):
        with pytest.raises(HTTPException) as exc:
            charge_search_credits(authenticated_user, 10)
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == "credits_unavailable"


@pytest.mark.asyncio
async def test_credit_endpoint_reads_authenticated_profile_row(authenticated_user):
    with patch("app.main.enforce_rate_limit", new=AsyncMock()), \
         patch("app.main.get_credits", return_value={"tier": "pro", "credits": 1470}) as read:
        result = await fetch_my_credits(authenticated_user)
    assert result == {"tier": "pro", "credits": 1470}
    read.assert_called_once_with(authenticated_user["id"])
