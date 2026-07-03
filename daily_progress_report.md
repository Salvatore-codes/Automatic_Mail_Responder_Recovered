# Daily Progress Report — June 25, 2026

This document provides a structured summary of all system modifications completed today and the remaining planned items for the automated SKU matcher, quotation engine, and email poller.

---

## ✅ Completed Today

### 1. Multi-Tenant Architecture Foundation
* **Tenant Config Manager (`src/tenants.py`):** Added dynamic loading from `data/tenants.json` with automatic fallback to environment settings (`.env`) for the `"default"` tenant. Caches `Catalog` objects per tenant.
* **Database Path Isolation (`src/database_sqlite.py`):** Re-routed SQLite connections dynamically to `data/sales_<tenant_id>.db` based on the context. Created an on-demand database schema initialization mechanism.
* **Synonym & CRM Isolation (`src/database.py`, `src/email_listener.py`):** Coded synonym read/write and CRM client profiling to query tenant-specific databases and CSV/JSON datasets.

### 2. Multi-Tenant API & Frontend Dashboards
* **FastAPI Server Endpoints (`src/server.py`):** Adapted `/api/process`, `/api/hitl/confirm`, `/api/quote/generate`, `/api/quote/pdf/{invoice_id}`, `/api/negotiate`, `/api/report/data`, `/api/report/send_pdf`, and `/api/unmatched` to accept and process the `tenant_id` context. Added `GET /api/tenants` metadata endpoint.
* **Index Dashboard (`static/index.html`):** Integrated `#tenantSelect` selector dropdown in the header, saved selections in `localStorage`, and modified post/get requests to include the `tenant_id`.
* **Live Report Page (`static/report.html`):** Integrated identical dropdown synchronised with `localStorage` and appended `?tenant_id=...` parameters on database stats query, report PDF generation, and download calls.

### 3. Concurrency, Security, & Robustness Pitfalls Fixed
* **Directory Traversal Security:** Filtered the `tenant_id` using `sanitize_tenant_id` (allowing only alphanumeric, hyphens, and underscores) and added strict alphanumeric validation to `invoice_id` parameters in server file-system paths.
* **SQLite Connection Lockups:** Configured connection timeouts of **30 seconds** and enabled **Write-Ahead Logging (WAL)** mode for all databases in the connection manager.
* **CRM Fallback:** Added check logic to load `crm_customers.json` from fallback when a tenant's custom CRM path is missing.
* **Poller Performance Tuning:** Decreased IMAP IDLE socket select timeout from 10 seconds to **2 seconds** in the listener, speeding up the sequential loop over multiple active tenants.
* **DB Connection Manager Alignment:** Modified `src/daily_report_pdf.py` to route queries via the standard `get_connection()` method to inherit these WAL and timeout protections.
* **Expanded SKU ID Parsing & Conversational Filtering:** Updated `src/database.py` and `src/scenario_free.py` to support custom quantity units (e.g. `count`, `nos`, `qty`), automatically match queries containing exact SKU IDs (ignoring dashes and casing), and ignore conversational lines (e.g. "Remove all the quantities...", "provide me with 15...") to avoid generating false unmatched product alerts.

### 5. Conditional Stock-Based Capping, PO Alerts, and Customer Notices
* **Conditional Stock-Capping Resolution:** Implemented logic to differentiate capping behavior:
  * **Attachment + Body Product Overrides:** Quoted requested quantity (no capping).
  * **Attachment ONLY (No Body Overrides):** Capped quoted quantity to on-hand stock (`cap_by_stock=True`).
  * **Plain Text Orders:** Avoided capping by default (keeping legacy test behaviors intact).
* **Deficit PO Alerts to Master:** Sends email notifications to the master user when stock capping occurs, listing item deficits for PO generation. Fixed a pitfall where these alerts were erroneously sent even when stock capping was disabled.
* **Customer Capping Notice:** Appends an inventory update note to the customer's quote reply indicating that on-hand quantity was quoted and the remaining quantity will be delivered after inventory is updated. Fixed a pitfall where this note was appended even when stock capping was disabled (resulting in the full override quantity being quoted).
* **Standardized Stock Labels:** Updated zero stock labels to `"Currently Unavailable"` (matching system tests) instead of `"OUT OF STOCK"`.
* **Global Quantity Override Extraction:** Implemented `extract_global_quantity_override()` to detect global override phrases in email body text (e.g. `"provide me with 15 quantities respectively"` or `"quote 15 of each"`), set `cap_by_stock=False` to bypass capping, and automatically override matched item quantities to the requested override value.
* **Float and Unit Parser Expansion:** Upgraded `parse_order_text_rules()` to support decimal quantities (e.g. `10.5`) and recognize new units like `mts`, `meters`, `mtrs` and `count`. This resolves failures where quantities ending with these units defaulted to `1`.

### 6. Email Relevance & Spam/Bounce Filtering
* **Automated/System Sender Blocklist:** Added strict checks to immediately discard emails from system addresses, daemons, or services (e.g. `mailer-daemon`, `postmaster`, `bounce`, `noreply`, `no-reply`, etc.).
* **Display Name Check:** Filters out known automated systems or non-hardware-enquiry display names (e.g. `Mail Delivery Subsystem`, `Mindvalley`, `Apollo`, `Odoo`, `GitHub`, `Google`, `Slack`, etc.) to prevent replying to promotions, newsletter updates, or system bounces.
* **Subject-Based Filters:** Added subject filters to discard bounce errors (e.g. `delivery status`, `undeliverable`, `returned mail`), calendar/vacation responses (`out of office`, `auto-reply`), receipts (`invoice paid`, `payment receipt`), and account actions (`verification code`, `otp`).
* **Strict Hardware Request Validation**: Requires new, unregistered customers (non-CRM senders who are not part of an active quotation thread) to have either a catalog SKU ID in the body/subject OR a hardware product keyword accompanied by a quantity request pattern in order to be processed. This stops the bot from responding to random conversational or non-materials emails.

### 7. Verification & Validation
* **Multi-Tenant Validation (`test_multi_tenant.py`):** Verified database isolation, folder isolation, and dynamic email signature mapping. All **14/14 checks passed**.
* **Smoke Tests (`test_new_features.py`):** Verified unmatched items logging and relevance checking. All **12/12 checks passed**.
* **Comprehensive Test Suite (`run_automated_tests.py`):** Executed the 23 system integration tests. All **23/23 tests passed**.

---

## 📅 Next Steps & Planned Tasks for Today

If you wish to continue customizing or testing the system today, here are the proposed steps:

### 1. Configure Custom Live Tenant Credentials (Optional)
If you want to test live email scanning for multiple tenants:
* Define tenant credentials in `data/tenants.json`:
  ```json
  {
    "tenant_a": {
      "name": "Tenant A Tools",
      "business_name": "Tenant A Solutions Ltd",
      "email_user": "alice@tenanta.com",
      "email_pass": "app_password_here",
      "imap_server": "imap.gmail.com",
      "smtp_server": "smtp.gmail.com",
      "catalog_csv": "data/sku_catalog_a.csv",
      "crm_json": "data/crm_customers_a.json"
    }
  }
  ```

### 2. Verify Live Dashboard Interactions
* Keep the FastAPI server and Background Email Listener running concurrently:
  * Server: `python run_server.py`
  * Listener: `python run_email_listener.py`
* Open the browser and test switching between tenants on both `/` and `/report` dashboards.
