import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# Ensure import of local source files works
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


from src.database import Catalog
from src.email_listener import process_incoming_email

def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
    crm_path = os.path.join(project_root, "data", "crm_customers.json")
    
    catalog = Catalog(catalog_path)
    
    # We will simulate a customer enquiry containing ONLY out-of-stock/unavailable items:
    # 1. 5 x PTFE Teflon Seal Tape 12mm (Out of stock: 0 available)
    # 2. 15 x Wood Screw Flat Head #8 x 1.5 Inch (Out of stock: 0 available)
    sender = "Rajarajan S <rajarajansvelora@gmail.com>"
    subject = "Materials Quote Request - Out of Stock Only"
    body = (
        "Hi Rajaram,\n\n"
        "Can you please quote for the following materials:\n"
        "- 5 x PTFE Teflon Seal Tape 12mm\n"
        "- 15 x Wood Screw Flat Head #8 x 1.5 Inch\n\n"
        "Thanks!"
    )
    
    print("Processing mock incoming email...")
    rep_sub, rep_body, pdf_path, status = process_incoming_email(
        sender=sender,
        subject=subject,
        body=body,
        catalog=catalog,
        crm_path=crm_path,
        mode="mock",
        project_root=project_root
    )
    
    plain_text, html_text = rep_body
    
    # Let's print the plain text email to standard output
    print("\n" + "=" * 40 + " PLAIN TEXT EMAIL " + "=" * 40)
    print(plain_text)
    print("=" * 98 + "\n")
    
    # Save the HTML version to D:\Download\mock_email_preview.html
    output_html_path = "D:\\Download\\mock_email_preview.html"
    try:
        with open(output_html_path, "w", encoding="utf-8") as f:
            f.write(html_text)
        print(f"HTML email preview successfully written to: {output_html_path}")
    except Exception as e:
        print(f"Error writing HTML preview: {e}")

if __name__ == "__main__":
    main()
