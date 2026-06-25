# Walkthrough — Multi-Tenant Capability Implementation

We have successfully implemented and verified all components of the multi-tenant architecture for the **Trofeo Hardware Automated SKU Matcher & Quotation Engine**.

---

## 🛠️ Summary of Changes Made

### 1. Tenant Configuration Manager
* **File:** [tenants.py](file:///D:/sku-matcher-prototype/src/tenants.py) [NEW]
* **Features:**
  * Implemented `load_tenants()` to load tenant definitions from `data/tenants.json`, merging individual custom configurations with default fallback settings resolved from the environment variables (`.env`).
  * Implemented `get_tenant_config(tenant_id)` to resolve dynamic configuration variables for each tenant.
  * Implemented `get_tenant_catalog(tenant_id)` to initialize and cache the parsed CSV `Catalog` structure per tenant.
  * Implemented `list_tenants_public()` to expose non-sensitive metadata (IDs and business names) to the front-end.

### 2. Database Isolation Per Tenant
* **File:** [database_sqlite.py](file:///D:/sku-matcher-prototype/src/database_sqlite.py) [MODIFY]
* **Features:**
  * Updated connection logic (`get_connection(tenant_id)`) to route database read/write requests dynamically:
    * **Default/None:** `data/trofeo_sales.db` (preserving backward compatibility)
    * **Tenant ID:** `data/sales_<tenant_id>.db`
  * Implemented thread-safe, on-demand table initialization (`init_db_conn`) the first time any tenant's database is accessed.
  * Added `tenant_id` parameters to all DB operations (such as quotation logging, synonym registration, processed message logs, and unmatched items lookup).

### 3. Synonym Registration & Catalog Isolation
* **File:** [database.py](file:///D:/sku-matcher-prototype/src/database.py) [MODIFY]
* **Features:**
  * Modified `Catalog.__init__` to accept `tenant_id`.
  * Updated `load_synonyms()` and `register_synonym()` to load from/write to the database connection specific to the tenant.

### 4. Background Email Listener Updates
* **Files:**
  * [email_listener.py](file:///D:/sku-matcher-prototype/src/email_listener.py) [MODIFY]
  * [run_email_listener.py](file:///D:/sku-matcher-prototype/run_email_listener.py) [MODIFY]
* **Features:**
  * Upgraded `process_incoming_email` and `poll_email_inbox` to take an optional `tenant_id` parameter.
  * Replaced the use of single global environment variables in SMTP, IMAP, sales signatures, logo paths, and UPI links with tenant-specific dynamically resolved configs.
  * Separated mock inboxes and outboxes under isolated directory structures: `mock_inbox/<tenant_id>/` and `mock_outbox/<tenant_id>/`.
  * Updated the polling runner `run_email_listener.py` loop to iterate through each tenant in sequence, reload settings on the fly, and poll them.

### 5. Multi-Tenant FastAPI Server Routing
* **File:** [server.py](file:///D:/sku-matcher-prototype/src/server.py) [MODIFY]
* **Features:**
  * Added `GET /api/tenants` public listing endpoint.
  * Updated `POST /api/process`, `POST /api/hitl/confirm`, `POST /api/quote/generate`, `GET /api/quote/pdf/{invoice_id}`, `POST /api/negotiate`, `GET /api/report/data`, `POST /api/report/send_pdf`, and `GET /api/unmatched` to accept `tenant_id` (either in the request body JSON or as a query parameter).
  * Dynamically queries the correct database and uses the correct configuration settings matching the requested `tenant_id`.

### 6. Frontend Dashboard & Live Report Selector Dropdowns
* **Files:**
  * [index.html](file:///D:/sku-matcher-prototype/static/index.html) [MODIFY]
  * [report.html](file:///D:/sku-matcher-prototype/static/report.html) [MODIFY]
* **Features:**
  * Integrated a premium-styled tenant dropdown selector (`#tenantSelect`) in both the tester dashboard and the live report headers.
  * Implemented automatic fetching of public tenant lists to populate the dropdown.
  * Persists user choice in `localStorage` (`'selected_tenant'`) to synchronize the selected tenant state across dashboard and report pages.
  * Dynamically appends `tenant_id` to all backend queries and JSON post payloads.

### 7. Stock-Based Capping, Purchase Order Alerts, and Customer Notices
* **Files:**
  * [email_listener.py](file:///D:/sku-matcher-prototype/src/email_listener.py) [MODIFY]
  * [server.py](file:///D:/sku-matcher-prototype/src/server.py) [MODIFY]
* **Features:**
  * **Dynamic Stock-Capping Resolution:** Updated logic to dynamically determine when to cap quantities based on available stock.
    * **Attachment + Body Product Info:** Quotes the full quantity requested by the customer (no capping).
    * **Attachment ONLY (No Body Product Info):** Caps the quoted quantities to the available on-hand stock (`cap_by_stock=True`).
    * **Plain Text Orders (No Attachment):** Skips capping by default (keeping legacy test behaviors intact).
  * **Purchase Order (PO) Alerts for Master:** When capping is triggered and a stock deficit occurs, an automated email notification is sent to the master user containing the details of the items, requested vs. on-hand quantities, and the deficit count so a PO can be generated. (Fixed pitfall: Only sent when `cap_by_stock=True` is active).
  * **Customer Deficit Notice:** When quantities are capped, a warning note is dynamically added to both the plain-text and HTML email replies indicating that on-hand stock was quoted, and the rest will be quoted and delivered once the inventory is updated. (Fixed pitfall: Only appended when `cap_by_stock=True` is active).
  * **Stock Status Representation:** Standardized unavailable item indicators to `"Currently Unavailable"` (matching system tests) rather than `"OUT OF STOCK"`.
  * **Global Quantity Override Extraction:** Implemented `extract_global_quantity_override()` to detect global override phrases in email body text (e.g. `"provide me with 15 quantities respectively"` or `"quote 15 of each"`), bypass stock capping (`cap_by_stock=False`), and automatically override matched item quantities to the requested override value.
  * **Float and Unit Parser Expansion:** Upgraded `parse_order_text_rules()` to support decimal quantities (e.g. `10.5`) and recognize new units like `mts`, `meters`, `mtrs` and `count`. This resolves failures where quantities ending with these units defaulted to `1`.

### 8. Spam, Bounce, and Irrelevant Email Filtering
* **File:** [email_listener.py](file:///D:/sku-matcher-prototype/src/email_listener.py) [MODIFY]
* **Features:**
  * **Automated/System Senders Blocklist:** Rejects emails immediately if the sender's address contains keywords like `mailer-daemon`, `daemon`, `postmaster`, `bounce`, `noreply`, `newsletter`, `updates`, `billing`, etc. (unless the sender is in the CRM).
  * **Display Name Check:** Discards emails where the sender's display name matches known automated systems, newsletters, or non-hardware entities (e.g. `Mail Delivery Subsystem`, `Mindvalley`, `Apollo`, `Odoo`, `GitHub`, `Google`, etc.).
  * **Automated Subject blocklist:** Blocks common automated/bounce email subjects (e.g., `delivery status`, `undeliverable`, `returned mail`, `bounce`, `failure notice`, `out of office`, `auto-reply`, `payment receipt`, `otp`, `verification code`).
  * **Strict Enquiry Signature Check for New Senders:** Requires unregistered customers (who are not in the CRM and not replying to an active thread) to have either an exact catalog SKU ID in the body/subject OR a hardware keyword and a clear quantity pattern (e.g., `10 x`, `5 count`) in the text. This prevents the bot from auto-responding to random promotional or conversational emails.

### 9. Organized Sequential Quotation Numbering
* **Files:**
  * [email_listener.py](file:///D:/sku-matcher-prototype/src/email_listener.py) [MODIFY]
  * [database_sqlite.py](file:///D:/sku-matcher-prototype/src/database_sqlite.py) [PRE-EXISTING FUNCTION ACTIVATED]
* **Problem Fixed:** Quotation numbers were previously generated using `int(time.time()) % 100000`, which produced seemingly random 5-digit numbers (e.g. `79740`, `79549`).
* **Solution:** The `generate_next_invoice_id(tenant_id)` function in `database_sqlite.py` queries the highest existing `QTN-` prefixed number in the quotations table and returns the next increment.
* **Format:** `QTN-XXXXX` (zero-padded 5 digits) — e.g., `QTN-00001`, `QTN-00002`, `QTN-00003`, ...
* **Tenant-Aware:** Each tenant maintains its own sequential counter, isolated in its own database file.
* **Example:** The very next email enquiry received will generate quotation `QTN-00001`, followed by `QTN-00002`, ensuring a clean, traceable audit trail.

---

## 🔒 Security & Concurrency Enhancements (Pitfalls Resolved)

1. **Security (Directory Traversal Protection):**
   * Added `sanitize_tenant_id()` helper to sanitize user-provided `tenant_id` parameter to only alphanumeric characters, underscores, and hyphens. This prevents potential path traversal attacks (e.g. `../../`) in database queries or PDF file system paths.
   * Added strict alphanumeric checking for `invoice_id` parameters in `/api/quote/generate` and `/api/quote/pdf/{invoice_id}` paths.

2. **Concurrency (SQLite Performance Tuning):**
   * Configured SQLite to run in **Write-Ahead Logging (WAL)** mode. This permits concurrent reading by FastAPI endpoints while a write lock is active.
   * Increased the SQLite connection timeout to **30 seconds** in `get_connection()` to completely avoid `database is locked` OperationalErrors.

3. **CRM Fallback Robustness:**
   * Updated CRM loading logic in both FastAPI server endpoints and background email listener processing loops. If the custom CRM file path is invalid or missing, it gracefully falls back to the default `crm_customers.json`.

4. **Multi-tenant Loop Performance:**
   * Reduced the IMAP IDLE select timeout wait from 10 seconds to **2 seconds**. This prevents blocking the main listener thread for long durations when cycling through multiple active live tenants.

---

## 🧪 Verification and Test Results

### 1. Integrated System Verification Tests
We ran a dedicated test suite verifying multi-tenancy across database tables, configs, folders, and signatures.
* **Command:** `C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe test_multi_tenant.py`
* **Result:** **14/14 PASSED ✅**
  * Checked configurations dynamic loading and schema initialization.
  * Asserted database file isolation: verified that inserting record into `tenant_a` did not contaminate `tenant_b`.
  * Verified mock inbox and outbox folder isolation.
  * Verified that generated emails and documents are signed off by the correct executive of the specific tenant (e.g., `Alice Manager` for `tenant_a` vs `Bob Executive` for `tenant_b`).

### 2. Core Regression Tests
* ** targeted smoke tests (`test_new_features.py`):** **12/12 PASSED ✅**
* ** Comprehensive prototype diagnostics (`test_suite.py`):** **ALL PASSED ✅**

---

## 🚀 Running the Services

To start the multi-tenant platform:
1. **FastAPI Web Server:**
   ```bash
   C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe run_server.py
   ```
2. **Background Email Listener:**
   ```bash
   C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe run_email_listener.py
   ```
