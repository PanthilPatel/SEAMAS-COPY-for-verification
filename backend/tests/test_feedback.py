from unittest.mock import MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_feedback_anonymous_successful():
    mock_db = MagicMock()
    with patch("app.main.supabase", mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/feedback", json={
                "query": "gaming laptop",
                "rating": "up",
                "reason": "Accurate Prices",
            })
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "message": "Feedback recorded. Thank you!"}
    mock_db.table.assert_called_once_with("recommendation_feedback")


@pytest.mark.asyncio
async def test_feedback_rejects_invalid_rating():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/feedback", json={
            "query": "gaming laptop",
            "rating": "maybe",
            "reason": "Not sure",
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_feedback_authenticated_user_id_attached(authenticated_user):
    from app.main import optional_current_user
    mock_db = MagicMock()
    app.dependency_overrides[optional_current_user] = lambda: authenticated_user
    try:
        with patch("app.main.supabase", mock_db):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                res = await client.post(
                    "/api/feedback",
                    json={
                        "query": "sony headphones",
                        "rating": "down",
                        "reason": "Price Mismatch",
                    },
                    headers={"Authorization": "Bearer fake-token"}
                )
    finally:
        app.dependency_overrides.pop(optional_current_user, None)

    assert res.status_code == 200
    mock_db.table.return_value.insert.assert_called_once_with({
        "user_id": authenticated_user["id"],
        "query": "sony headphones",
        "rating": "down",
        "reason": "Price Mismatch",
    })
