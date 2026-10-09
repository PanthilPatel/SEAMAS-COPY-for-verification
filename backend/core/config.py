import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SEAMAS Multi-Agent Backend"
    VERSION: str = "1.0.0"

    # Search configuration
    SEARXNG_BASE_URL: str = os.getenv("SEARXNG_BASE_URL", "https://seamas-searxng.onrender.com")
    SEARXNG_TIMEOUT: float = float(os.getenv("SEARXNG_TIMEOUT", "5.0"))
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    MAX_SEARCH_PAGES: int = int(os.getenv("MAX_SEARCH_PAGES", "2"))

    # LLM / Ollama configuration
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", os.getenv("OLLAMA_BASE_URL", ""))
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")

    # Database / Cache
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Payments (authoritative configuration source)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    # Orchestration Mode: "graph" (LangGraph is single source of truth)
    AGENT_MODE: str = os.getenv("AGENT_MODE", "graph")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    UPSTASH_REDIS_REST_URL: str = os.getenv("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
    RATE_LIMIT_KEY_SECRET: str = os.getenv("RATE_LIMIT_KEY_SECRET", "")

settings = Settings()

def validate_production_config() -> None:
    """Fail fast for unsafe or incomplete production deployment settings."""
    if settings.ENVIRONMENT.lower() != "production":
        return
    from urllib.parse import urlparse

    errors = []
    origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
    if not origins or "*" in origins:
        errors.append("ALLOWED_ORIGINS must contain explicit production origins")
    for origin in origins:
        parsed = urlparse(origin)
        hostname = parsed.hostname or ""
        if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
            errors.append("ALLOWED_ORIGINS entries must be HTTPS origins without paths")
            break
        if (hostname in {"localhost", "127.0.0.1", "::1"}
                or hostname.endswith((".example.com", ".example"))
                or "your-" in hostname or "placeholder" in hostname or "replace-" in hostname):
            errors.append("ALLOWED_ORIGINS cannot use local or placeholder hosts")
            break
    for name in ("FRONTEND_BASE_URL", "BACKEND_BASE_URL", "SUPABASE_URL", "SEARXNG_BASE_URL", "UPSTASH_REDIS_REST_URL"):
        value = getattr(settings, name).strip()
        parsed = urlparse(value)
        if (parsed.scheme != "https" or not parsed.hostname
                or parsed.hostname in {"localhost", "127.0.0.1", "::1"}
                or parsed.hostname.endswith((".example.com", ".example"))
                or "your-" in parsed.hostname or "placeholder" in parsed.hostname or "replace-" in parsed.hostname):
            errors.append(f"{name} must be an explicit HTTPS production URL")
    if settings.OLLAMA_HOST:
        parsed_ollama = urlparse(settings.OLLAMA_HOST)
        if parsed_ollama.scheme != "https" or not parsed_ollama.hostname or parsed_ollama.hostname in {"localhost", "127.0.0.1", "::1"}:
            errors.append("OLLAMA_HOST must be an HTTPS remote URL when configured in production")
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY or not settings.SUPABASE_SERVICE_ROLE_KEY:
        errors.append("Supabase URL, anon key, and service role key are required")
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        errors.append("Razorpay credentials are required")
    if settings.RAZORPAY_KEY_ID.startswith("rzp_test_"):
        errors.append("Razorpay test credentials cannot be used in production")
    if any(value.strip().lower().startswith(("replace", "your-", "placeholder")) for value in (
        settings.SUPABASE_ANON_KEY, settings.SUPABASE_SERVICE_ROLE_KEY,
        settings.RAZORPAY_KEY_SECRET, settings.UPSTASH_REDIS_REST_TOKEN,
    )):
        errors.append("Production credentials must replace all example placeholders")
    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        errors.append("Upstash Redis REST URL and token are required for shared rate limiting")
    parsed_redis = urlparse(settings.UPSTASH_REDIS_REST_URL)
    if settings.UPSTASH_REDIS_REST_URL and (parsed_redis.scheme != "https" or not parsed_redis.hostname):
        errors.append("UPSTASH_REDIS_REST_URL must use HTTPS")
    if len(settings.RATE_LIMIT_KEY_SECRET) < 32:
        errors.append("RATE_LIMIT_KEY_SECRET must contain at least 32 characters")
    if errors:
        raise RuntimeError("Invalid production configuration: " + "; ".join(errors))

# Cached resolved model to avoid repeated discovery calls
_RESOLVED_OLLAMA_MODEL = None
_OLLAMA_CHECKED = False

def resolve_ollama_model() -> str | None:
    """
    Deterministically resolves an available Qwen model for Ollama in order:
    1. Explicit OLLAMA_MODEL setting (if present in installed models).
    2. Any installed compatible Qwen model from predefined candidates in priority order.
    3. Returns None if Ollama is unreachable or no compatible model is found,
       signaling agents to use deterministic non-LLM algorithmic fallbacks.
    """
    global _RESOLVED_OLLAMA_MODEL, _OLLAMA_CHECKED
    if _OLLAMA_CHECKED:
        return _RESOLVED_OLLAMA_MODEL

    _OLLAMA_CHECKED = True
    try:
        import ollama
        client = ollama.Client(host=settings.OLLAMA_HOST)
        models_resp = client.list()
        installed_models = []
        if hasattr(models_resp, "models"):
            for m in models_resp.models:
                m_name = getattr(m, "model", None) or getattr(m, "name", "")
                if m_name:
                    installed_models.append(m_name)
        elif isinstance(models_resp, dict) and "models" in models_resp:
            installed_models = [m.get("model", m.get("name", "")) for m in models_resp["models"]]

        # 1. Check explicit setting
        configured = settings.OLLAMA_MODEL.strip()
        if configured:
            # Check exact or prefix match (e.g. qwen2.5:0.5b vs qwen2.5:0.5b-chat)
            for inst in installed_models:
                if inst == configured or inst.startswith(configured):
                    _RESOLVED_OLLAMA_MODEL = configured
                    return _RESOLVED_OLLAMA_MODEL

        # 2. Check installed candidates in deterministic priority order (fastest/smallest first)
        candidates = [
            "qwen2.5:0.5b",
            "qwen2.5:1.5b",
            "qwen2.5:3b",
            "qwen2.5:7b",
            "qwen2.5:latest",
            "qwen2.5-coder:7b",
        ]
        for cand in candidates:
            for inst in installed_models:
                if inst == cand or inst.startswith(cand.split(":")[0]):
                    _RESOLVED_OLLAMA_MODEL = inst
                    return _RESOLVED_OLLAMA_MODEL

        # If configured is non-empty, test if Ollama can run it anyway
        if configured and installed_models:
            _RESOLVED_OLLAMA_MODEL = configured
            return _RESOLVED_OLLAMA_MODEL

    except Exception:
        # Ollama offline, uninstalled, or connection timed out
        pass

    _RESOLVED_OLLAMA_MODEL = None
    return None
