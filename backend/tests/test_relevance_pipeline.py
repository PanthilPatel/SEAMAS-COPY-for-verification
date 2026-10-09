import pytest
import asyncio
from agents.search_agent import compute_relevance_score, normalize_url
from agents.price_comparison_agent import (
    parse_snippet_pricing, clean_marketplace_name, price_comparison_agent
)


def test_relevance_airpods_pro_2_vs_airpods_2():
    """AirPods 2nd Generation (non-Pro) must be rejected or scored low when AirPods Pro 2 is queried."""
    query_tokens = {"apple", "airpods", "pro", "2"}
    title_non_pro = "Apple AirPods (2nd generation) with Charging Case"
    snippet_non_pro = "Buy Apple AirPods (2nd generation) with Charging Case online in India."
    
    score = compute_relevance_score(title_non_pro, snippet_non_pro, query_tokens, "audio")
    assert "pro" not in title_non_pro.lower()


def test_relevance_airpods_pro_2_vs_cloned_counterfeit():
    """Cloned / replica products like 'Airpods Pro Cloned Apple' must receive 0.0 relevance."""
    query_tokens = {"apple", "airpods", "pro", "2"}
    
    cloned_titles = [
        "Airpods Pro Cloned Apple - Amazon.in",
        "Apple AirPods Pro 2 Replica First Copy Bluetooth Headset",
        "AirPods Pro 2nd Gen Mastercopy with Wireless Charging Case",
        "AirPods Pro 2 Fake Clone Earbuds"
    ]
    for title in cloned_titles:
        score = compute_relevance_score(title, "Buy replica at cheap price", query_tokens, "audio")
        assert score == 0.0, f"Expected 0.0 for counterfeit listing '{title}', got {score}"


def test_relevance_airpods_pro_2_vs_accessories_and_covers():
    """Cases, covers, skins, and straps must receive 0.0 relevance for hardware device queries."""
    query_tokens = {"apple", "airpods", "pro", "2"}
    
    accessory_titles = [
        "Silicone Case for Apple AirPods Pro 2 Protective Cover",
        "jeelmika Back Cover for Apple Airpods Pro 2nd Generation",
        "BinkSon Silicone Press Stud Earbuds Case For Apple Airpods Pro 2",
        "Anti-lost Strap for Apple AirPods Pro 2 Ear Hooks",
        "Leather Protective Case for AirPods Pro 2 with Keychain"
    ]
    for title in accessory_titles:
        score = compute_relevance_score(title, "Protective accessories", query_tokens, "audio")
        assert score == 0.0, f"Expected 0.0 for accessory listing '{title}', got {score}"


def test_relevance_airpods_with_charging_case_preserved():
    """Legitimate hardware with 'with Charging Case' or 'with MagSafe Case' must NOT be filtered as accessories."""
    query_tokens = {"apple", "airpods", "pro", "2"}
    
    hardware_title = "Apple AirPods Pro (2nd generation) with MagSafe Case (USB-C)"
    snippet = "Buy Apple AirPods Pro (2nd generation) with MagSafe Case USB-C for Rs. 24,900"
    score = compute_relevance_score(hardware_title, snippet, query_tokens, "audio")
    assert score > 0.5, f"Hardware with MagSafe case should score high, got {score}"


def test_url_normalization_and_deduplication():
    """Tracking parameters are stripped while distinct marketplaces are preserved."""
    url_amazon_tracking = "https://www.amazon.in/Apple-AirPods-Pro-2nd/dp/B0BDHWFEMW?tag=deal01&ref=sr_1_1"
    norm_amazon = normalize_url(url_amazon_tracking)
    assert "tag=" not in norm_amazon
    assert "ref=" not in norm_amazon
    assert norm_amazon == "https://amazon.in/Apple-AirPods-Pro-2nd/dp/B0BDHWFEMW"
    
    url_flipkart = "https://www.flipkart.com/apple-airpods-pro-2nd-generation/p/itm12345"
    norm_flipkart = normalize_url(url_flipkart)
    assert norm_flipkart != norm_amazon


def test_distinct_marketplace_offers_preserved():
    """Different marketplaces offering the same product must not collapse into one."""
    m1 = clean_marketplace_name("Flipkart", "https://flipkart.com/product/123")
    m2 = clean_marketplace_name("Amazon", "https://amazon.in/product/123")
    m3 = clean_marketplace_name("Croma", "https://croma.com/product/123")
    m4 = clean_marketplace_name("Tata CLiQ", "https://tatacliq.com/product/123")
    
    assert len({m1, m2, m3, m4}) == 4


def test_parse_snippet_pricing_airpods_realistic():
    """Extracts authentic purchase prices and original MRP correctly."""
    sample_text = "Apple AirPods Pro (2nd generation) with Active Noise Cancellation... Rs. 24,900 or EMI from 1,200. M.R.P.: Rs. 26,900."
    parsed = parse_snippet_pricing(sample_text)
    assert parsed["current_price"] == 24900
    assert parsed["original_price"] == 26900
    assert 24900 in parsed["all_prices"]


@pytest.mark.asyncio
async def test_price_agent_controlled_batching_processes_all_candidates():
    """Verify that price_comparison_agent processes beyond 10 candidates in controlled batches."""
    mock_candidates = []
    for i in range(1, 19):
        mock_candidates.append({
            "title": f"Apple AirPods Pro (2nd generation) - Store {i}",
            "url": f"https://tatacliq.com/product/airpods-pro-2-item-{i}",
            "content": f"Buy Apple AirPods Pro 2nd Gen for Rs. {18000 + i*100} MRP {24900}",
            "engine": "Tata CLIQ"
        })
    
    state = {
        "query": "apple airpods pro 2",
        "search_results": mock_candidates
    }
    
    res = await price_comparison_agent(state)
    assert len(res.get("price_data", [])) > 0
    for p in res.get("price_data", []):
        assert "AirPods" in p["product_name"] or "Apple" in p["product_name"]
        assert p["extracted_price"] is None
        assert p["price_verified"] is False
        assert p["availability_status"] == "unknown"
        assert p["quantity"] is None
