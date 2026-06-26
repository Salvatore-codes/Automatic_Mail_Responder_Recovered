import os
import json
from src.database import Catalog

TENANTS_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tenants.json")

# Catalog instances cached by tenant ID
_CATALOG_CACHE = {}

def load_tenants():
    """
    Loads tenants from data/tenants.json.
    If the file does not exist or is empty, returns a default tenant dict.
    """
    default_tenant = {
        "name": os.environ.get("BUSINESS_NAME", "Trofeo Hardware"),
        "business_name": os.environ.get("BUSINESS_NAME", "Trofeo Solution"),
        "sales_executive_name": os.environ.get("SALES_EXECUTIVE_NAME", "Rajaram"),
        "sales_executive_title": os.environ.get("SALES_EXECUTIVE_TITLE", "Sales Executive"),
        "sales_executive_phone": os.environ.get("SALES_EXECUTIVE_PHONE", "+91 98765 43210"),
        "sales_executive_email": os.environ.get("SALES_EXECUTIVE_EMAIL", "sales@trofeosolution.com"),
        "master_email": os.environ.get("MASTER_EMAIL"),
        "email_user": os.environ.get("EMAIL_USER"),
        "email_pass": os.environ.get("EMAIL_PASS"),
        "imap_server": os.environ.get("IMAP_SERVER", "imap.gmail.com"),
        "imap_port": int(os.environ.get("IMAP_PORT", 993)) if os.environ.get("IMAP_PORT") else 993,
        "smtp_server": os.environ.get("SMTP_SERVER", "smtp.gmail.com"),
        "smtp_port": int(os.environ.get("SMTP_PORT", 465)) if os.environ.get("SMTP_PORT") else 465,
        "catalog_csv": os.path.join("data", "sku_catalog.csv"),
        "crm_json": os.path.join("data", "crm_customers.json"),
        "upi_id": os.environ.get("UPI_ID", "merchant@bank"),
        "upi_name": os.environ.get("UPI_MERCHANT_NAME", "TrofHardware"),
        "company_logo_path": os.environ.get("COMPANY_LOGO_PATH", "static/logo.png")
    }

    if os.path.exists(TENANTS_JSON_PATH):
        try:
            with open(TENANTS_JSON_PATH, 'r', encoding='utf-8') as f:
                tenants_data = json.load(f)
                if isinstance(tenants_data, dict) and tenants_data:
                    # Merge each tenant with fallback values to ensure all fields exist
                    merged = {}
                    for t_id, t_cfg in tenants_data.items():
                        cfg = default_tenant.copy()
                        cfg.update(t_cfg)
                        merged[t_id] = cfg
                    return merged
        except Exception as e:
            print(f"[Warning] Failed to load tenants.json: {e}")

    # Fallback to single default tenant from environment variables
    return {"default": default_tenant}

def sanitize_tenant_id(tenant_id):
    """
    Sanitizes tenant_id to prevent directory traversal or injection attacks.
    Only allows alphanumeric characters, underscores, and hyphens.
    """
    if not tenant_id:
        return "default"
    sanitized = "".join(c for c in str(tenant_id) if c.isalnum() or c in ("_", "-"))
    return sanitized or "default"

def get_tenant_config(tenant_id):
    t_id = sanitize_tenant_id(tenant_id)
    tenants = load_tenants()
    # Fallback to default if tenant_id doesn't exist
    return tenants.get(t_id, tenants.get("default"))

def get_tenant_catalog(tenant_id):
    """
    Gets or initializes the cached Catalog instance for a tenant.
    Detects if the catalog file on disk has changed and reloads it dynamically.
    """
    t_id = sanitize_tenant_id(tenant_id)
    config = get_tenant_config(t_id)
    csv_path = config.get("catalog_csv")
    project_root = os.path.dirname(os.path.dirname(__file__))
    
    # Resolve absolute path
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(project_root, csv_path)
        
    # Fallback to default catalog if tenant-specific catalog doesn't exist
    if not os.path.exists(csv_path):
        csv_path = os.path.join(project_root, "data", "sku_catalog.csv")
        
    # Get current file modification time
    mtime = os.path.getmtime(csv_path) if os.path.exists(csv_path) else 0.0
    
    if t_id not in _CATALOG_CACHE or _CATALOG_CACHE[t_id]["mtime"] != mtime:
        print(f"[Catalog Loader] Loading/Reloading catalog for tenant '{t_id}' (mtime changed to {mtime})")
        catalog = Catalog(csv_path, tenant_id=t_id)
        # Attempt to load disk-cached vector index if it matches the current CSV hash
        try:
            catalog.build_vector_index(client=None)
        except Exception as e:
            print(f"[Catalog Loader] Warning: Failed to load cached vector index: {e}")
            
        _CATALOG_CACHE[t_id] = {
            "catalog": catalog,
            "mtime": mtime
        }
        
    return _CATALOG_CACHE[t_id]["catalog"]

def list_tenants_public():
    """
    Returns a list of tenants with public metadata (no credentials or passwords)
    for the frontend tenant dropdown.
    """
    tenants = load_tenants()
    public_list = []
    for t_id, t_cfg in tenants.items():
        public_list.append({
            "id": t_id,
            "name": t_cfg.get("name") or t_cfg.get("business_name") or f"Tenant {t_id}"
        })
    return public_list
