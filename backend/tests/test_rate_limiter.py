from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from core.config import settings
from utils.rate_limiter import RateLimitUnavailable, _key, check_rate_limit


@pytest.mark.asyncio
async def test_rate_limit_calls_shared_atomic_script(monkeypatch):
    monkeypatch.setattr(settings, "UPSTASH_REDIS_REST_URL", "https://redis.example.net")
    monkeypatch.setattr(settings, "UPSTASH_REDIS_REST_TOKEN", "test-token")
    monkeypatch.setattr(settings, "RATE_LIMIT_KEY_SECRET", "h" * 40)
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"result": [0, 1250]}
    response.raise_for_status.return_value = None
    client = MagicMock()
    client.__aenter__.return_value = client
    client.post = AsyncMock(return_value=response)
    with patch("utils.rate_limiter.httpx.AsyncClient", return_value=client):
        allowed, retry = await check_rate_limit("chat", "user-1", 10, 60)
    assert (allowed, retry) == (False, 2)
    command = client.post.await_args.kwargs["json"]
    assert command[0] == "EVAL"
    assert "ZREMRANGEBYSCORE" in command[1] and "ZADD" in command[1] and "ZRANGE" in command[1]
    assert command[2] == 2
    assert command[-2:] == [60, 10]
    assert "user-1" not in str(command)


@pytest.mark.asyncio
async def test_production_limiter_fails_closed_without_shared_store(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "UPSTASH_REDIS_REST_URL", "")
    monkeypatch.setattr(settings, "UPSTASH_REDIS_REST_TOKEN", "")
    with pytest.raises(RateLimitUnavailable):
        await check_rate_limit("chat", "user-1", 10, 60)


def test_rate_limit_key_hides_identity(monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_KEY_SECRET", "s" * 40)
    key = _key("auth-ip", "192.0.2.10")
    assert key.startswith("seamas:rate:")
    assert "192.0.2.10" not in key


@pytest.mark.asyncio
async def test_sensitive_route_returns_429_and_retry_after(authenticated_user):
    with patch("app.main.check_rate_limit", new=AsyncMock(return_value=(False, 7))):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/credits/me")
    assert response.status_code == 429
    assert response.headers["retry-after"] == "7"


@pytest.mark.asyncio
async def test_sensitive_route_fails_closed_when_redis_unavailable(authenticated_user):
    with patch("app.main.check_rate_limit", new=AsyncMock(side_effect=RateLimitUnavailable("offline"))):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/credits/me")
    assert response.status_code == 503
    assert "offline" not in response.text
