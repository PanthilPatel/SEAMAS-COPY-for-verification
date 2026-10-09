import pytest
import asyncio
from typing import Dict, Any

from agents.budget_advisor_agent import budget_advisor_agent, parse_budget_intent, tag_product_budget
from agents.price_comparison_agent import clean_price, parse_snippet_pricing
from agents.review_analyzer_agent import review_analyzer_agent, _extract_rating_metrics, _deterministic_sentiment_synthesis
from agents.recommendation import recommendation_agent, _algorithmic_fallback
from agents.finalizer_agent import finalizer_agent, _build_markdown_report


# ==============================================================================
# 1. Budget Advisor Agent Tests
# ==============================================================================
def test_budget_parser_hard_limit():
    res1 = parse_budget_intent("best smartphone under ₹30,000")
    assert res1["ceiling"] == 30000
    assert res1["budget_type"] == "hard_limit"

    res2 = parse_budget_intent("gaming laptop below 80k")
    assert res2["ceiling"] == 80000
    assert res2["budget_type"] == "hard_limit"

    res3 = parse_budget_intent("laptop with max budget of 1.5 lakh")
    assert res3["ceiling"] == 150000
    assert res3["budget_type"] == "hard_limit"


def test_budget_parser_approximate():
    res = parse_budget_intent("phone around 25k")
    assert res["ceiling"] == 25000
    assert res["budget_type"] == "approximate"
    assert res["tolerance_pct"] == 0.08


def test_budget_parser_no_constraint():
    res = parse_budget_intent("iPhone 16 Pro Max 256GB")
    assert res["ceiling"] is None
    assert res["budget_type"] == "none"


def test_tag_product_budget():
    b_info = {"ceiling": 30000, "budget_type": "hard_limit", "tolerance_pct": 0.0}
    status1, var1 = tag_product_budget(24999, b_info)
    assert status1 == "Target Match"
    assert var1 == -5001

    status2, var2 = tag_product_budget(35000, b_info)
    assert status2 == "Out of Budget"
    assert var2 == 5000


@pytest.mark.asyncio
async def test_budget_advisor_agent_execution():
    state = {
        "query": "best smartphone under ₹30,000",
        "price_data": [
            {"product_name": "Phone A", "extracted_price": 28999, "marketplace": "Amazon"},
            {"product_name": "Phone B", "extracted_price": 34999, "marketplace": "Flipkart"},
        ]
    }
    res = await budget_advisor_agent(state)
    assert "budget_status" in res
    assert res["budget_status"]["ceiling"] == 30000
    assert "budget_evaluations" in res
    assert res["budget_evaluations"][0]["budget_tag"] == "Target Match"
    assert res["budget_evaluations"][1]["budget_tag"] == "Out of Budget"


@pytest.mark.asyncio
async def test_budget_evaluations_strict_ownership():
    """Validates that Budget Advisor outputs budget_evaluations and does NOT mutate price_data."""
    state = {
        "query": "phone under 25000",
        "price_data": [
            {"product_name": "Phone A", "extracted_price": 22000, "marketplace": "Amazon"},
            {"product_name": "Phone B", "extracted_price": 28000, "marketplace": "Flipkart"}
        ]
    }
    res = await budget_advisor_agent(state)
    assert "budget_evaluations" in res, "Must produce budget_evaluations"
    assert "budget_status" in res, "Must produce budget_status"
    assert "price_data" not in res, "Budget Advisor must NOT return or mutate price_data"

    evals = res["budget_evaluations"]
    assert len(evals) == 2
    assert evals[0]["status"] == "Target Match"
    assert evals[1]["status"] == "Out of Budget"



# ==============================================================================
# 3. Price Comparison Utilities Tests
# ==============================================================================
def test_clean_price():
    assert clean_price("₹24,999") == 24999
    assert clean_price("24999") == 24999
    assert clean_price("Rs. 1,44,900") == 144900
    assert clean_price("25k") == 25000
    assert clean_price(None) == 0


def test_parse_snippet_pricing():
    snippet = "Buy iPhone 15 at deal price: Rs. 65,999 (MRP: 79,900). Save up to 17% off."
    res = parse_snippet_pricing(snippet)
    assert res["current_price"] == 65999
    assert res["original_price"] == 79900


# ==============================================================================
# 4. Review Analyzer Agent Tests
# ==============================================================================
def test_rating_metrics_extraction():
    records = [
        {"title": "Great Product", "content": "Rated 4.5 out of 5 stars with 1,250 customer reviews."},
        {"title": "Storefront Listing", "content": "4.3★ based on 500 ratings."}
    ]
    metrics = _extract_rating_metrics(records)
    assert metrics["average_rating"] == 4.4
    assert metrics["total_reviews_estimate"] == 1250


@pytest.mark.asyncio
async def test_review_analyzer_fallback():
    state = {
        "query": "Sony WH-1000XM5",
        "search_results": [
            {"title": "Review", "content": "Excellent sound quality, superb ANC noise cancellation and good battery life."}
        ]
    }
    res = await review_analyzer_agent(state)
    assert "analysis_report" in res
    rep = res["analysis_report"]
    assert "summary" in rep
    assert "pros" in rep


# ==============================================================================
# 5. Recommendation Agent Tests
# ==============================================================================
def test_recommendation_algorithmic_fallback():
    price_data = [
        {"product_name": "Phone X", "marketplace": "Amazon", "extracted_price": 22999, "is_verified": True, "status": "Target Match"},
        {"product_name": "Phone X", "marketplace": "Flipkart", "extracted_price": 24999, "is_verified": True, "status": "Target Match"}
    ]
    budget_status = {"ceiling": 25000, "budget_type": "hard_limit", "status": "Under 25k"}
    analysis_report = {"summary": "Strong customer satisfaction.", "pros": ["Great battery"]}

    recs = _algorithmic_fallback(price_data, budget_status, analysis_report)
    assert len(recs) >= 2
    assert any("Top Value Pick" in r for r in recs)
    assert any("Amazon" in r for r in recs)


# ==============================================================================
# 5. Finalizer Agent Tests
# ==============================================================================
def test_build_markdown_report():
    report = _build_markdown_report(
        query="smartphones under 25000",
        budget_status={"status": "Locked at 25k"},
        analysis_report={"summary": "Positive feedback", "pros": ["Battery"]},
        recommendations=["Top deal: Phone on Amazon"],
        verified_prices=[{"marketplace": "Amazon", "product_name": "Test Phone", "extracted_price": 21999, "status": "Target Match"}],
        unverified_prices=[],
        unpriced=[],
        ai_verdict="Confirmed authentic deal with warranty support."
    )
    assert "# SEAMAS Product Evaluation Report" in report
    assert "Executive Buyer Verdict" in report
    assert "₹21,999" in report
