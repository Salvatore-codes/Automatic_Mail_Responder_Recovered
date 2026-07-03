import os
import sys
import time
import json
from dotenv import load_dotenv

# Load env variables (e.g. GEMINI_API_KEY) if .env exists
load_dotenv()

from src.database import Catalog
from src.scenario_free import run_scenario_free
from src.scenario_hybrid import run_scenario_hybrid
from src.quotation import generate_quotation_table

def print_banner():
    print("=" * 95)
    print("              SKU MATCHING & QUOTATION GENERATOR - PRODUCTION SIMULATOR")
    print("=" * 95)
    print(" This simulator includes the following production-grade features:")
    print("   1. CRM Profile Lookup: Applies client discounts (e.g. Contractors get 15% off).")
    print("   2. ERP Inventory Stock Sync: Validates stock availability and warns of low/out-of-stock items.")
    print("   3. Human-in-the-Loop (HITL) Gate: Prompts the operator for manual confirmation if match is uncertain (< 80%).")
    print("   4. Feedback Learning Loop: Automatically saves manual overrides to synonyms database for future auto-matching.")
    print("=" * 95)

def load_crm_customers():
    crm_path = os.path.join(os.path.dirname(__file__), "data", "crm_customers.json")
    if os.path.exists(crm_path):
        try:
            with open(crm_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to load CRM customers: {e}")
    return {}

def run_hitl_gate(matched_lines, catalog):
    """
    Human-in-the-Loop (HITL) Gate.
    If confidence < 80% or matched SKU is UNKNOWN, prompts the operator to review.
    """
    print("\n" + "!" * 95)
    print("                      HUMAN-IN-THE-LOOP (HITL) REVIEW GATE")
    print("!" * 95)
    
    updated_lines = []
    has_flags = False
    
    for line in matched_lines:
        query = line['parsed_query']
        sku_id = line['matched_sku_id']
        conf = line['confidence']
        
        # Flag if low confidence or unknown match
        if conf < 80.0 or sku_id == "UNKNOWN":
            has_flags = True
            print(f"\n[FLAGGED] Low confidence match ({conf}%) for customer item: '{query}'")
            print(f"Current best guess: {line['matched_sku_name']} ({sku_id})")
            
            # Find top candidates from TF-IDF
            candidates = catalog.match_local_semantic(query, limit=3)
            
            print("\nOptions:")
            for idx, cand in enumerate(candidates):
                print(f"  {idx + 1}) {cand['sku']['sku_name']} ({cand['sku']['sku_id']}) - Match Score: {cand['score']}%")
            print("  4) Manually enter a different SKU ID")
            print("  5) Skip this item")
            
            choice = input("Select action (1-5): ").strip()
            
            if choice in ["1", "2", "3"] and int(choice) <= len(candidates):
                selected = candidates[int(choice) - 1]['sku']
                line['matched_sku_id'] = selected['sku_id']
                line['matched_sku_name'] = selected['sku_name']
                line['unit_price'] = selected['price']
                line['confidence'] = 100.0
                line['match_method'] = "Operator Confirmed"
                
                # Save to synonyms (Feedback Learning Loop)
                print(f"[Learning Loop] Saving Synonym: '{query}' -> '{selected['sku_id']}'")
                catalog.register_synonym(query, selected['sku_id'])
                
            elif choice == "4":
                custom_id = input("Enter exact SKU ID: ").strip().upper()
                sku = next((s for s in catalog.skus if s['sku_id'] == custom_id), None)
                if sku:
                    line['matched_sku_id'] = sku['sku_id']
                    line['matched_sku_name'] = sku['sku_name']
                    line['unit_price'] = sku['price']
                    line['confidence'] = 100.0
                    line['match_method'] = "Operator Manual Input"
                    catalog.register_synonym(query, sku['sku_id'])
                else:
                    print("[Warning] SKU ID not found. Keeping original match.")
            elif choice == "5":
                line['matched_sku_id'] = "SKIPPED"
                line['matched_sku_name'] = "Skipped by operator"
                line['unit_price'] = 0.0
                line['confidence'] = 0.0
                line['match_method'] = "None"
        
        updated_lines.append(line)
        
    if not has_flags:
        print("[System] No items flagged. All matched with high confidence (>= 80%).")
    else:
        print("\n[System] HITL review completed.")
    return updated_lines

def main():
    print_banner()
    
    # Load catalog & customers
    catalog_path = os.path.join(os.path.dirname(__file__), "data", "sku_catalog.csv")
    try:
        catalog = Catalog(catalog_path)
        print(f"[System] Loaded {len(catalog.skus)} SKUs from inventory catalog.")
        syn_count = len(catalog.synonyms)
        if syn_count > 0:
            print(f"[System] Loaded {syn_count} learned synonyms from database.")
    except Exception as e:
        print(f"[Error] Failed to load SKU database: {e}")
        sys.exit(1)
        
    customers = load_crm_customers()

    # STEP 1: CRM Profile Lookup
    print("\n--- STEP 1: CRM Customer Profile Lookup ---")
    print("Available test emails:")
    print("  1) apex_builders@contractor.com (Contractor: 15% discount)")
    print("  2) john.carpenter@localshop.com (Wholesale: 10% discount)")
    print("  3) walkin_retail@guest.com (Retail: Standard pricing)")
    
    email_choice = input("\nSelect profile (1-3) or type custom email: ").strip()
    customer_email = "walkin_retail@guest.com"
    if email_choice == "1":
        customer_email = "apex_builders@contractor.com"
    elif email_choice == "2":
        customer_email = "john.carpenter@localshop.com"
    elif email_choice == "3":
        customer_email = "walkin_retail@guest.com"
    elif "@" in email_choice:
        customer_email = email_choice

    # Lookup profile
    cust_profile = customers.get(customer_email, {"name": "Walk-in Retail Client", "tier": "retail", "discount": 0.0})
    print(f"\n[CRM Match] Customer: {cust_profile['name']} | Tier: {cust_profile['tier'].upper()} | Discount: {int(cust_profile['discount']*100)}%")

    # STEP 2: Select Ingestion Source
    print("\n--- STEP 2: Select Ingestion Source ---")
    print("1) Clean Email Enquiry (data/sample_order_email.txt)")
    print("2) Messy WhatsApp Chat (data/sample_order_whatsapp.txt)")
    
    choice = input("\nEnter choice (1-2): ").strip()
    order_text = ""
    input_type = "custom"
    
    if choice == "1":
        file_path = os.path.join(os.path.dirname(__file__), "data", "sample_order_email.txt")
        with open(file_path, 'r', encoding='utf-8') as f:
            order_text = f.read()
        input_type = "email"
    else:
        file_path = os.path.join(os.path.dirname(__file__), "data", "sample_order_whatsapp.txt")
        with open(file_path, 'r', encoding='utf-8') as f:
            order_text = f.read()
        input_type = "whatsapp"

    # STEP 3: Select Engine & Run Pipeline
    print("\n--- STEP 3: Select Engine ---")
    print("1) Scenario A (Free / Local Fuzzy Match)")
    print("2) Scenario B (Hybrid / Gemini API)")
    
    mode = input("\nEnter choice (1-2): ").strip()
    
    matched_lines = []
    
    if mode == "1":
        print("\n[Running] Running Free / Local Fuzzy Pipeline...")
        matched_lines = run_scenario_free(order_text, catalog)
    else:
        print("\n[Running] Running Hybrid / API Pipeline...")
        matched_lines = run_scenario_hybrid(order_text, catalog, input_type=input_type)

    # STEP 4: Human-in-the-Loop Gate
    matched_lines = run_hitl_gate(matched_lines, catalog)

    # STEP 5: Generate & Display Quotation (includes CRM discount and ERP Stock warnings)
    print("\n" + "=" * 55 + " FINAL GENERATED QUOTATION " + "=" * 53)
    print(generate_quotation_table(matched_lines, discount_pct=cust_profile['discount'], catalog=catalog))

if __name__ == "__main__":
    main()
