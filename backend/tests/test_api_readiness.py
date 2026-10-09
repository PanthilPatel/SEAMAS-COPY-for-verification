from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.main import ready


@pytest.mark.asyncio
async def test_readiness_requires_complete_schema_capability_rpc():
    db = MagicMock()
    db.rpc.return_value.execute.return_value.data = True
    with patch("app.main.supabase", db):
        assert await ready() == {"status": "ready"}
    db.rpc.assert_called_once_with("seamas_schema_is_ready", {})


@pytest.mark.asyncio
async def test_readiness_fails_when_capability_rpc_reports_missing_schema():
    db = MagicMock()
    db.rpc.return_value.execute.return_value.data = False
    with patch("app.main.supabase", db), pytest.raises(HTTPException) as exc:
        await ready()
    assert exc.value.status_code == 503


@pytest.mark.asyncio
async def test_readiness_fails_when_rpc_is_missing_or_unavailable():
    db = MagicMock()
    db.rpc.side_effect = RuntimeError("missing function")
    with patch("app.main.supabase", db), pytest.raises(HTTPException) as exc:
        await ready()
    assert exc.value.status_code == 503
