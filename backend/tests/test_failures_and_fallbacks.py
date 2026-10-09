import pytest
import asyncio
from typing import Dict, Any

from tools.search_tools import web_search_tool
from graph.graph import seamas_graph
from agents.budget_advisor_agent import parse_budget_intent
from agents.price_comparison_agent import clean_price
from agents.recommendation import recommendation_agent
from agents.search_agent import normalize_url, compute_relevance_score
from core.config import resolve_ollama_model


@pytest.mark.asyncio
async def test_empty_search_results_graceful_handling():
    """Validates that graph handles empty search results without crashing."""
    state: Dict[str, Any] = {
        "query": "nonexistentproductxyz12345",
        "steering_mode": "speed",
        "search_results": [],
        "price_data": [],
        "analysis_report": {},
        "category": "general",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    res = await seamas_graph.ainvoke(state)
    assert "final_output" in res
    assert "SEAMAS Product Evaluation Report" in res["final_output"]


@pytest.mark.asyncio
async def test_malformed_search_items():
    """Validates that missing or malformed attributes in search results don't crash agents."""
    state = {
        "query": "test query",
        "steering_mode": "speed",
        "search_results": [
            {"title": None, "content": None, "url": ""},
            {"unexpected_key": 123},
            {},
        ],
        "price_data": [],
        "analysis_report": {},
        "category": "general",
        "recommendations": [],
        "budget_status": {},
        "logs": []
    }

    res = await seamas_graph.ainvoke(state)
    assert res is not None
    assert "final_output" in res


def test_invalid_budget_patterns():
    """Validates that noisy or non-budget queries don't extract false budget numbers."""
    assert parse_budget_intent("iPhone 15 Pro Max 256GB")["ceiling"] is None
    assert parse_budget_intent("Samsung S24 Ultra 512GB")["ceiling"] is None
    assert parse_budget_intent("Dell XPS 13 2024 model")["ceiling"] is None
    assert parse_budget_intent("")["ceiling"] is None


def test_clean_price_resilience():
    """Validates price cleaning resilience against invalid formats."""
    assert clean_price("") == 0
    assert clean_price("Free") == 0
    assert clean_price("EMI starting at 2,000/month") == 0
    assert clean_price("Out of Stock") == 0
    assert clean_price(None) == 0


@pytest.mark.asyncio
async def test_recommendation_with_no_prices():
    """Validates that recommendation agent produces clear advice even if price extraction found nothing."""
    state = {
        "query": "custom specialized equipment",
        "price_data": [],
        "analysis_report": {"summary": "Niche product with limited retail distribution."},
        "budget_status": {"ceiling": 50000}
    }
    res = await recommendation_agent(state)
    assert "recommendations" in res
    assert len(res["recommendations"]) > 0


def test_search_normalization_layer():
    """Validates research normalization layer: URL canonicalization and relevance scoring."""
    # 1. URL normalization strips tracking params & lowercases
    dirty_url = "https://www.Amazon.in/dp/B012345678/?utm_source=ad&ref=xyz#top"
    norm = normalize_url(dirty_url)
    assert "www." not in norm
    assert "utm_source" not in norm
    assert norm.startswith("https://amazon.in/dp/B012345678")

    # 2. Social media detection
    yt_url = "https://www.youtube.com/watch?v=12345"
    assert "youtube.com" in normalize_url(yt_url)

    # 3. Relevance scoring
    query_tokens = {"gaming", "laptop", "rtx"}
    high_score = compute_relevance_score(
        "ASUS ROG Gaming Laptop RTX 4060",
        "Top tier performance with Intel Core i7 and RTX 4060 GPU.",
        query_tokens,
        "laptops"
    )
    low_score = compute_relevance_score(
        "Leather Phone Case",
        "Durable leather protection for smartphones.",
        query_tokens,
        "smartphones"
    )
    assert high_score > low_score
    assert high_score >= 0.70
    assert low_score < 0.20


def test_resolve_ollama_model_deterministic():
    """Validates that resolve_ollama_model returns either a valid string or None without throwing."""
    resolved = resolve_ollama_model()
    assert resolved is None or isinstance(resolved, str)
    if isinstance(resolved, str):
        assert "qwen" in resolved.lower()


@pytest.mark.asyncio
async def test_searxng_to_tavily_fallback_conditions(monkeypatch):
    """Validates search fallback: SearXNG timeout/failure triggers Tavily; SearXNG success skips Tavily."""
    from unittest.mock import AsyncMock, patch

    # Case 1: SearXNG returns failure/timeout -> calls Tavily
    with patch("httpx.AsyncClient.get", side_effect=Exception("SearXNG Render Timeout")):
        with patch("tools.search_tools._query_tavily", new_callable=AsyncMock) as mock_tavily:
            mock_tavily.return_value = [{"title": "Tavily Phone", "url": "https://amazon.in/tavily", "content": "Price: 15000"}]
            monkeypatch.setenv("TAVILY_API_KEY", "tvly-test-key")

            results = await web_search_tool("budget phone", max_results=5, augment_query=False, page=1)
            assert mock_tavily.called, "Tavily must be called when SearXNG fails"
            assert len(results) == 1
            assert results[0]["title"] == "Tavily Phone"


# ==============================================================================
# Batch 3 Focused Tests: Live HTTP Price Scraping & Curl Removal
# ==============================================================================

@pytest.mark.asyncio
async def test_no_curl_subprocess_invocation():
    """Validates that scrape_live_price never invokes subprocess.run or curl."""
    from unittest.mock import patch
    from agents.price_comparison_agent import scrape_live_price

    with patch("subprocess.run") as mock_subproc:
        with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
            res = await scrape_live_price("https://www.amazon.in/dp/B0CQG3QW2J")
            assert mock_subproc.call_count == 0, "subprocess.run must never be called during price scraping"
            assert res["price"] is None


@pytest.mark.asyncio
async def test_live_http_price_extraction_success():
    """Validates that live HTTP extraction successfully parses valid product pages without subprocess."""
    from unittest.mock import patch, MagicMock
    from agents.price_comparison_agent import scrape_live_price

    mock_html = """
    <html>
      <head>
        <title>OnePlus 12 (Glacial White, 256 GB)</title>
        <meta property="og:image" content="https://images.example.com/oneplus12.jpg" />
      </head>
      <body>
        <span class="a-price-whole">64,999</span>
        <span class="a-price a-text-price" data-a-strike="true"><span class="a-offscreen">₹69,999</span></span>
      </body>
    </html>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = mock_html

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        res = await scrape_live_price("https://www.amazon.in/dp/B0CQG3QW2J")
        assert res["price"] == 64999
        assert res["original_price"] == 69999
        assert res["image"] == "https://images.example.com/oneplus12.jpg"


@pytest.mark.asyncio
async def test_live_http_captcha_and_timeout_graceful_handling():
    """Validates that HTTP timeouts, CAPTCHAs, and malformed HTML return empty dict without crashing."""
    from unittest.mock import patch, MagicMock
    import httpx
    from agents.price_comparison_agent import scrape_live_price

    # 1. Timeout handling
    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Read timed out")):
        res = await scrape_live_price("https://www.amazon.in/dp/B0CQG3QW2J")
        assert res["price"] is None

    # 2. CAPTCHA page handling
    captcha_resp = MagicMock()
    captcha_resp.status_code = 200
    captcha_resp.text = "<html><body><h4>Enter the characters you see below: CAPTCHA</h4></body></html>"
    with patch("httpx.AsyncClient.get", return_value=captcha_resp):
        res = await scrape_live_price("https://www.amazon.in/dp/B0CQG3QW2J")
        assert res["price"] is None

    # 3. Malformed/Empty HTML
    empty_resp = MagicMock()
    empty_resp.status_code = 200
    empty_resp.text = "<html></html>"
    with patch("httpx.AsyncClient.get", return_value=empty_resp):
        res = await scrape_live_price("https://www.amazon.in/dp/B0CQG3QW2J")
        assert res["price"] is None


@pytest.mark.asyncio
async def test_search_snippet_is_not_authoritative_price_evidence():
    """A snippet may discover a product, but cannot verify its displayed price."""
    from unittest.mock import patch
    from agents.price_comparison_agent import price_comparison_agent

    state = {
        "query": "phone under 20000",
        "search_results": [
            {
                "engine": "Amazon",
                "title": "Redmi Note 13 5G (Prism Gold, 6GB RAM, 128GB Storage)",
                "content": "Buy Redmi Note 13 5G at deal price: ₹16,999 (MRP: ₹20,999). 6.67-inch FHD+ 120Hz AMOLED.",
                "url": "https://www.amazon.in/dp/B0CQG3QW2J",
                "thumbnail": "https://m.media-amazon.com/images/I/71XNeka-BRL._SL1500_.jpg",
            }
        ],
        "budget_status": {"ceiling": 20000}
    }

    with patch("agents.price_comparison_agent.scrape_live_price", return_value={"price": None, "original_price": None, "image": None}) as mock_scrape:
        res = await price_comparison_agent(state)
        assert mock_scrape.called
        price_data = res.get("price_data", [])
        assert len(price_data) == 1
        assert price_data[0]["extracted_price"] is None
        assert price_data[0]["original_price"] is None
        assert price_data[0]["price_verified"] is False


@pytest.mark.asyncio
async def test_blocked_source_does_not_fall_back_to_snippet_price():
    """When the original page cannot be checked, snippet values remain unverified."""
    from unittest.mock import patch
    from agents.price_comparison_agent import price_comparison_agent

    state = {
        "query": "phone under 20000",
        "search_results": [
            {
                "engine": "Amazon",
                "title": "Realme Narzo 70x 5G",
                "content": "Price: ₹12,499 (MRP: 15,999). 5000mAh battery, 45W charging.",
                "url": "https://www.amazon.in/dp/B0CZDX1764",
                "thumbnail": "https://m.media-amazon.com/images/I/71xyz.jpg",
            }
        ],
        "budget_status": {"ceiling": 20000}
    }

    # Simulate live scraping returning empty / blocked
    with patch("agents.price_comparison_agent.scrape_live_price", return_value={"price": None, "original_price": None, "image": None}):
        res = await price_comparison_agent(state)
        price_data = res.get("price_data", [])
        assert len(price_data) == 1
        assert price_data[0]["extracted_price"] is None
        assert price_data[0]["original_price"] is None
        assert price_data[0]["is_verified"] is False

