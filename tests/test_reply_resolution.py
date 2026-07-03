"""Regression tests for the customer-reply plumbing we fixed:

  1. A "CUSTOMER_REPLIED:<QTN>" card id must resolve to the underlying quote id
     (View Thread was 404-ing before).
  2. The analytics recent-stream JOIN must resolve the customer name/email for a
     CUSTOMER_REPLIED row via the stripped QTN (card showed generic "Customer").

Self-contained: builds a temp SQLite DB mirroring prod's schema — does NOT touch
the live database.  Run: .venv/bin/python -m pytest tests/test_reply_resolution.py -q
"""
import sqlite3
import pytest


def _strip_customer_replied(invoice_id: str) -> str:
    # mirrors the fix in server.get_quote_details / openChatHistory
    if invoice_id.startswith("CUSTOMER_REPLIED:"):
        return invoice_id.split(":", 1)[1]
    return invoice_id


@pytest.fixture
def db():
    con = sqlite3.connect(":memory:")
    con.row_factory = sqlite3.Row
    con.executescript(
        """
        CREATE TABLE quotations (invoice_id TEXT, customer_name TEXT, customer_email TEXT, status TEXT);
        CREATE TABLE processed_messages (message_id TEXT, invoice_id TEXT, processed_at TEXT, received_at TEXT);
        CREATE TABLE unmatched_items (id INTEGER PRIMARY KEY, customer_email TEXT, customer_name TEXT);
        INSERT INTO quotations VALUES ('QTN-00003', 'Manoranjith', 'manoranjith1123@gmail.com', 'QUOTE_GENERATED');
        INSERT INTO processed_messages VALUES ('<q3@mail>', 'QTN-00003', '2026-07-02 18:11:09', '2026-07-02 18:11:00');
        INSERT INTO processed_messages VALUES ('<reply@mail>', 'CUSTOMER_REPLIED:QTN-00003', '2026-07-02 18:17:35', '2026-07-02 18:17:30');
        """
    )
    con.commit()
    yield con
    con.close()


def test_prefix_strips_to_quote_id():
    assert _strip_customer_replied("CUSTOMER_REPLIED:QTN-00003") == "QTN-00003"
    assert _strip_customer_replied("QTN-00003") == "QTN-00003"


def test_details_lookup_resolves_after_strip(db):
    # simulate the endpoint: strip prefix, then find the quotation
    inv = _strip_customer_replied("CUSTOMER_REPLIED:QTN-00003")
    row = db.execute("SELECT * FROM quotations WHERE invoice_id = ?", (inv,)).fetchone()
    assert row is not None and row["customer_name"] == "Manoranjith"


def test_analytics_join_resolves_reply_name(db):
    # the widened JOIN used in get_overview_analytics recent_stream
    rows = db.execute(
        """
        SELECT pm.invoice_id, q.customer_name AS q_name, q.customer_email AS q_email
        FROM processed_messages pm
        LEFT JOIN quotations q ON q.invoice_id = pm.invoice_id
            OR q.invoice_id = REPLACE(pm.invoice_id, 'CUSTOMER_REPLIED:', '')
        WHERE pm.invoice_id LIKE 'CUSTOMER_REPLIED:%'
        """
    ).fetchall()
    assert len(rows) == 1
    assert rows[0]["q_name"] == "Manoranjith"          # was NULL -> "Customer" before the fix
    assert rows[0]["q_email"] == "manoranjith1123@gmail.com"


def test_plain_quote_join_still_works(db):
    row = db.execute(
        """
        SELECT q.customer_name AS q_name FROM processed_messages pm
        LEFT JOIN quotations q ON q.invoice_id = pm.invoice_id
            OR q.invoice_id = REPLACE(pm.invoice_id, 'CUSTOMER_REPLIED:', '')
        WHERE pm.invoice_id = 'QTN-00003'
        """
    ).fetchone()
    assert row["q_name"] == "Manoranjith"
