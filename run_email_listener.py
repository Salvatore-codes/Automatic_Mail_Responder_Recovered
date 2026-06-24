import os
import sys
import time
from dotenv import load_dotenv

# Load configurations
load_dotenv()

from src.database import Catalog
from src.email_listener import poll_email_inbox

def main():
    print("=" * 80)
    print("                TROFEO HARDWARE AUTOMATED EMAIL LISTENER SERVICE")
    print("=" * 80)

    project_root = os.path.dirname(__file__)
    catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
    crm_path = os.path.join(project_root, "data", "crm_customers.json")
    
    try:
        catalog = Catalog(catalog_path)
        print(f"[System] Catalog loaded: {len(catalog.skus)} SKUs in database.")
    except Exception as e:
        print(f"[Error] Failed to load catalog: {e}")
        sys.exit(1)

    # Check mode
    email_user = os.environ.get("EMAIL_USER")
    email_pass = os.environ.get("EMAIL_PASS")
    
    mode = "mock"
    if email_user and email_pass and email_user.strip() != "" and not email_user.startswith("your_"):
        mode = "live"
        print(f"[Mode] LIVE Email Poller running (listening to inbox: {email_user}).")
    else:
        print("[Mode] SIMULATION / MOCK Mailbox watcher running.")
        print(f"       Place mock order .txt files in:  D:\\sku-matcher-prototype\\mock_inbox\\")
        print(f"       Parsed quotes & replies saved to: D:\\sku-matcher-prototype\\mock_outbox\\")
        
        # Ensure directories exist
        os.makedirs(os.path.join(project_root, "mock_inbox"), exist_ok=True)
        os.makedirs(os.path.join(project_root, "mock_outbox"), exist_ok=True)

    print("\nStarting listener loop. Press Ctrl+C to stop.")
    print("-" * 80)
    
    try:
        while True:
            poll_email_inbox(catalog, crm_path, mode=mode)
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[System] Email Listener service terminated by operator.")

if __name__ == "__main__":
    main()
