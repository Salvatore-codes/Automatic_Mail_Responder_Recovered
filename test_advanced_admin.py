import os
import sys
import sqlite3

# Ensure import of local source files works
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database_sqlite import (
    get_connection,
    log_deficit,
    get_all_deficits,
    resolve_deficit,
    log_quotation,
    get_escalated_negotiations,
    update_quotation_status
)

def run_admin_tests():
    print("Initializing test database connection...")
    conn = get_connection(tenant_id="test_tenant")
    cursor = conn.cursor()
    
    # Clean tables for a clean test run
    cursor.execute("DELETE FROM deficits")
    cursor.execute("DELETE FROM quotations")
    conn.commit()
    conn.close()
    
    print("\n1. Testing Deficit Logging...")
    # Log a deficit
    log_deficit(
        invoice_id="QTN-TEST01",
        sku_id="SKU-DEF01",
        sku_name="Deficit Elbow Fitting",
        requested_qty=20,
        available_qty=5,
        deficit_qty=15,
        customer_name="Alice Deficit",
        customer_email="alice@test.com",
        customer_phone="+1 555-0199",
        tenant_id="test_tenant"
    )
    
    # Retrieve deficits
    deficits = get_all_deficits(tenant_id="test_tenant")
    print(f"Logged Deficits count: {len(deficits)}")
    assert len(deficits) == 1, "Should have exactly 1 deficit logged"
    
    def_item = deficits[0]
    print(f"Deficit Item: {def_item['customer_name']} | SKU: {def_item['sku_id']} | Status: {def_item['status']}")
    assert def_item["invoice_id"] == "QTN-TEST01"
    assert def_item["sku_id"] == "SKU-DEF01"
    assert def_item["deficit_qty"] == 15
    assert def_item["status"] == "PENDING"
    
    print("\n2. Testing Deficit Resolution...")
    deficit_id = def_item["id"]
    resolve_deficit(deficit_id, tenant_id="test_tenant")
    
    deficits_resolved = get_all_deficits(tenant_id="test_tenant")
    resolved_item = next((d for d in deficits_resolved if d["id"] == deficit_id), None)
    assert resolved_item is not None
    print(f"Resolved Deficit Status: {resolved_item['status']}")
    assert resolved_item["status"] == "RESOLVED"
    
    print("\n3. Testing Negotiation Escalation & Retrieval...")
    # Log an escalated negotiation quotation
    log_quotation(
        invoice_id="QTN-NEG01",
        customer_name="Bob Negotiator",
        customer_email="bob@negotiator.com",
        customer_phone="+91 99999 88888",
        subtotal=1000.0,
        discount_pct=0.0,
        tax_amt=180.0,
        grand_total=1180.0,
        status="NEGOTIATION_ESCALATED",
        tenant_id="test_tenant"
    )
    
    escalated = get_escalated_negotiations(tenant_id="test_tenant")
    print(f"Escalated negotiations count: {len(escalated)}")
    assert len(escalated) == 1
    assert escalated[0]["invoice_id"] == "QTN-NEG01"
    assert escalated[0]["customer_name"] == "Bob Negotiator"
    
    print("\n4. Testing Negotiation Override & Recalculation...")
    # Approve with 15% discount override
    update_quotation_status(
        invoice_id="QTN-NEG01",
        status="NEGOTIATION_APPROVED",
        discount_pct=0.15,
        tenant_id="test_tenant"
    )
    
    # Fetch quote from DB to check recalculations
    conn = get_connection(tenant_id="test_tenant")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quotations WHERE invoice_id = 'QTN-NEG01'")
    row = cursor.fetchone()
    conn.close()
    
    assert row is not None
    quote = dict(row)
    print(f"Updated Quotation: Status={quote['status']} | Discount={quote['discount_pct']} | Subtotal={quote['subtotal']} | Grand Total={quote['grand_total']}")
    
    assert quote["status"] == "NEGOTIATION_APPROVED"
    assert abs(quote["discount_pct"] - 0.15) < 1e-5
    
    # Subtotal: 1000.0, Discount: 15% = 150.0, Net: 850.0, Tax (18%): 153.0, Grand Total: 1003.0
    assert abs(quote["tax_amt"] - 153.0) < 0.01, f"Expected tax to be 153.0, got {quote['tax_amt']}"
    assert abs(quote["grand_total"] - 1003.0) < 0.01, f"Expected grand total to be 1003.0, got {quote['grand_total']}"
    
    # Verify it is no longer in escalated negotiations list
    escalated_after = get_escalated_negotiations(tenant_id="test_tenant")
    assert len(escalated_after) == 0, "Approved negotiation should not appear in escalated list anymore"
    
    print("\n\033[92mALL ADVANCED ADMIN TESTS PASSED SUCCESSFULLY!\033[0m")

if __name__ == "__main__":
    run_admin_tests()
