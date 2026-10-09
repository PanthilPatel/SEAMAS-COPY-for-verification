import pytest
from typing import Dict, Any

from agents.budget_advisor_agent import parse_budget_intent
from agents.orchestrator import extract_intent_and_constraints


@pytest.mark.parametrize("query,expected_ceiling,expected_type,expected_category", [
    ("best smartphone under ₹30000", 30000, "hard_limit", "smartphones"),
    ("best laptop under ₹80000", 80000, "hard_limit", "laptops"),
    ("iPhone 17 Pro Max", None, "none", "smartphones"),
    ("best gaming laptop under ₹100000", 100000, "hard_limit", "laptops"),
    ("best phone for camera under ₹50000", 50000, "hard_limit", "smartphones"),
    ("wireless earbuds around 5k", 5000, "approximate", "audio"),
])
def test_realistic_query_parsing(query: str, expected_ceiling: Any, expected_type: str, expected_category: str):
    b_info = parse_budget_intent(query)
    assert b_info["ceiling"] == expected_ceiling
    assert b_info["budget_type"] == expected_type

    cat = extract_intent_and_constraints(query)["category"]
    assert cat == expected_category
