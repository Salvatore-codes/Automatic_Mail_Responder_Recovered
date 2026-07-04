"""Integration and unit tests for settings, manual reply routing, and analytics.

Locks in features like settings endpoints, conversion funnel metrics, customer timeline audits,
and draft-bot hold behavior.
"""
import os
import pytest
import sqlite3
from fastapi.testclient import TestClient
from unittest import mock

from src.server import app
from src.database_sqlite import get_setting, set_setting, get_connection, init_db

TEST_TENANT = "test_settings_workflow"

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Force initialize the test settings db
    init_db(TEST_TENANT)
    yield
    # Clean up test database file after tests finish
    from src.database_sqlite import DB_DIR
    db_file = os.path.join(DB_DIR, f"sales_{TEST_TENANT}.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except Exception:
            pass


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)


def test_db_setting_get_set():
    # Test setting defaults
    assert get_setting("non_existent_key", "default_val", TEST_TENANT) == "default_val"
    
    # Test set and get
    set_setting("reply_mode", "manual", TEST_TENANT)
    assert get_setting("reply_mode", "auto", TEST_TENANT) == "manual"
    
    set_setting("reply_mode", "auto", TEST_TENANT)
    assert get_setting("reply_mode", "manual", TEST_TENANT) == "auto"


def test_api_settings_endpoints(client):
    # Retrieve initial settings
    resp = client.get(f"/api/settings?tenant_id={TEST_TENANT}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply_mode"] in ("auto", "manual")
    assert data["reply_pattern"] in ("summary", "detailed")

    # Update settings
    payload = {
        "reply_mode": "manual",
        "reply_pattern": "detailed",
        "exec_name": "Test Agent",
        "exec_title": "Sr Sales Representative",
        "exec_phone": "+91 99999 88888",
        "exec_email": "test@trofeo.com",
        "business_name": "Trofeo Test Corp"
    }
    resp = client.post(f"/api/settings/update?tenant_id={TEST_TENANT}", json=payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # Verify updated settings
    resp = client.get(f"/api/settings?tenant_id={TEST_TENANT}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["reply_mode"] == "manual"
    assert data["reply_pattern"] == "detailed"
    assert data["exec_name"] == "Test Agent"
    assert data["exec_title"] == "Sr Sales Representative"
    assert data["exec_phone"] == "+91 99999 88888"
    assert data["exec_email"] == "test@trofeo.com"
    assert data["business_name"] == "Trofeo Test Corp"


def test_api_analytics_summary(client):
    # Seed the database with dummy quotations and processed messages
    conn = get_connection(TEST_TENANT)
    cursor = conn.cursor()
    
    # Clean tables first
    cursor.execute("DELETE FROM quotations")
    cursor.execute("DELETE FROM quotation_items")
    cursor.execute("DELETE FROM processed_messages")
    cursor.execute("DELETE FROM unmatched_items")
    conn.commit()

    # Insert dummy quotations
    # 1. Apex Builders (QUOTE_GENERATED) - 1000.0
    cursor.execute("""
        INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status, created_at, source)
        VALUES ('QTN-001', 'Apex Builders', 'apex@contractor.com', 847.46, 0.0, 152.54, 1000.0, 'QUOTE_GENERATED', datetime('now', 'localtime'), 'email')
    """)
    cursor.execute("""
        INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total)
        VALUES ('QTN-001', 'SKU-001', 'Heavy Duty Bolt', 10, 100.0, 1000.0)
    """)
    
    # 2. Carpenter Bros (NEGOTIATION_APPROVED) - 500.0
    cursor.execute("""
        INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status, created_at, source)
        VALUES ('QTN-002', 'Carpenter Bros', 'carpenter@local.com', 423.73, 0.0, 76.27, 500.0, 'NEGOTIATION_APPROVED', datetime('now', '-2 days', 'localtime'), 'email')
    """)
    cursor.execute("""
        INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total)
        VALUES ('QTN-002', 'SKU-002', 'Teflon Tape', 50, 10.0, 500.0)
    """)

    # 3. Rejected quotation - 300.0
    cursor.execute("""
        INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status, created_at, source)
        VALUES ('QTN-003', 'Apex Builders', 'apex@contractor.com', 254.24, 0.0, 45.76, 300.0, 'NEGOTIATION_REJECTED', datetime('now', 'localtime'), 'email')
    """)
    
    # 4. Pending Review quotation - 2000.0
    cursor.execute("""
        INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status, created_at, source)
        VALUES ('QTN-004', 'Guest Customer', 'guest@retail.com', 1694.92, 0.0, 305.08, 2000.0, 'PENDING_REVIEW', datetime('now', 'localtime'), 'email')
    """)

    # Processed messages
    cursor.execute("INSERT INTO processed_messages VALUES ('msg-001', 'QTN-001', datetime('now', 'localtime'), datetime('now', 'localtime'))")
    cursor.execute("INSERT INTO processed_messages VALUES ('msg-002', 'QTN-002', datetime('now', 'localtime'), datetime('now', 'localtime'))")
    cursor.execute("INSERT INTO processed_messages VALUES ('msg-003', 'QTN-003', datetime('now', 'localtime'), datetime('now', 'localtime'))")
    cursor.execute("INSERT INTO processed_messages VALUES ('msg-004', 'QTN-004', datetime('now', 'localtime'), datetime('now', 'localtime'))")
    cursor.execute("INSERT INTO processed_messages VALUES ('msg-005', 'UNMATCHED_1', datetime('now', 'localtime'), datetime('now', 'localtime'))")
    
    # Unmatched items
    cursor.execute("INSERT INTO unmatched_items (id, customer_email, customer_name) VALUES (1, 'unknown@retail.com', 'Stranger')")

    conn.commit()
    conn.close()

    # Call summary endpoint
    resp = client.get(f"/api/analytics/summary?tenant_id={TEST_TENANT}")
    assert resp.status_code == 200
    data = resp.json()
    
    # Validate top customers list (should sum grand_total of valid statuses)
    # Apex = QTN-001 (1000.0), QTN-003 (REJECTED, excluded). Total: 1000.0
    # Carpenter = QTN-002 (500.0). Total: 500.0
    # Guest = QTN-004 (PENDING_REVIEW, excluded). Total: 0.0
    top_cust = data["top_customers"]
    assert len(top_cust) >= 2
    assert top_cust[0]["customer_email"] == "apex@contractor.com"
    assert top_cust[0]["total_value"] == 1000.0
    assert top_cust[1]["customer_email"] == "carpenter@local.com"
    assert top_cust[1]["total_value"] == 500.0

    # Validate best selling items
    best_sellers = data["best_sellers"]
    assert len(best_sellers) >= 2
    assert best_sellers[0]["sku_id"] == "SKU-002"  # Qty 50
    assert best_sellers[1]["sku_id"] == "SKU-001"  # Qty 10

    # Validate funnel statistics
    funnel = data["funnel"]
    assert funnel["total_received"] == 5
    assert funnel["converted"] == 2  # QTN-001, QTN-002
    assert funnel["unmatched"] == 1
    assert funnel["rejected"] == 1
    assert funnel["pending_review"] == 1
    # conversion_rate = 2 / 5 * 100 = 40.0%
    assert funnel["conversion_rate"] == 40.0
    # leakage_rate = (unmatched + rejected) / 5 * 100 = (1+1)/5 * 100 = 40.0%
    assert funnel["leakage_rate"] == 40.0


def test_api_customer_history(client):
    conn = get_connection(TEST_TENANT)
    cursor = conn.cursor()
    
    # Insert chat history logs
    cursor.execute("""
        INSERT INTO chat_logs (invoice_id, sender, message, timestamp)
        VALUES ('QTN-001', 'CUSTOMER', 'Can you quote heavy duty bolts?', datetime('now', '-10 minutes', 'localtime'))
    """)
    cursor.execute("""
        INSERT INTO chat_logs (invoice_id, sender, message, timestamp)
        VALUES ('QTN-001', 'BOT', 'Here is your quotation QTN-001.', datetime('now', '-8 minutes', 'localtime'))
    """)
    conn.commit()
    conn.close()

    resp = client.get(f"/api/analytics/customer_history?email=apex@contractor.com&tenant_id={TEST_TENANT}")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["email"] == "apex@contractor.com"
    assert data["name"] == "Apex Builders"
    assert data["total_quotes"] == 1
    assert data["total_spent"] == 1000.0
    assert len(data["quotations"]) == 2  # QTN-001, QTN-003
    assert len(data["timeline"]) == 2


@mock.patch("src.email_listener.get_graph_token")
@mock.patch("src.email_listener.send_outlook_mail")
def test_manual_reply_mode_flow(mock_send, mock_get_token, client):
    mock_get_token.return_value = "mock_token"
    # Set reply mode to manual
    set_setting("reply_mode", "manual", TEST_TENANT)
    
    # Insert a quote that would normally be sent
    conn = get_connection(TEST_TENANT)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status)
        VALUES ('QTN-009', 'Manual Customer', 'manual@test.com', 635.59, 0.0, 114.41, 750.0, 'PENDING_REVIEW')
    """)
    cursor.execute("""
        INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total)
        VALUES ('QTN-009', 'SKU-001', 'Heavy Duty Bolt', 5, 150.0, 750.0)
    """)
    conn.commit()
    conn.close()
    
    # We verify the quote is currently in PENDING_REVIEW state
    conn = get_connection(TEST_TENANT)
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM quotations WHERE invoice_id = 'QTN-009'")
    row = cursor.fetchone()
    assert row["status"] == "PENDING_REVIEW"
    conn.close()

    # Now let's mock approve and send
    mock_send.return_value = True
    
    # Approve and send endpoint
    resp = client.post(f"/api/quote/approve_and_send?tenant_id={TEST_TENANT}", json={"invoice_id": "QTN-009"})
    assert resp.status_code == 200, f"Approve failed with: {resp.text}"
    assert resp.json()["status"] == "success"
    
    # Verify quotation status transitioned to QUOTE_GENERATED
    conn = get_connection(TEST_TENANT)
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM quotations WHERE invoice_id = 'QTN-009'")
    row = cursor.fetchone()
    assert row["status"] == "QUOTE_GENERATED"
    
    # Verify bot logged approval message in chat_logs
    cursor.execute("SELECT sender, message FROM chat_logs WHERE invoice_id = 'QTN-009' ORDER BY id DESC LIMIT 1")
    chat_row = cursor.fetchone()
    assert chat_row["sender"] == "BOT"
    assert "approved and sent" in chat_row["message"]
    conn.close()
