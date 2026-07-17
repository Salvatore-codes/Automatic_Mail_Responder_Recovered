import os
import json
from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(project_root, ".env"))

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
        "outlook_tenant_id": os.environ.get("OUTLOOK_TENANT_ID"),
        "outlook_client_id": os.environ.get("OUTLOOK_CLIENT_ID"),
        "outlook_client_secret": os.environ.get("OUTLOOK_CLIENT_SECRET"),
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
    config = tenants.get(t_id, tenants.get("default")).copy()
    
    try:
        from src.database_sqlite import get_active_vertical
        active_vertical = get_active_vertical(t_id)
        if active_vertical:
            config["name"] = active_vertical.get("name", config.get("name"))
            config["business_name"] = active_vertical.get("name", config.get("business_name"))
            config["catalog_csv"] = active_vertical.get("catalog_path", config.get("catalog_csv"))
            config["crm_json"] = active_vertical.get("crm_path", config.get("crm_json"))
            config["catalog_type"] = active_vertical.get("catalog_type", "csv")
            config["catalog_connection_string"] = active_vertical.get("catalog_connection_string", active_vertical.get("catalog_path"))
            config["catalog_extra_config"] = active_vertical.get("catalog_extra_config", "")
            
        # Merge email responder settings from database key-value settings store
        from src.database_sqlite import get_setting
        for key in ["email_user", "email_pass", "imap_server", "imap_port", "smtp_server", "smtp_port", 
                    "outlook_tenant_id", "outlook_client_id", "outlook_client_secret"]:
            db_val = get_setting(key, None, t_id)
            if db_val is not None and str(db_val).strip() != "":
                if key in ("imap_port", "smtp_port"):
                    try:
                        config[key] = int(db_val)
                    except ValueError:
                        pass
                else:
                    config[key] = str(db_val).strip()
    except Exception as e:
        print(f"[Warning] Failed to merge active vertical config: {e}")
        
    return config

def get_tenant_catalog(tenant_id):
    """
    Gets or initializes the cached Catalog instance for a tenant.
    Resolves the appropriate connector (CSV, Excel, or SQL) dynamically.
    """
    t_id = sanitize_tenant_id(tenant_id)
    config = get_tenant_config(t_id)
    
    ctype = config.get("catalog_type", "csv")
    conn_str = config.get("catalog_connection_string") or config.get("catalog_csv")
    extra_str = config.get("catalog_extra_config", "")
    
    import json
    import time
    extra = {}
    if extra_str:
        try:
            extra = json.loads(extra_str)
        except Exception:
            pass
            
    project_root = os.path.dirname(os.path.dirname(__file__))
    if ctype in ("csv", "excel"):
        if conn_str and not os.path.isabs(conn_str):
            conn_str = os.path.join(project_root, conn_str)
        if not conn_str or not os.path.exists(conn_str):
            conn_str = os.path.join(project_root, "data", "sku_catalog.csv")
            ctype = "csv"
            
    if ctype in ("csv", "excel") and os.path.exists(conn_str):
        mtime = os.path.getmtime(conn_str)
    else:
        # DB sources cache TTL: 30 seconds
        mtime = time.time() // 30
        
    cache_key = f"{t_id}:{ctype}:{conn_str}"
    
    if cache_key not in _CATALOG_CACHE or _CATALOG_CACHE[cache_key]["mtime"] != mtime:
        print(f"[Catalog Loader] Instantiating connector '{ctype}' for tenant '{t_id}' (source: {conn_str})")
        from src.database import CSVConnector, ExcelConnector, SQLDatabaseConnector
        if ctype == "excel":
            connector = ExcelConnector(conn_str, sheet_name=extra.get("sheet_name", "Sheet1"))
        elif ctype == "sql":
            connector = SQLDatabaseConnector(conn_str, table_name=extra.get("table_name", "sku_catalog"))
        else:
            connector = CSVConnector(conn_str)
            
        catalog = Catalog(connector, tenant_id=t_id)
        try:
            catalog.build_vector_index(client=None)
        except Exception as e:
            print(f"[Catalog Loader] Warning: Failed to build vector index: {e}")
            
        _CATALOG_CACHE[cache_key] = {
            "catalog": catalog,
            "mtime": mtime
        }
        
    return _CATALOG_CACHE[cache_key]["catalog"]

def list_tenants_public():
    """
    Returns a list of tenants with public metadata (no credentials or passwords)
    for the frontend tenant dropdown.
    """
    try:
        from src.database_sqlite import get_all_verticals
        verticals = get_all_verticals("default")
        if verticals:
            public_list = []
            for v in verticals:
                # Map specific user requested names
                name = v.get("name") or ""
                v_id = v.get("id")
                if v_id == "hardware":
                    name = "Trofeo Solution Hardware"
                elif v_id == "dhanya_facility_management_services":
                    name = "Dhanya Consulting Services"
                
                # Filter out the placeholder 'not_provided' vertical to avoid clutter
                if v_id == "not_provided":
                    continue
                    
                public_list.append({
                    "id": v_id,
                    "name": name,
                    "is_active": v.get("is_active") == 1
                })
            return public_list
    except Exception as e:
        print(f"[Warning] Failed to list verticals for tenants dropdown: {e}")

    tenants = load_tenants()
    public_list = []
    for t_id, t_cfg in tenants.items():
        public_list.append({
            "id": t_id,
            "name": t_cfg.get("name") or t_cfg.get("business_name") or f"Tenant {t_id}"
        })
    return public_list
