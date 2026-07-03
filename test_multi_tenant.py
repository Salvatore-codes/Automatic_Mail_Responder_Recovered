"""
Comprehensive multi-tenant validation test suite.
Verifies that:
  1. Multiple tenants are dynamically loaded from data/tenants.json.
  2. Database connections are isolated per-tenant (sales_tenant_a.db vs sales_tenant_b.db).
  3. Ingestion in mock mode resolves separate directories (mock_inbox/tenant_a vs mock_inbox/tenant_b).
  4. Processing mock email runs successfully and produces separated outputs in mock_outbox.
  5. Quotations and databases are fully isolated.
"""
import os
import sys
import json
import shutil
import sqlite3
import time

# Ensure src path is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.tenants import load_tenants, get_tenant_config, get_tenant_catalog
from src.database_sqlite import get_connection, log_quotation, log_quotation_item
from src.email_listener import poll_email_inbox

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

def check(title, cond):
    print(f"[{PASS if cond else FAIL}] {title}")
    return 1 if cond else 0

def clean_cleanup():
    # Helper to clean up test artifacts
    paths = [
        "data/tenants.json.testbackup",
        "data/tenants.json",
        "data/sales_tenant_a.db",
        "data/sales_tenant_b.db",
        "mock_inbox/tenant_a",
        "mock_inbox/tenant_b",
        "mock_outbox/tenant_a",
        "mock_outbox/tenant_b",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                if os.path.isdir(p):
                    shutil.rmtree(p)
                else:
                    os.remove(p)
            except Exception as e:
                print(f"[Warning] Cleanup failed for {p}: {e}")

def main():
    print("=" * 80)
    print("                TROFEO MULTI-TENANT SYSTEM INTEGRATION TESTS")
    print("=" * 80)
    
    passes = 0
    total = 0
    
    # Backup original tenants.json if it exists
    original_tenants_path = "data/tenants.json"
    backup_tenants_path = "data/tenants.json.testbackup"
    if os.path.exists(original_tenants_path):
        shutil.copyfile(original_tenants_path, backup_tenants_path)
        
    try:
        # 1. Setup mock tenants.json
        test_tenants = {
            "tenant_a": {
                "name": "Tenant A Tools",
                "business_name": "Tenant A Solutions Ltd",
                "sales_executive_name": "Alice Manager",
                "sales_executive_phone": "+91 91111 22222",
                "sales_executive_email": "alice@tenanta.com",
                "upi_id": "alice@upi",
                "upi_name": "TenantATools",
                "catalog_csv": "data/sku_catalog.csv",
                "crm_json": "data/crm_customers.json"
            },
            "tenant_b": {
                "name": "Tenant B Fasteners",
                "business_name": "Tenant B Fasteners Corp",
                "sales_executive_name": "Bob Executive",
                "sales_executive_phone": "+91 93333 44444",
                "sales_executive_email": "bob@tenantb.com",
                "upi_id": "bob@upi",
                "upi_name": "TenantBFasteners",
                "catalog_csv": "data/sku_catalog.csv",
                "crm_json": "data/crm_customers.json"
            }
        }
        
        with open(original_tenants_path, 'w', encoding='utf-8') as f:
            json.dump(test_tenants, f, indent=2)
            
        # ── Test 1: Dynamic Loading of Tenants Config
        tenants = load_tenants()
        total += 1
        passes += check("Loaded tenant configurations from tenants.json", 
                        "tenant_a" in tenants and "tenant_b" in tenants)
        
        total += 1
        passes += check("Tenant A config has correct custom fields", 
                        tenants.get("tenant_a", {}).get("sales_executive_name") == "Alice Manager")
        
        # ── Test 2: Database Isolation Check
        conn_a = get_connection("tenant_a")
        conn_b = get_connection("tenant_b")
        
        # Log to tenant_a
        log_quotation(
            invoice_id="INV-TENANT-A",
            customer_name="John A",
            customer_email="john@local.com",
            customer_phone="12345",
            subtotal=100.0,
            discount_pct=0.1,
            tax_amt=16.2,
            grand_total=106.2,
            status="QUOTE_GENERATED",
            tenant_id="tenant_a"
        )
        
        # Log to tenant_b
        log_quotation(
            invoice_id="INV-TENANT-B",
            customer_name="Bob B",
            customer_email="bob@local.com",
            customer_phone="67890",
            subtotal=200.0,
            discount_pct=0.0,
            tax_amt=36.0,
            grand_total=236.0,
            status="QUOTE_GENERATED",
            tenant_id="tenant_b"
        )
        
        # Assert database file isolation
        total += 1
        passes += check("tenant_a database file created", os.path.exists("data/sales_tenant_a.db"))
        total += 1
        passes += check("tenant_b database file created", os.path.exists("data/sales_tenant_b.db"))
        
        # Query database tenant_a to verify lack of cross-contamination
        cursor_a = conn_a.cursor()
        cursor_a.execute("SELECT invoice_id FROM quotations")
        rows_a = [r[0] for r in cursor_a.fetchall()]
        conn_a.close()
        
        total += 1
        passes += check("tenant_a database ONLY has tenant A quotation", 
                        "INV-TENANT-A" in rows_a and "INV-TENANT-B" not in rows_a)
        
        # Query database tenant_b
        cursor_b = conn_b.cursor()
        cursor_b.execute("SELECT invoice_id FROM quotations")
        rows_b = [r[0] for r in cursor_b.fetchall()]
        conn_b.close()
        
        total += 1
        passes += check("tenant_b database ONLY has tenant B quotation", 
                        "INV-TENANT-B" in rows_b and "INV-TENANT-A" not in rows_b)
        
        # ── Test 3: Folder Isolation & Process Mock Ingestion
        # Set up mock email files
        os.makedirs("mock_inbox/tenant_a", exist_ok=True)
        os.makedirs("mock_inbox/tenant_b", exist_ok=True)
        
        # Ingestion payload for tenant_a
        email_content_a = """From: apex_builders@contractor.com
Subject: Material Request
Body:
Hi, please quote:
10 x Brass Threaded Elbow Fitting 1/2 Inch
"""
        with open("mock_inbox/tenant_a/email1.txt", "w", encoding='utf-8') as f:
            f.write(email_content_a)
            
        # Ingestion payload for tenant_b
        email_content_b = """From: john.carpenter@localshop.com
Subject: Material Request
Body:
Hi, please quote:
20 x Hex Head Bolt M8 x 50mm
"""
        with open("mock_inbox/tenant_b/email2.txt", "w", encoding='utf-8') as f:
            f.write(email_content_b)
            
        # Run poller for both tenants
        catalog_a = get_tenant_catalog("tenant_a")
        crm_a = tenants["tenant_a"]["crm_json"]
        poll_email_inbox(catalog_a, crm_a, mode="mock", tenant_id="tenant_a")
        
        catalog_b = get_tenant_catalog("tenant_b")
        crm_b = tenants["tenant_b"]["crm_json"]
        poll_email_inbox(catalog_b, crm_b, mode="mock", tenant_id="tenant_b")
        
        # Verify outputs created in separated directories
        total += 1
        passes += check("tenant_a outbox reply created in mock_outbox/tenant_a/", 
                        any(f.endswith("_reply.txt") for f in os.listdir("mock_outbox/tenant_a")))
        
        total += 1
        passes += check("tenant_b outbox reply created in mock_outbox/tenant_b/", 
                        any(f.endswith("_reply.txt") for f in os.listdir("mock_outbox/tenant_b")))
        
        # Verify that pdf quotations correspond to isolated folder structures
        total += 1
        passes += check("tenant_a quotation pdf stored in mock_outbox/tenant_a/", 
                        any(f.endswith(".pdf") for f in os.listdir("mock_outbox/tenant_a")))
        
        total += 1
        passes += check("tenant_b quotation pdf stored in mock_outbox/tenant_b/", 
                        any(f.endswith(".pdf") for f in os.listdir("mock_outbox/tenant_b")))
        
        # Verify quotation is signed off by the correct tenant sales executive
        reply_file_a = next(f for f in os.listdir("mock_outbox/tenant_a") if f.endswith("_reply.txt"))
        with open(os.path.join("mock_outbox/tenant_a", reply_file_a), "r", encoding='utf-8') as f:
            content_reply_a = f.read()
            
        total += 1
        passes += check("tenant_a response signed off by Alice Manager", "Alice Manager" in content_reply_a)
        total += 1
        passes += check("tenant_a response signature includes custom business name", "Tenant A Solutions Ltd" in content_reply_a)

        reply_file_b = next(f for f in os.listdir("mock_outbox/tenant_b") if f.endswith("_reply.txt"))
        with open(os.path.join("mock_outbox/tenant_b", reply_file_b), "r", encoding='utf-8') as f:
            content_reply_b = f.read()
            
        total += 1
        passes += check("tenant_b response signed off by Bob Executive", "Bob Executive" in content_reply_b)
        total += 1
        passes += check("tenant_b response signature includes custom business name", "Tenant B Fasteners Corp" in content_reply_b)
        
    finally:
        # Clean up test database/config modifications and restore original configurations
        clean_cleanup()
        if os.path.exists(backup_tenants_path):
            shutil.move(backup_tenants_path, original_tenants_path)
            
    print("-" * 80)
    print(f"Multi-tenant Results: {passes}/{total} tests passed.")
    sys.exit(0 if passes == total else 1)

if __name__ == "__main__":
    main()
