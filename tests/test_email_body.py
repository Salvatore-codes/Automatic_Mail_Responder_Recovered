"""Regression tests for the quotation reply email body (build_email_reply_body).

These lock in the behaviour we iterated on heavily:
  - PDF-only covering note (NO inline price table)
  - no red 'Unavailable Products' block (out-of-stock shown as a neutral line)
  - AI-Generated / Human-Generated flag in the email
  - correct grand-total math and return shape

Run:  .venv/bin/python -m pytest tests/test_email_body.py -q
"""
import pytest
from src.email_listener import build_email_reply_body

TCFG = {
    "business_name": "Trofeo Solution",
    "sales_executive_name": "Rajaram",
    "sales_executive_title": "Sales Executive",
    "sales_executive_phone": "+91 98765 43210",
    "sales_executive_email": "sales@trofeosolution.com",
}

RED_CODES = ("ef4444", "#991b1b", "#b91c1c", "#7f1d1d", "fecaca", "fef2f2")
TABLE_MARKERS = ("best available rates", "Item Description", "<table", "<th", "Total Payable")


def _build(lines, discount=0.0, origin="ai"):
    return build_email_reply_body(
        lines, discount, "Manoranjith", "QTN-00042",
        logo_cid="company_logo", tenant_config=TCFG,
        customer_email="manoranjith1123@gmail.com", origin=origin,
    )


IN_STOCK = [
    {"matched_sku_id": "BLADES-KNIFE-10", "matched_sku_name": "Utility Knife Spare Blades 10pc",
     "quantity": 10, "unit_price": 1.99, "deficit": 0},
]
OUT_OF_STOCK = [
    {"matched_sku_id": "BLADES-KNIFE-10", "matched_sku_name": "Utility Knife Spare Blades 10pc",
     "quantity": 5, "unit_price": 2.5, "deficit": 0},
    {"matched_sku_id": "BOX-TOOL-19", "matched_sku_name": "Plastic Tool Box 19 Inch",
     "quantity": 0, "unit_price": 12.0, "deficit": 10, "original_requested_qty": 10, "stock_avail": 0},
]


def test_return_shape():
    result = _build(IN_STOCK)
    (plain, html), grand_total = result
    assert isinstance(plain, str) and isinstance(html, str)
    assert isinstance(grand_total, float)


def test_no_inline_price_table():
    (plain, html), _ = _build(IN_STOCK)
    for marker in TABLE_MARKERS:
        assert marker not in html, f"inline-table marker leaked into email: {marker}"


def test_no_red_block_anywhere():
    (_, html), _ = _build(OUT_OF_STOCK)
    for code in RED_CODES:
        assert code not in html, f"red styling leaked into email: {code}"
    assert "Unavailable Products" not in html


def test_covering_note_points_to_pdf():
    (plain, html), _ = _build(IN_STOCK)
    assert "attached as a PDF" in plain
    assert "attached as a PDF" in html


def test_out_of_stock_neutral_note():
    (plain, html), _ = _build(OUT_OF_STOCK)
    assert "out of stock and are not included" in plain
    assert "Plastic Tool Box 19 Inch" in plain  # names the excluded item


def test_ai_flag_default():
    (plain, html), _ = _build(IN_STOCK, origin="ai")
    assert "AI-Generated Response" in plain
    assert "AI-Generated Response" in html


def test_human_flag_when_operator():
    (plain, html), _ = _build(IN_STOCK, origin="human")
    assert "Human-Generated Response" in plain
    assert "AI-Generated Response" not in html


def test_grand_total_math_with_discount():
    # 10 x 1.99 = 19.90 subtotal; 10% discount -> 17.91 net; +18% GST -> 21.1338
    (_, _), grand_total = _build(IN_STOCK, discount=0.10)
    assert round(grand_total, 2) == 21.13


def test_all_out_of_stock_has_no_quote_but_still_valid():
    only_oos = [OUT_OF_STOCK[1]]  # the deficit-only item
    (plain, html), grand_total = _build(only_oos)
    assert grand_total == 0.0
    assert "currently out of stock" in plain
    for marker in TABLE_MARKERS:
        assert marker not in html
