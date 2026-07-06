import os
import shutil
import pytest
import asyncio
from src.database_sqlite import get_connection, get_setting, set_setting, init_db
from src.server import get_settings, update_settings, SettingsUpdateRequest, get_analytics_summary, get_customer_history

TEST_TENANT = "test_settings_workflow"

@pytest.fixture(autouse=True)
def setup_test_db():
    # Setup test database
    from src.database_sqlite import DB_DIR, INITIALIZED_DBS
    # Ensure it's treated as uninitialized so it runs init_db_conn
    if TEST_TENANT in INITIALIZED_DBS:
        INITIALIZED_DBS.remove(TEST_TENANT)
    
    db_path = os.path.join(DB_DIR, f"sales_{TEST_TENANT}.db")
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
            
    # Initialize connection
    conn = get_connection(TEST_TENANT)
    conn.close()
    
    yield
    
    # Cleanup database
    if TEST_TENANT in INITIALIZED_DBS:
        INITIALIZED_DBS.remove(TEST_TENANT)
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass

def test_settings_get_set():
    # Test setting values directly in database
    set_setting("reply_mode", "manual", TEST_TENANT)
    set_setting("reply_pattern", "detailed", TEST_TENANT)
    set_setting("exec_name", "Test Exec", TEST_TENANT)
    
    assert get_setting("reply_mode", "auto", TEST_TENANT) == "manual"
    assert get_setting("reply_pattern", "summary", TEST_TENANT) == "detailed"
    assert get_setting("exec_name", "", TEST_TENANT) == "Test Exec"
    assert get_setting("non_existent", "fallback", TEST_TENANT) == "fallback"

def test_settings_api_endpoints():
    # Test API endpoints
    # 1. Update settings
    req = SettingsUpdateRequest(
        reply_mode="manual",
        reply_pattern="detailed",
        ingestion_engine="A",
        exec_name="Jane Doe",
        exec_title="Manager",
        exec_phone="+91 11111 22222",
        exec_email="jane@test.com",
        business_name="Test Enterprise"
    )
    
    async def run_update():
        return await update_settings(req, tenant_id=TEST_TENANT)
        
    res_update = asyncio.run(run_update())
    assert res_update == {"status": "success"}
    
    # 2. Get settings
    async def run_get():
        return await get_settings(tenant_id=TEST_TENANT)
        
    res_get = asyncio.run(run_get())
    assert res_get["reply_mode"] == "manual"
    assert res_get["reply_pattern"] == "detailed"
    assert res_get["exec_name"] == "Jane Doe"
    assert res_get["exec_title"] == "Manager"
    assert res_get["exec_phone"] == "+91 11111 22222"
    assert res_get["exec_email"] == "jane@test.com"
    assert res_get["business_name"] == "Test Enterprise"

def test_analytics_and_funnel_calculations():
    from src.database_sqlite import log_quotation, log_quotation_item, log_processed_message, log_unmatched_item
    
    # Insert mock quotes and items
    # Quote 1 (Converted / Approved)
    log_quotation("QTN-T0001", "Alice", "alice@example.com", "+123", 100.0, 0.0, 18.0, 118.0, "QUOTE_GENERATED", "email", TEST_TENANT)
    log_quotation_item("QTN-T0001", "SKU-A", "Product A", 2, 50.0, 100.0, TEST_TENANT)
    
    # Quote 2 (Negotiating / Escalated)
    log_quotation("QTN-T0002", "Bob", "bob@example.com", "+456", 200.0, 0.10, 32.4, 212.4, "NEGOTIATION_ESCALATED", "email", TEST_TENANT)
    log_quotation_item("QTN-T0002", "SKU-B", "Product B", 1, 200.0, 200.0, TEST_TENANT)
    
    # Processed messages to calculate funnel
    log_processed_message("msg_id_1", "QTN-T0001", "2026-07-06 10:00:00", TEST_TENANT)
    log_processed_message("msg_id_2", "QTN-T0002", "2026-07-06 10:05:00", TEST_TENANT)
    log_processed_message("msg_id_3", "IRRELEVANT", "2026-07-06 10:10:00", TEST_TENANT) # Should be skipped
    
    # Unmatched items
    log_unmatched_item("charlie@example.com", "Charlie", "No SKU match here", "email", TEST_TENANT)
    
    # Run analytics summary endpoint code
    async def run_summary():
        return await get_analytics_summary(date_filter="all", tenant_id=TEST_TENANT)
        
    summary = asyncio.run(run_summary())
    
    # Validate Funnel Calculations
    funnel = summary["funnel"]
    assert funnel["total_received"] == 2
    assert funnel["converted"] == 1
    assert funnel["unmatched"] == 1
    assert funnel["conversion_rate"] == 50.0
    assert funnel["leakage_rate"] == 50.0
    
    # Validate top customers, best sellers, etc.
    top_cust = summary["top_customers"]
    assert len(top_cust) >= 2
    assert top_cust[0]["customer_email"] == "bob@example.com"
    assert top_cust[0]["total_value"] == 212.4
    assert top_cust[1]["customer_email"] == "alice@example.com"
    assert top_cust[1]["total_value"] == 118.0
    
    best_sellers = summary["best_sellers"]
    assert len(best_sellers) >= 1
    assert best_sellers[0]["sku_id"] == "SKU-A"
    assert best_sellers[0]["total_qty"] == 2

def test_customer_history_timeline():
    from src.database_sqlite import log_quotation, log_chat_msg
    
    # Setup history data
    email = "history@test.com"
    log_quotation("QTN-H0001", "History Cust", email, "+111", 150.0, 0.0, 27.0, 177.0, "QUOTE_GENERATED", "email", TEST_TENANT)
    log_chat_msg("QTN-H0001", "BOT", "Quote generated and sent", TEST_TENANT)
    log_chat_msg("QTN-H0001", "customer", "Can I get a discount?", TEST_TENANT)
    
    # Fetch history
    async def run_history():
        return await get_customer_history(email, tenant_id=TEST_TENANT)
        
    history = asyncio.run(run_history())
    
    assert history["email"] == email
    assert history["name"] == "History Cust"
    assert history["total_quotes"] == 1
    assert history["total_spent"] == 177.0
    assert len(history["quotations"]) == 1
    assert history["quotations"][0]["invoice_id"] == "QTN-H0001"
    
    timeline = history["timeline"]
    assert len(timeline) == 2
    assert timeline[0]["sender"] == "BOT"
    assert timeline[1]["sender"] == "customer"

def test_negotiation_escalation_over_2_percent():
    from src.negotiator import run_negotiation_step
    
    # 1. Under 2% -> APPROVED
    res_under = run_negotiation_step("Can I get a 1.5% discount?", 1.5, [])
    assert res_under["status"] == "APPROVED"
    assert res_under["approved_discount"] == 1.5
    
    # 2. Over 2% -> PENDING_REVIEW with consideration message
    res_over = run_negotiation_step("Can I get a 5% discount?", 5.0, [])
    assert res_over["status"] == "PENDING_REVIEW"
    assert res_over["approved_discount"] == 0.0
    assert "under consideration by our officials" in res_over["reply"]

