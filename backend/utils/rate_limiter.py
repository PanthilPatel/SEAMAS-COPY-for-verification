"""Distributed sliding-window rate limiting using Upstash Redis REST.

No process-local counters are used. All app instances run the same atomic Lua
script against the shared Redis database. Development can run without Redis;
production configuration requires the REST URL, token, and key-hashing secret.
"""
from __future__ import annotations

import hashlib
import hmac
from typing import Any
from urllib.parse import urlparse

import httpx

from core.config import settings


class RateLimitUnavailable(RuntimeError):
    """The shared rate-limit service did not return a valid result."""


SLIDING_WINDOW_LUA = """
local window_ms = tonumber(ARGV[1]) * 1000
local limit = tonumber(ARGV[2])
local redis_time = redis.call('TIME')
local now_ms = tonumber(redis_time[1]) * 1000 + math.floor(tonumber(redis_time[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now_ms - window_ms)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  local retry_ms = window_ms
  if #oldest >= 2 then
    retry_ms = math.max(0, tonumber(oldest[2]) + window_ms - now_ms)
  end
  return {0, retry_ms}
end
local sequence = redis.call('INCR', KEYS[2])
redis.call('ZADD', KEYS[1], now_ms, tostring(now_ms) .. ':' .. tostring(sequence))
redis.call('PEXPIRE', KEYS[1], window_ms)
redis.call('PEXPIRE', KEYS[2], window_ms)
return {1, 0}
""".strip()


def _key(scope: str, identity: str) -> str:
    secret = settings.RATE_LIMIT_KEY_SECRET or "seamas-development-only"
    digest = hmac.new(secret.encode(), f"{scope}:{identity}".encode(), hashlib.sha256).hexdigest()
    return f"seamas:rate:{digest}"


async def _send_upstash_command(url: str, token: str, command: list[Any]) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.post(
                url.rstrip("/"),
                json=command,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict) or "error" in payload:
            raise RateLimitUnavailable("The shared rate-limit service rejected a command.")
        return payload
    except RateLimitUnavailable:
        raise
    except (httpx.HTTPError, ValueError) as exc:
        raise RateLimitUnavailable("The shared rate-limit service is unavailable.") from exc


async def check_rate_limit(scope: str, identity: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds), atomically across app instances."""
    if limit < 1 or window_seconds < 1 or not scope or not identity:
        raise ValueError("A positive rate limit, window, scope, and identity are required.")

    url = settings.UPSTASH_REDIS_REST_URL.strip()
    token = settings.UPSTASH_REDIS_REST_TOKEN.strip()
    if not url or not token:
        if settings.ENVIRONMENT.lower() != "production":
            return True, 0
        raise RateLimitUnavailable("Shared rate limiting is not configured.")

    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise RateLimitUnavailable("The shared rate-limit URL must use HTTPS.")

    key = _key(scope, identity)
    command = ["EVAL", SLIDING_WINDOW_LUA, 2, key, f"{key}:seq", window_seconds, limit]
    payload = await _send_upstash_command(url, token, command)
    result = payload.get("result")
    if not isinstance(result, list) or len(result) != 2:
        raise RateLimitUnavailable("The shared rate-limit service returned an invalid result.")
    try:
        allowed, retry_ms = int(result[0]), int(result[1])
    except (TypeError, ValueError) as exc:
        raise RateLimitUnavailable("The shared rate-limit service returned an invalid result.") from exc
    if allowed not in (0, 1):
        raise RateLimitUnavailable("The shared rate-limit service returned an invalid decision.")
    return allowed == 1, max(0, (retry_ms + 999) // 1000)
