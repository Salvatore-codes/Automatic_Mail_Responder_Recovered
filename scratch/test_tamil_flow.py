import os
import sys

# Ensure project root is in path
project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)

from src.email_listener import is_email_relevant, build_email_reply_body
from src.pdf_generator import generate_pdf_quotation
from src.database import Catalog

def run_test():
    print("=========================================")
    print("Testing Tamil relevance check...")
    
    # Raw Tamil customer inquiry
    tamil_subject = "விலைப்பட்டியல் தேவை (Quotation inquiry)"
    tamil_body = "வணக்கம்,\n\nஎங்களுக்கு 15 items Brass Threaded Elbow மற்றும் teflon tape தேவை. விலையினைக் குறிப்பிடவும்.\n\nநன்றி"
    sender = "rajarajan@gmail.com"
    
    # 1. Relevance check
    catalog = Catalog("data/sku_catalog.csv")
    relevant = is_email_relevant(
        sender=sender,
        subject=tamil_subject,
        body=tamil_body,
        catalog=catalog,
        crm_emails={sender},
        attachment_text="",
        email_has_attachments=False,
        tenant_id="default"
    )
    print(f"Is relevant: {relevant} (Expected: True)")
    assert relevant == True, "Failed relevance check"
    
    # 2. Build mock matched items (simulating hybrid parser results)
    matched_lines = [
        {
            "original_line": "எங்களுக்கு 15 items Brass Threaded Elbow தேவை",
            "parsed_query": "Brass Threaded Elbow",
            "quantity": 15,
            "matched_sku_id": "ELBOW-BRASS-12",
            "matched_sku_name": "Brass Threaded Elbow Fitting 1/2 Inch",
            "unit_price": 45.0,
            "confidence": 100.0,
            "match_method": "Mock Matcher"
        },
        {
            "original_line": "மற்றும் 10 teflon tape வேண்டும்",
            "parsed_query": "teflon tape",
            "quantity": 10,
            "matched_sku_id": "TAPE-TEFLON-12",
            "matched_sku_name": "PTFE Teflon Seal Tape 12mm",
            "unit_price": 12.0,
            "confidence": 100.0,
            "match_method": "Mock Matcher"
        }
    ]
    
    # 3. Test Tamil email reply generation
    (plain_text, html_text), total = build_email_reply_body(
        matched_lines=matched_lines,
        discount_pct=0.1,
        customer_name="Rajarajan",
        invoice_id="INV-TEST-TAMIL",
        tenant_config={"id": "default", "business_name": "Trofeo Hardware"}
    )
    
    print("\n--- Generated Plain Text Response ---")
    print(plain_text)
    
    # Verify Tamil translations are present in text
    assert "அன்புள்ள Rajarajan," in plain_text
    assert "துணைத்தொகை" in plain_text
    assert "நன்றி" in plain_text or "மகிழ்ச்சியுடன் உதவுவோம்" in plain_text
    print("\nTamil reply text verification: PASSED")
    
    # 4. Test PDF generation with Tamil characters
    pdf_out = os.path.join(project_root, "data", "test_tamil_quote.pdf")
    if os.path.exists(pdf_out):
        os.remove(pdf_out)
        
    print("\nGenerating quotation PDF with Tamil characters...")
    # Include a Tamil customer name to test ReportLab Nirmala font rendering
    generate_pdf_quotation(
        matched_lines=matched_lines,
        discount_pct=0.1,
        customer_name="மனோரஞ்சித் (Rajarajan)",
        invoice_id="INV-TEST-TAMIL",
        output_path=pdf_out,
        customer_phone="9876543210",
        business_name="Trofeo Hardware"
    )
    
    print(f"PDF successfully generated at: {pdf_out}")
    assert os.path.exists(pdf_out), "PDF file was not created"
    print("Tamil PDF Rendering: PASSED")
    print("=========================================")

if __name__ == "__main__":
    run_test()
