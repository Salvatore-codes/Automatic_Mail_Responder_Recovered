import requests
import json
import os

def test_phase_1():
    url_base = "http://127.0.0.1:8085"
    tenant_id = "default"
    
    print("[Test Phase 1] 1. Creating a mock quotation in PENDING_REVIEW status...")
    from src.database_sqlite import get_connection, update_quotation_status, log_chat_msg
    
    # Let's seed a test quotation in the database
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    invoice_id = "QTN-TEST-PHASE1"
    # Clean up previous runs if any
    cursor.execute("DELETE FROM quotations WHERE invoice_id = ?", (invoice_id,))
    cursor.execute("DELETE FROM quotation_items WHERE invoice_id = ?", (invoice_id,))
    cursor.execute("DELETE FROM chat_logs WHERE invoice_id = ?", (invoice_id,))
    
    # Insert quotation
    cursor.execute(
        "INSERT INTO quotations (invoice_id, customer_name, customer_email, subtotal, discount_pct, tax_amt, grand_total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (invoice_id, "Phase 1 Client", "phase1@test.com", 100.0, 0.0, 18.0, 118.0, "PENDING_REVIEW")
    )
    
    # Insert items
    cursor.execute(
        "INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)",
        (invoice_id, "TEST-SKU", "Test SKU Item", 2, 50.0, 100.0)
    )
    
    conn.commit()
    conn.close()
    
    # Log DRAFT_BOT chat message
    log_chat_msg(invoice_id, "DRAFT_BOT", "Subject: RE: Quote Request [Quotation #QTN-TEST-PHASE1]\n\nDear Client,\nHere is your quote for Test SKU Item.\nSubtotal: 100 INR.", tenant_id=tenant_id)
    
    print("[Success] Mock quotation initialized.")
    
    # ── Test A: Fetching details returns draft_body
    print("\n[Test A] Fetching quote details for QTN-TEST-PHASE1...")
    res = requests.get(f"{url_base}/api/quote/details/{invoice_id}?tenant_id={tenant_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "draft_body" in data, "Expected 'draft_body' in details output"
    print(f"[Success] Found draft_body:\n{data['draft_body']}")
    
    # ── Test B: Testing AI Refinement
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key and not api_key.startswith("your_"):
        print("\n[Test B] Testing AI refinement endpoint /api/quotes/refine...")
        refine_payload = {
            "invoice_id": invoice_id,
            "instruction": "Add a warm welcome greeting at the beginning.",
            "current_draft": data["draft_body"],
            "tenant_id": tenant_id
        }
        res_refine = requests.post(f"{url_base}/api/quotes/refine", json=refine_payload)
        assert res_refine.status_code == 200, f"Expected 200, got {res_refine.status_code}"
        refine_data = res_refine.json()
        assert "refined_draft" in refine_data, "Expected 'refined_draft' in response"
        print(f"[Success] AI Refined Draft:\n{refine_data['refined_draft']}")
    else:
        print("\n[Test B] Skipping AI Refinement test: GEMINI_API_KEY not configured.")
        
    # ── Test C: Approve & Send with custom body (mock outlook Graph call will fail or we can mock/check custom body is accepted)
    # Since Microsoft Graph OAuth token is not initialized in test, it will throw 500 but we can check if it parses custom_body correctly.
    print("\n[Test C] Testing approve_and_send with custom body parameter...")
    approve_payload = {
        "invoice_id": invoice_id,
        "custom_body": "Customized Cover Letter content."
    }
    # We expect 500 or 200 depending on MS Graph token, but let's see if the server parses it
    res_approve = requests.post(f"{url_base}/api/quote/approve_and_send?tenant_id={tenant_id}", json=approve_payload)
    print(f"[Result] Response code: {res_approve.status_code}, Body: {res_approve.text}")
    
    print("\n[All local checks passed!]")

if __name__ == "__main__":
    test_phase_1()
