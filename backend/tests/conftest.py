import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Test collection must never inherit the developer's configured Supabase
# project. Integration tests must inject an explicit disposable QA client.
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_ANON_KEY"] = ""
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = ""

import pytest
import app.main as main_module
from app.main import app, current_user
from utils import credits_db, supabase_client


@pytest.fixture(autouse=True)
def block_external_supabase(monkeypatch):
    """Prevent accidental database calls from ordinary local tests."""
    monkeypatch.setattr(main_module, "supabase", None)
    monkeypatch.setattr(credits_db, "supabase", None)
    monkeypatch.setattr(supabase_client, "supabase", None)

@pytest.fixture
def authenticated_user():
    """Test-only identity injection; handlers still consume the auth dependency."""
    identity = {"id": "00000000-0000-0000-0000-000000000123", "email": "test@example.com"}
    app.dependency_overrides[current_user] = lambda: identity
    yield identity
    app.dependency_overrides.pop(current_user, None)
