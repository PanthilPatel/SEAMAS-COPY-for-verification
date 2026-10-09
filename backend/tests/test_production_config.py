import pytest

from core.config import settings, validate_production_config


@pytest.fixture
def valid_production_settings(monkeypatch):
    values = {
        "ENVIRONMENT": "production",
        "ALLOWED_ORIGINS": "https://app.seamas.ai",
        "FRONTEND_BASE_URL": "https://app.seamas.ai",
        "BACKEND_BASE_URL": "https://api.seamas.ai",
        "SUPABASE_URL": "https://seamas-prod.supabase.co",
        "SUPABASE_ANON_KEY": "public-key-value",
        "SUPABASE_SERVICE_ROLE_KEY": "server-only-key-value",
        "RAZORPAY_KEY_ID": "rzp_live_example",
        "RAZORPAY_KEY_SECRET": "razorpay-secret-value",
        "UPSTASH_REDIS_REST_URL": "https://seamas-prod.upstash.io",
        "UPSTASH_REDIS_REST_TOKEN": "upstash-token-value",
        "RATE_LIMIT_KEY_SECRET": "s" * 40,
        "SEARXNG_BASE_URL": "https://search.seamas.ai",
        "OLLAMA_HOST": "",
    }
    for key, value in values.items():
        monkeypatch.setattr(settings, key, value)


def test_valid_explicit_https_production_config_passes(valid_production_settings):
    validate_production_config()


@pytest.mark.parametrize("field,value", [
    ("ALLOWED_ORIGINS", "*"),
    ("ALLOWED_ORIGINS", "http://app.seamas.ai"),
    ("FRONTEND_BASE_URL", "http://app.seamas.ai"),
    ("BACKEND_BASE_URL", "http://localhost:8000"),
    ("SUPABASE_URL", "https://your-project.supabase.co"),
    ("UPSTASH_REDIS_REST_URL", "http://redis.example.net"),
    ("RATE_LIMIT_KEY_SECRET", "weak"),
    ("RAZORPAY_KEY_ID", "rzp_test_replace_me"),
])
def test_unsafe_production_configuration_fails(valid_production_settings, monkeypatch, field, value):
    monkeypatch.setattr(settings, field, value)
    with pytest.raises(RuntimeError) as exc:
        validate_production_config()
    assert "Invalid production configuration" in str(exc.value)
    assert "secret-value" not in str(exc.value)
