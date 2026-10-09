"""Compare captured UI product data with captured source-page product data."""
import argparse
import csv
import json
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def _url_key(value: str) -> str:
    parts = urlsplit((value or "").strip())
    host = (parts.hostname or "").lower().removeprefix("www.")
    return urlunsplit((parts.scheme.lower(), host, parts.path.rstrip("/"), parts.query, ""))


def _price(record: dict):
    raw = record.get("price", record.get("extracted_price"))
    if raw is None:
        return None
    try:
        value = Decimal(str(raw))
    except InvalidOperation as exc:
        raise ValueError(f"Invalid price value: {raw!r}") from exc
    return value if value.is_finite() else None


def compare_records(displayed: list[dict], source: list[dict]) -> list[dict]:
    """Match records by exact source URL and report only supplied values."""
    source_by_url = {}
    for record in source:
        key = _url_key(record.get("source_url") or record.get("url") or "")
        if key:
            source_by_url[key] = record

    output = []
    for item in displayed:
        url = item.get("source_url") or item.get("url") or ""
        original = source_by_url.get(_url_key(url))
        if not original:
            continue
        ui_price = _price(item)
        source_price = _price(original)
        output.append({
            "product": item.get("product_name") or item.get("title") or original.get("product_name") or "",
            "ui_price": str(ui_price) if ui_price is not None else "",
            "source_price": str(source_price) if source_price is not None else "",
            "difference": str(ui_price - source_price) if ui_price is not None and source_price is not None else "",
            "source_url": original.get("source_url") or original.get("url") or url,
            "verification_timestamp": original.get("price_verified_at") or original.get("verification_timestamp") or "",
        })
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("displayed_json", type=Path, help="JSON array of captured UI product records")
    parser.add_argument("source_json", type=Path, help="JSON array of captured source product records")
    args = parser.parse_args()
    displayed = json.loads(args.displayed_json.read_text(encoding="utf-8"))
    source = json.loads(args.source_json.read_text(encoding="utf-8"))
    if not isinstance(displayed, list) or not isinstance(source, list):
        parser.error("Both inputs must be JSON arrays.")
    rows = compare_records(displayed, source)
    writer = csv.DictWriter(
        sys.stdout,
        fieldnames=["product", "ui_price", "source_price", "difference", "source_url", "verification_timestamp"],
    )
    writer.writeheader()
    writer.writerows(rows)


if __name__ == "__main__":
    main()
