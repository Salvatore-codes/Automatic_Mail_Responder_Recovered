import os
import sys
import time

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

from dotenv import load_dotenv

# Load configurations
load_dotenv()

from src.tenants import load_tenants, get_tenant_catalog
from src.email_listener import poll_email_inbox

def main():
    print("=" * 80)
    print("                TROFEO HARDWARE AUTOMATED MULTI-TENANT EMAIL LISTENER")
    print("=" * 80)

    print("\nStarting listener loop. Press Ctrl+C to stop.")
    print("-" * 80)
    
    try:
        while True:
            # Reload tenants dynamically on every cycle so changes to tenants.json are picked up live
            tenants = load_tenants()
            
            for tenant_id, tenant_config in tenants.items():
                name = tenant_config.get("name") or tenant_config.get("business_name") or f"Tenant {tenant_id}"
                
                try:
                    catalog = get_tenant_catalog(tenant_id)
                    crm_path = tenant_config.get("crm_json")
                    
                    email_user = tenant_config.get("email_user")
                    email_pass = tenant_config.get("email_pass")
                    
                    mode = "mock"
                    if email_user and email_pass and email_user.strip() != "" and not email_user.startswith("your_"):
                        mode = "live"
                        print(f"[Poller] Tenant: {tenant_id} ({name}) - LIVE Email Poller running (Inbox: {email_user})")
                    else:
                        print(f"[Poller] Tenant: {tenant_id} ({name}) - SIMULATION / MOCK watcher running.")
                    
                    poll_email_inbox(catalog, crm_path, mode=mode, tenant_id=tenant_id)
                except Exception as ex:
                    print(f"[Error] Failed to process cycle for tenant {tenant_id}: {ex}")
            
            # Brief sleep between polling cycles
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n[System] Email Listener service terminated by operator.")

if __name__ == "__main__":
    main()
