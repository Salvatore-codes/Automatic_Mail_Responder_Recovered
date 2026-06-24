# Automated SKU Matcher & Quotation System (D-Drive Workspace)

This project contains a fully functional Python prototype, local presentation pages, and design documentation for an automated order-to-quotation engine designed for a hardware shop managing 10,000+ SKUs.

---

## 📂 Project Structure & Key Files

Click on the links below to view and work with the project files:

### ⚙️ Executable Code
*   **[run_demo.py](file:///D:/sku-matcher-prototype/run_demo.py)**: Interactive CLI simulation runner (triggers Ingestion, CRM discounts, ERP stock warnings, and HITL confirmations).
*   **[test_suite.py](file:///D:/sku-matcher-prototype/test_suite.py)**: Comprehensive programmatic diagnostic test suite validating the modules.
*   **[run_server.py](file:///D:/sku-matcher-prototype/run_server.py)**: Launches the FastAPI backend server on `http://127.0.0.1:8000`.
*   **[run_email_listener.py](file:///D:/sku-matcher-prototype/run_email_listener.py)**: Launches the background email listener service (polls IMAP/SMTP mailboxes or simulated folders).
*   **[configure_email.py](file:///D:/sku-matcher-prototype/configure_email.py)**: Interactive utility to configure, verify, and write mail settings to `.env`.

### 📦 Key Python Modules
*   **[src/server.py](file:///D:/sku-matcher-prototype/src/server.py)**: FastAPI server routing `/api/process`, `/api/hitl/confirm`, `/api/quote/generate`, and `/api/negotiate`.
*   **[src/email_listener.py](file:///D:/sku-matcher-prototype/src/email_listener.py)**: IMAP email fetcher and SMTP dispatcher (with SSL/STARTTLS and mock watcher modes).
*   **[src/pdf_generator.py](file:///D:/sku-matcher-prototype/src/pdf_generator.py)**: ReportLab canvas builder for itemized quotation PDFs (with scannable UPI/payment QRs and category groupings).
*   **[src/database.py](file:///D:/sku-matcher-prototype/src/database.py)**: The search engine containing fuzzy spelling logic, local TF-IDF semantic searches, and synonym caches.
*   **[src/scenario_free.py](file:///D:/sku-matcher-prototype/src/scenario_free.py)**: Rules-extractor and fuzzy matcher (Scenario A).
*   **[src/scenario_hybrid.py](file:///D:/sku-matcher-prototype/src/scenario_hybrid.py)**: LLM structural parser and vector embeddings encoder (Scenario B).
*   **[src/negotiator.py](file:///D:/sku-matcher-prototype/src/negotiator.py)**: AI agent rules engine to handle discount bargaining.

### 📊 Databases & Input Data
*   **[data/sku_catalog.csv](file:///D:/sku-matcher-prototype/data/sku_catalog.csv)**: Catalog of 63 mock items with pricing and inventory stock levels.
*   **[data/crm_customers.json](file:///D:/sku-matcher-prototype/data/crm_customers.json)**: Client profile database containing email contact records and wholesale discount tiers.
*   **[data/synonyms.json](file:///D:/sku-matcher-prototype/data/synonyms.json)**: The local feedback memory storage (dynamically updated by operator overrides).

### 📁 Ingestion Simulation Folders
*   **[mock_inbox/](file:///D:/sku-matcher-prototype/mock_inbox)**: Place order request `.txt` files here when running in offline simulation mode.
*   **[mock_outbox/](file:///D:/sku-matcher-prototype/mock_outbox)**: Auto-generated replies and PDF quotations will be saved here in offline simulation mode.

---

## 🚀 How to Run the System

### 1. Configure Live Email (Optional)
To link the system to a real email address (e.g. Gmail or Outlook) and receive automated PDF quotes in your real inbox:
```powershell
& "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe" configure_email.py
```
*Follow the interactive prompts to verify the IMAP/SMTP server connection and generate your `.env` configuration file.*

### 2. Start the FastAPI Backend & Dashboard
Start the web server to host the APIs and frontend user interface:
```powershell
& "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe" run_server.py
```
*Open your browser and navigate to: **🔗 http://127.0.0.1:8000***

### 3. Start the Email Listener Service
Start the poller in another shell window to process incoming orders:
```powershell
& "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe" run_email_listener.py
```
*If a `.env` file exists with credentials, it connects live to the server. If not, it falls back to watching the `mock_inbox/` folder for local `.txt` order files.*

### 4. Run the Test Suite
To verify the engine:
```powershell
& "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe" test_suite.py
```

---

## 🧠 Conversation History & Resuming Context

If you or another AI assistant want to resume this project, you can refer to the historical design log.

*   **Conversation ID:** `bbc14088-3783-4ea2-9497-d5d60699b496`
*   **Full Conversation Transcript:** [transcript.jsonl](file:///C:/Users/Admin/.gemini/antigravity-ide/brain/bbc14088-3783-4ea2-9497-d5d60699b496/.system_generated/logs/transcript.jsonl)
*   **Active Walkthrough Log:** [walkthrough.md](file:///C:/Users/Admin/.gemini/antigravity-ide/brain/bbc14088-3783-4ea2-9497-d5d60699b496/walkthrough.md)
