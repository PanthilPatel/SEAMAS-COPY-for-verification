from tools.price_discrepancy import compare_records


def test_price_discrepancy_matches_source_url_and_reports_delta():
    rows = compare_records(
        [{"product_name": "Phone X", "price": 1099, "source_url": "https://www.shop.example/item/?sku=1"}],
        [{"product_name": "Phone X", "extracted_price": 999, "url": "https://shop.example/item?sku=1", "price_verified_at": "2026-09-29T00:00:00Z"}],
    )
    assert rows == [{
        "product": "Phone X", "ui_price": "1099", "source_price": "999",
        "difference": "100", "source_url": "https://shop.example/item?sku=1",
        "verification_timestamp": "2026-09-29T00:00:00Z",
    }]


def test_price_discrepancy_does_not_guess_on_missing_or_different_source():
    assert compare_records(
        [{"product_name": "Product", "price": 10, "url": "https://shop.example/a"}],
        [{"product_name": "Product", "price": 10, "url": "https://shop.example/b"}],
    ) == []
