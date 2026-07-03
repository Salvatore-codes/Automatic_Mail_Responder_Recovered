import os
import sys
import time

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

class TeeLogger(object):
    def __init__(self, log_file_path, stream):
        self.log_file = open(log_file_path, "a", encoding="utf-8", buffering=1)
        self.stream = stream

    def write(self, message):
        self.stream.write(message)
        self.log_file.write(message)

    def flush(self):
        self.stream.flush()
        self.log_file.flush()

# Truncate logs if size > 5MB
project_root = os.path.dirname(os.path.abspath(__file__))
log_dir = os.path.join(project_root, "data")
os.makedirs(log_dir, exist_ok=True)
log_file_path = os.path.join(log_dir, "email_listener.log")

if os.path.exists(log_file_path) and os.path.getsize(log_file_path) > 5 * 1024 * 1024:
    try:
        with open(log_file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        with open(log_file_path, "w", encoding="utf-8") as f:
            f.writelines(lines[-1000:])
    except Exception:
        try:
            os.remove(log_file_path)
        except Exception:
            pass

sys.stdout = TeeLogger(log_file_path, sys.stdout)
sys.stderr = TeeLogger(log_file_path, sys.stderr)

from dotenv import load_dotenv
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
            # Reload environment from .env on every cycle so changes to .env are picked up live
            load_dotenv(override=True)
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
                    is_placeholder_user = not email_user or email_user.startswith("your_") or "your_store_email" in email_user
                    is_placeholder_pass = not email_pass or "YOUR_" in email_pass or "your_" in email_pass or "<" in email_pass or "app_password" in email_pass
                    outlook_secret = tenant_config.get("outlook_client_secret")
                    
                    if (email_user and email_pass and not is_placeholder_user and not is_placeholder_pass) or (email_user and outlook_secret and not is_placeholder_user):
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
