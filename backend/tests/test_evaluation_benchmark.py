import pytest
from tools.evaluation_benchmark import run_evaluation_benchmark


@pytest.mark.asyncio
async def test_evaluation_benchmark_suite():
    summary = await run_evaluation_benchmark()
    assert summary["total_cases"] == 40
    assert summary["category_accuracy"] >= 90.0
    assert summary["budget_extraction_accuracy"] >= 95.0
    assert summary["price_verification_integrity_rate"] == 100.0
