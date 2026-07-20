import pytest
import os
import json
from src.database_sqlite import (
    get_connection,
    save_customer_po_template,
    get_customer_po_template,
    get_all_customer_po_templates,
    log_quotation,
    get_pending_quotes_needing_followup,
    mark_quote_followup_sent
)

TEST_TENANT = "test_autonomy"

@pytest.fixture(autouse=True)
def cleanup_test_db():
    conn = get_connection(TEST_TENANT)
    conn.close()
    yield

def test_task5_customer_po_template_memory():
    cust_email = "po_client@acme.com"
    header_mapping = {"sku": "Product_Code", "qty": "Quantity_Pcs", "price": "Unit_Price"}
    col_indexes = {"sku": 0, "qty": 2, "price": 4}
    snippet = "PO Header: Item Code | Description | Qty | Rate"
    
    # 1. Save template
    saved = save_customer_po_template(
        cust_email, header_mapping, col_indexes,
        sample_snippet=snippet, template_name="Acme PO Layout", tenant_id=TEST_TENANT
    )
    assert saved is True
    
    # 2. Retrieve template
    tpl = get_customer_po_template(cust_email, tenant_id=TEST_TENANT)
    assert tpl is not None
    assert tpl["customer_email"] == cust_email
    assert tpl["template_name"] == "Acme PO Layout"
    assert tpl["header_mapping"]["sku"] == "Product_Code"
    assert tpl["column_indexes"]["qty"] == 2
    
    # 3. List all templates
    all_tpls = get_all_customer_po_templates(tenant_id=TEST_TENANT)
    assert len(all_tpls) >= 1
    assert any(t["customer_email"] == cust_email for t in all_tpls)

def test_task6_autonomous_followup_cadence():
    inv_id = "INV-AUTONOMY-999"
    cust_name = "Autonomy Client"
    cust_email = "autonomy@client.com"
    
    # Log a quote
    log_quotation(
        inv_id, cust_name, cust_email, "+1234567890",
        1000.0, 0.05, 171.0, 1121.0, "QUOTE_GENERATED",
        source="email", tenant_id=TEST_TENANT
    )
    
    # Query pending follow-ups with threshold = 0 (simulates older than threshold)
    pending = get_pending_quotes_needing_followup(hours_threshold=0, tenant_id=TEST_TENANT)
    assert len(pending) >= 1
    assert any(q["invoice_id"] == inv_id for q in pending)
    
    # Mark follow-up as sent
    marked = mark_quote_followup_sent(inv_id, "Automated follow-up sent.", tenant_id=TEST_TENANT)
    assert marked is True
    
    # Verify it is no longer pending
    pending_after = get_pending_quotes_needing_followup(hours_threshold=0, tenant_id=TEST_TENANT)
    assert not any(q["invoice_id"] == inv_id for q in pending_after)
