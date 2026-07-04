import os
from dotenv import load_dotenv
load_dotenv()
import time
import json
import random
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

from google import genai
from src.tenants import get_tenant_catalog, get_tenant_config, list_tenants_public
from src.scenario_free import run_scenario_free
from src.scenario_hybrid import run_scenario_hybrid
from src.pdf_generator import generate_pdf_quotation
from src.negotiator import run_negotiation_step

# 1. Initialize FastAPI app
app = FastAPI(title="Trofeo Hardware Automated SKU Matcher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths setup
project_root = os.path.dirname(os.path.dirname(__file__))
static_dir = os.path.join(project_root, "static")
quotes_dir = os.path.join(static_dir, "quotes")

# Ensure static and quotes directory exist
os.makedirs(quotes_dir, exist_ok=True)

# Pydantic schemas
class ProcessRequest(BaseModel):
    text: str
    engine: str  # "A" or "B"
    customer_email: str
    input_type: str  # "email", "whatsapp", "custom"
    tenant_id: str = "default"

class ConfirmRequest(BaseModel):
    query: str
    sku_id: str
    tenant_id: str = "default"

class PDFRequest(BaseModel):
    matched_lines: List[Dict[str, Any]]
    discount_pct: float
    customer_name: str
    invoice_id: str
    source: str = "custom"
    original_text: str = ""
    tenant_id: str = "default"

class NegotiateRequest(BaseModel):
    customer_message: str
    requested_discount: float
    chat_history: List[Dict[str, str]]
    tenant_id: str = "default"

class DeficitResolveRequest(BaseModel):
    deficit_id: int
    new_stock: int
    tenant_id: str = "default"

class NegotiationResolveRequest(BaseModel):
    invoice_id: str
    action: str  # "approve", "reject", or "counter"
    override_discount_pct: float = 0.0  # used only for "approve" or "counter"
    tenant_id: str = "default"
    item_discount_mode: str = "order"  # "order", "item_pct", or "item_rate"
    target_sku_id: str = ""
    item_discount_value: float = 0.0

class InventoryUpdateRequest(BaseModel):
    sku_id: str
    new_stock: int
    tenant_id: str = "default"

# Helper: Load CRM Customers for a specific tenant
def load_tenant_crm_customers(tenant_id):
    tenant_config = get_tenant_config(tenant_id)
    crm_p = tenant_config.get("crm_json")
    if crm_p:
        if not os.path.isabs(crm_p):
            crm_p = os.path.join(project_root, crm_p)
        if not os.path.exists(crm_p):
            crm_p = os.path.join(project_root, "data", "crm_customers.json")
    else:
        crm_p = os.path.join(project_root, "data", "crm_customers.json")
        
    if os.path.exists(crm_p):
        try:
            with open(crm_p, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

# Tenant Metadata listing endpoint
@app.get("/api/tenants")
async def get_tenants():
    return list_tenants_public()

# Webhook simulation / API Ingestion endpoint
@app.post("/api/process")
async def process_order(req: ProcessRequest):
    start_time = time.time()
    
    # 1. CRM Lookup
    customers = load_tenant_crm_customers(req.tenant_id)
    cust_profile = customers.get(req.customer_email, {"name": "Walk-in Retail Client", "tier": "retail", "discount": 0.0})
    
    # Get tenant specific Catalog
    catalog = get_tenant_catalog(req.tenant_id)
    
    # 2. Run Matcher Pipeline
    matched_lines = []
    
    if req.engine == "A":
        # Scenario A (Free Fuzzy)
        matched_lines = run_scenario_free(req.text, catalog)
    else:
        # Scenario B (Paid AI Hybrid)
        matched_lines = run_scenario_hybrid(req.text, catalog, input_type=req.input_type)
        
    search_time = time.time() - start_time
    
    # Calculate pipeline costs
    cost = 0.0014 if req.engine == "B" else 0.0
    
    return {
        "matched_lines": matched_lines,
        "discount_pct": cust_profile["discount"],
        "customer_name": cust_profile["name"],
        "metrics": {
            "parsed_count": len(matched_lines),
            "search_time_sec": round(search_time, 4),
            "cost_usd": cost
        }
    }

# Human-in-the-Loop Override Endpoint
@app.post("/api/hitl/confirm")
async def confirm_hitl_override(req: ConfirmRequest):
    try:
        catalog = get_tenant_catalog(req.tenant_id)
        catalog.register_synonym(req.query, req.sku_id)
        return {"status": "SUCCESS", "message": f"Synonym registered: '{req.query}' -> {req.sku_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# PDF Quotation Generation Endpoint
@app.post("/api/quote/generate")
async def generate_quote_pdf(req: PDFRequest):
    if not req.matched_lines:
        raise HTTPException(status_code=400, detail="Cannot generate quotation with 0 items.")
    
    from src.tenants import sanitize_tenant_id
    t_id = sanitize_tenant_id(req.tenant_id)
    safe_inv_id = "".join(c for c in str(req.invoice_id) if c.isalnum() or c in ("_", "-"))
    if not safe_inv_id:
        raise HTTPException(status_code=400, detail="Invalid Invoice ID.")
        
    filename = f"Quote_{safe_inv_id}.pdf"
    
    # Isolate PDF path per tenant
    if t_id and t_id != "default":
        pdf_subdir = os.path.join(quotes_dir, t_id)
    else:
        pdf_subdir = quotes_dir
    os.makedirs(pdf_subdir, exist_ok=True)
    pdf_path = os.path.join(pdf_subdir, filename)
    
    try:
        # Lookup customer phone and email from tenant CRM if possible
        customers = load_tenant_crm_customers(req.tenant_id)
        cust_phone = "—"
        cust_email = "walkin_retail@guest.com"
        for email_key, profile in customers.items():
            if profile.get("name") == req.customer_name:
                cust_phone = profile.get("phone", "—")
                cust_email = email_key
                break

        tenant_config = get_tenant_config(req.tenant_id)
        catalog = get_tenant_catalog(req.tenant_id)

        # Cap quantities based on on-hand stock and track deficits
        from src.email_listener import adjust_quantities_by_stock, send_deficit_purchase_order_alert
        deficit_lines = adjust_quantities_by_stock(
            req.matched_lines,
            catalog,
            cap_by_stock=True,
            invoice_id=req.invoice_id,
            customer_name=req.customer_name,
            customer_email=cust_email,
            customer_phone=cust_phone,
            tenant_id=req.tenant_id
        )

        # Send deficit PO alert to master if SMTP settings are configured
        email_user = tenant_config.get("email_user")
        email_pass = tenant_config.get("email_pass")
        master_email = tenant_config.get("master_email")
        if deficit_lines and email_user and email_pass and master_email and email_user.strip() != "" and not email_user.startswith("your_"):
            try:
                send_deficit_purchase_order_alert(
                    smtp_server=tenant_config.get("smtp_server", "smtp.gmail.com"),
                    smtp_port=int(tenant_config.get("smtp_port", 465)),
                    email_user=email_user,
                    email_pass=email_pass,
                    master_email=master_email,
                    customer_name=req.customer_name,
                    customer_email=cust_email,
                    customer_phone=cust_phone,
                    original_subject=f"Manual Quotation Deficit Notification (Invoice #{req.invoice_id})",
                    deficit_lines=deficit_lines
                )
            except Exception as e:
                print(f"[Warning] Failed to send deficit PO alert from server: {e}")

        generate_pdf_quotation(
            matched_lines=req.matched_lines,
            discount_pct=req.discount_pct,
            customer_name=req.customer_name,
            invoice_id=req.invoice_id,
            output_path=pdf_path,
            catalog=catalog,
            customer_phone=cust_phone,
            upi_id=tenant_config.get("upi_id"),
            upi_name=tenant_config.get("upi_name"),
            logo_path=tenant_config.get("company_logo_path"),
            business_name=tenant_config.get("business_name")
        )
        
        # Log to SQLite Database
        try:
            from src.database_sqlite import log_quotation, log_quotation_item, log_chat_msg
            raw_subtotal = sum(i["quantity"] * i["unit_price"] for i in req.matched_lines if i["matched_sku_id"] != "UNKNOWN")
            discount_amt = raw_subtotal * req.discount_pct
            net_subtotal = raw_subtotal - discount_amt
            tax_amt = net_subtotal * 0.18
            grand_total = net_subtotal + tax_amt
            
            log_quotation(
                invoice_id=req.invoice_id,
                customer_name=req.customer_name,
                customer_email=cust_email,
                customer_phone=cust_phone,
                subtotal=raw_subtotal,
                discount_pct=req.discount_pct,
                tax_amt=tax_amt,
                grand_total=grand_total,
                status="QUOTE_GENERATED",
                source=req.source,
                tenant_id=req.tenant_id
            )
            for item in req.matched_lines:
                if item["matched_sku_id"] != "UNKNOWN":
                    log_quotation_item(
                        invoice_id=req.invoice_id,
                        sku_id=item["matched_sku_id"],
                        sku_name=item["matched_sku_name"],
                        quantity=item["quantity"],
                        unit_price=item["unit_price"],
                        line_total=item["quantity"] * item["unit_price"],
                        tenant_id=req.tenant_id
                    )
            
            # Log chat messages for View Request comparison
            if req.original_text:
                try:
                    log_chat_msg(req.invoice_id, "CUSTOMER", req.original_text, tenant_id=req.tenant_id)
                    
                    item_lines = []
                    for line in req.matched_lines:
                        if line.get("matched_sku_id") != "UNKNOWN" and line.get("quantity", 0) > 0:
                            item_lines.append(f"- {line['matched_sku_name']} (Qty: {line['quantity']}, Price: ₹{line['unit_price']})")
                    items_str = "\n".join(item_lines)
                    bot_msg = f"Dear {req.customer_name},\n\nThank you for your enquiry. We have generated your quotation {req.invoice_id} as requested:\n\n{items_str}\n\nTotal (Excl. Tax): ₹{raw_subtotal - discount_amt:.2f}\nTotal (Incl. 18% GST): ₹{grand_total:.2f}\n\nPlease find the PDF attached to this mail.\n\nBest Regards,\nTrofeo Automation Tool"
                    
                    log_chat_msg(req.invoice_id, "BOT", bot_msg, tenant_id=req.tenant_id)
                except Exception as _ce:
                    print(f"[Warning] Chat logging failed in generate_quote_pdf: {_ce}")
        except Exception as e:
            print(f"[Warning] SQLite logging failed: {e}")
        return {"pdf_url": f"/api/quote/pdf/{req.invoice_id}?tenant_id={req.tenant_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quote/pdf/{invoice_id}")
async def get_quote_pdf(invoice_id: str, tenant_id: str = "default"):
    from fastapi.responses import FileResponse
    from src.tenants import sanitize_tenant_id
    
    t_id = sanitize_tenant_id(tenant_id)
    safe_inv_id = "".join(c for c in str(invoice_id) if c.isalnum() or c in ("_", "-"))
    if not safe_inv_id:
        raise HTTPException(status_code=400, detail="Invalid Invoice ID.")
        
    filename = f"Quote_{safe_inv_id}.pdf"
    
    # 1. Check static/quotes/
    if t_id and t_id != "default":
        path1 = os.path.join(quotes_dir, t_id, filename)
        path2 = os.path.join(project_root, "mock_outbox", t_id, filename)
    else:
        path1 = os.path.join(quotes_dir, filename)
        path2 = os.path.join(project_root, "mock_outbox", filename)

    if os.path.exists(path1):
        return FileResponse(path1)
        
    # 2. Check mock_outbox/
    if os.path.exists(path2):
        return FileResponse(path2)
        
    raise HTTPException(status_code=404, detail="Quotation PDF file not found.")

# AI Negotiation Agent Endpoint
@app.post("/api/negotiate")
async def negotiate_discount(req: NegotiateRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    client = None
    is_live = False
    
    if api_key and api_key.strip() and not api_key.startswith("your_"):
        try:
            client = genai.Client(api_key=api_key)
            is_live = True
        except Exception:
            pass
            
    try:
        result = run_negotiation_step(
            customer_message=req.customer_message,
            requested_discount=req.requested_discount,
            chat_history=req.chat_history,
            is_live=is_live,
            client=client
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static dashboard files
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/api/report/data")
async def get_report_data(tenant_id: str = "default"):
    try:
        from src.database_sqlite import get_connection
        conn = get_connection(tenant_id)
        cursor = conn.cursor()
        
        # Fetch all quotations
        cursor.execute("SELECT * FROM quotations ORDER BY created_at DESC")
        quotations = [dict(row) for row in cursor.fetchall()]
        
        # Fetch all items for all quotations
        cursor.execute("SELECT * FROM quotation_items")
        items = [dict(row) for row in cursor.fetchall()]
        
        # Fetch all chat logs
        cursor.execute("SELECT * FROM chat_logs ORDER BY timestamp ASC")
        logs = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        # Group items and logs by invoice_id
        items_by_invoice = {}
        for item in items:
            inv_id = item["invoice_id"]
            if inv_id not in items_by_invoice:
                items_by_invoice[inv_id] = []
            items_by_invoice[inv_id].append(item)
            
        logs_by_invoice = {}
        for log in logs:
            inv_id = log["invoice_id"]
            if inv_id not in logs_by_invoice:
                logs_by_invoice[inv_id] = []
            logs_by_invoice[inv_id].append(log)
            
        return {
            "quotations": quotations,
            "items": items_by_invoice,
            "logs": logs_by_invoice
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/report/send_pdf")
async def send_report_pdf(tenant_id: str = "default"):
    tenant_config = get_tenant_config(tenant_id)
    
    smtp_server = tenant_config.get("smtp_server", "smtp.gmail.com")
    try:
        smtp_port = int(tenant_config.get("smtp_port", 465))
    except (ValueError, TypeError):
        smtp_port = 465
        
    email_user = tenant_config.get("email_user")
    email_pass = tenant_config.get("email_pass")
    master_email = tenant_config.get("master_email")
    
    if not email_user or not email_pass:
        raise HTTPException(status_code=400, detail=f"SMTP credentials are not configured for tenant {tenant_id}")
        
    from src.daily_report_pdf import send_daily_report_email
    
    # Send to both the monitored inbox and the master email
    recipients = list({
        email_user,
        master_email
    })
    recipients = [r for r in recipients if r and r.strip()]
    
    results = []
    for recipient in recipients:
        success = send_daily_report_email(smtp_server, smtp_port, email_user, email_pass, recipient, tenant_id=tenant_id)
        results.append({"recipient": recipient, "success": success})
    
    if all(r["success"] for r in results):
        return {"status": "SUCCESS", "message": f"Daily report PDF sent to recipients", "results": results}
    else:
        failed = [r["recipient"] for r in results if not r["success"]]
        raise HTTPException(status_code=500, detail=f"Failed to send to: {', '.join(failed)}")

@app.get("/api/unmatched")
async def get_unmatched_enquiries(tenant_id: str = "default"):
    """Returns all unmatched / uncategorized customer enquiries from the database."""
    try:
        from src.database_sqlite import get_all_unmatched_items, get_unmatched_items_count
        items = get_all_unmatched_items(limit=100, tenant_id=tenant_id)
        count = get_unmatched_items_count(tenant_id=tenant_id)
        return {
            "count": count,
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deficits")
async def get_deficits(tenant_id: str = "default"):
    """Returns all stock deficit items from the database."""
    try:
        from src.database_sqlite import get_all_deficits
        items = get_all_deficits(tenant_id=tenant_id)
        return {"count": len(items), "deficits": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/deficits/resolve")
async def resolve_deficit_endpoint(req: DeficitResolveRequest):
    """
    Resolves a stock deficit by:
    1. Updating the SKU stock in the catalog CSV (triggers mtime reload)
    2. Marking the deficit as RESOLVED in SQLite
    3. Recalculating and regenerating the quotation PDF
    4. Emailing the updated quote to the customer
    """
    try:
        from src.database_sqlite import get_all_deficits, resolve_deficit, get_connection
        from src.tenants import get_tenant_catalog, get_tenant_config

        # 1. Get the deficit record from DB
        conn = get_connection(req.tenant_id)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM deficits WHERE id = ?", (req.deficit_id,)
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Deficit record not found.")
        deficit = dict(row)

        invoice_id = deficit["invoice_id"]

        # 2. Update catalog stock
        catalog = get_tenant_catalog(req.tenant_id)
        catalog.update_sku_stock(deficit["sku_id"], req.new_stock)

        # 3. Mark deficit as RESOLVED in DB
        resolve_deficit(req.deficit_id, tenant_id=req.tenant_id)

        # 4. Load quotation meta JSON to get original matched_lines
        import json
        from src.tenants import sanitize_tenant_id
        t_id = sanitize_tenant_id(req.tenant_id)
        tenant_config = get_tenant_config(req.tenant_id)
        
        meta_filename = f"Quote_{invoice_id}_meta.json"
        meta_paths = [
            os.path.join(project_root, "static", "quotes", meta_filename),
            os.path.join(project_root, "mock_outbox", meta_filename),
        ]
        if t_id and t_id != "default":
            meta_paths.insert(0, os.path.join(project_root, "static", "quotes", t_id, meta_filename))
            meta_paths.insert(1, os.path.join(project_root, "mock_outbox", t_id, meta_filename))

        meta = None
        meta_path = None
        for p in meta_paths:
            if os.path.exists(p):
                meta_path = p
                try:
                    with open(p, 'r', encoding='utf-8') as f:
                        meta = json.load(f)
                    break
                except Exception:
                    pass

        if not meta:
            return {
                "status": "PARTIAL",
                "message": "Stock updated and deficit resolved, but quotation meta file not found — email not re-sent."
            }

        # 5. Re-run adjust_quantities_by_stock with fresh catalog (new stock loaded)
        catalog_fresh = get_tenant_catalog(req.tenant_id)  # will reload from CSV due to mtime change
        from src.email_listener import adjust_quantities_by_stock
        matched_lines = meta.get("matched_lines", [])
        adjust_quantities_by_stock(matched_lines, catalog_fresh, cap_by_stock=True)

        # Filter out lines still at zero (other deficits still pending)
        quoted_lines = [l for l in matched_lines if l.get("quantity", 0) > 0 and l.get("matched_sku_id") != "UNKNOWN"]
        if not quoted_lines:
            return {
                "status": "PARTIAL",
                "message": "Stock updated and deficit resolved, but no items have stock available — nothing quoted yet."
            }

        # 6. Regenerate PDF
        discount_pct = meta.get("discount_pct", 0.0)
        customer_name = meta.get("customer_name", "Walk-in Retail Client")
        customer_phone = meta.get("customer_phone", "—")
        customer_email = meta.get("customer_email", "")

        if t_id and t_id != "default":
            pdf_out_path = os.path.join(project_root, "static", "quotes", t_id, f"Quote_{invoice_id}.pdf")
            os.makedirs(os.path.dirname(pdf_out_path), exist_ok=True)
        else:
            pdf_out_path = os.path.join(project_root, "static", "quotes", f"Quote_{invoice_id}.pdf")
            os.makedirs(os.path.dirname(pdf_out_path), exist_ok=True)

        from src.pdf_generator import generate_pdf_quotation
        generate_pdf_quotation(
            matched_lines=quoted_lines,
            discount_pct=discount_pct,
            customer_name=customer_name,
            invoice_id=invoice_id,
            output_path=pdf_out_path,
            catalog=catalog_fresh,
            customer_phone=customer_phone,
            upi_id=tenant_config.get("upi_id"),
            upi_name=tenant_config.get("upi_name"),
            logo_path=tenant_config.get("company_logo_path"),
            business_name=tenant_config.get("business_name"),
            customer_email=customer_email
        )

        # 7. Send updated quote to customer
        if customer_email:
            from src.email_listener import build_email_reply_body, send_quotation_email_to_customer
            reply_body, grand_total = build_email_reply_body(
                matched_lines=quoted_lines,
                discount_pct=discount_pct,
                customer_name=customer_name,
                invoice_id=invoice_id,
                logo_cid="company_logo",
                tenant_config=tenant_config,
                customer_email=customer_email,
                customer_phone=customer_phone
            )
            if isinstance(reply_body, tuple):
                plain_body, html_body = reply_body
            else:
                plain_body = reply_body
                html_body = f"<html><body><p>{plain_body.replace(chr(10), '<br>')}</p></body></html>"
            
            reply_subject = f"[Quotation #{invoice_id}] Updated Stock — Re-issued Quote"
            send_quotation_email_to_customer(
                tenant_id=req.tenant_id,
                customer_email=customer_email,
                reply_subject=reply_subject,
                plain_body=plain_body,
                html_body=html_body,
                pdf_path=pdf_out_path
            )

        return {
            "status": "SUCCESS",
            "message": f"Deficit resolved, stock updated to {req.new_stock}, and updated quote sent to {customer_email}.",
            "pdf_url": f"/api/quote/pdf/{invoice_id}?tenant_id={req.tenant_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/negotiations/escalated")
async def get_escalated_negotiations(tenant_id: str = "default"):
    """Returns all quotations in NEGOTIATION_ESCALATED or NEGOTIATION_NEGOTIATING status."""
    try:
        from src.database_sqlite import get_escalated_negotiations
        items = get_escalated_negotiations(tenant_id=tenant_id)
        return {"count": len(items), "negotiations": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/negotiations/resolve")
async def resolve_negotiation_endpoint(req: NegotiationResolveRequest):
    """
    Manually resolves an escalated negotiation:
    - approve: accepts the customer's requested discount (or a custom override)
    - reject: rejects the negotiation, keeps original pricing
    - counter: uses the admin's counter-offer discount_pct
    Then recalculates totals, regenerates PDF, and emails the customer.
    """
    try:
        from src.database_sqlite import update_quotation_status, get_connection
        from src.tenants import get_tenant_catalog, get_tenant_config, sanitize_tenant_id
        import json

        invoice_id = req.invoice_id
        t_id = sanitize_tenant_id(req.tenant_id)
        tenant_config = get_tenant_config(req.tenant_id)
        catalog = get_tenant_catalog(req.tenant_id)

        # Load quotation from DB
        conn = get_connection(req.tenant_id)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM quotations WHERE invoice_id = ?", (invoice_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail=f"Quotation {invoice_id} not found.")
        quotation = dict(row)

        if req.action == "reject":
            update_quotation_status(invoice_id, "NEGOTIATION_REJECTED", tenant_id=req.tenant_id)
            # Notify customer
            customer_email = quotation.get("customer_email", "")
            customer_name = quotation.get("customer_name", "Valued Customer")
            if customer_email:
                from src.email_listener import send_quotation_email_to_customer
                reject_body = (
                    f"Dear {customer_name},\n\n"
                    f"Thank you for your interest. After careful consideration, we are unable to offer "
                    f"an additional discount on Quotation #{invoice_id} at this time.\n\n"
                    f"Our original quoted price stands as the best we can offer. "
                    f"Please feel free to reach out if you have any further questions.\n\n"
                    f"Best Regards,\nTrofeo Solution Sales Team"
                )
                send_quotation_email_to_customer(
                    tenant_id=req.tenant_id,
                    customer_email=customer_email,
                    reply_subject=f"[Quotation #{invoice_id}] Regarding Your Discount Request",
                    plain_body=reject_body,
                    html_body=f"<html><body><p>{reject_body.replace(chr(10), '<br>')}</p></body></html>",
                    pdf_path=None
                )
            return {"status": "SUCCESS", "message": f"Negotiation for {invoice_id} rejected and customer notified."}

        # For approve or counter, apply the override discount
        discount_pct = 0.0
        if req.action in ["approve", "counter"] and req.item_discount_mode == "order":
            discount_pct = req.override_discount_pct

        # Load meta to get matched_lines
        meta_filename = f"Quote_{invoice_id}_meta.json"
        meta_paths = [
            os.path.join(project_root, "static", "quotes", meta_filename),
            os.path.join(project_root, "mock_outbox", meta_filename),
        ]
        if t_id and t_id != "default":
            meta_paths.insert(0, os.path.join(project_root, "static", "quotes", t_id, meta_filename))
            meta_paths.insert(1, os.path.join(project_root, "mock_outbox", t_id, meta_filename))

        meta = None
        for p in meta_paths:
            if os.path.exists(p):
                try:
                    with open(p, 'r', encoding='utf-8') as f:
                        meta = json.load(f)
                    break
                except Exception:
                    pass

        if not meta:
            return {"status": "PARTIAL", "message": "Status updated but meta file not found — PDF not regenerated."}

        matched_lines = meta.get("matched_lines", [])

        # Apply specific item discount or rate override if requested
        if req.action in ["approve", "counter"] and req.item_discount_mode in ["item_pct", "item_rate"]:
            target_sku = req.target_sku_id
            discount_val = req.item_discount_value
            for line in matched_lines:
                if line.get("matched_sku_id") == target_sku:
                    if req.item_discount_mode == "item_pct":
                        item_disc_pct = discount_val / 100.0 if discount_val > 1.0 else discount_val
                        sku_profile = next((s for s in catalog.skus if s["sku_id"] == target_sku), None)
                        base_price = sku_profile["price"] if sku_profile else line.get("unit_price", 0.0)
                        line["unit_price"] = base_price * (1.0 - item_disc_pct)
                    elif req.item_discount_mode == "item_rate":
                        line["unit_price"] = discount_val
            
            # Save updated matched lines back into meta
            meta["matched_lines"] = matched_lines

        # Recalculate totals based on the possibly updated items
        quoted_lines = [l for l in matched_lines if l.get("quantity", 0) > 0 and l.get("matched_sku_id") != "UNKNOWN"]
        raw_subtotal = sum(i["quantity"] * i["unit_price"] for i in quoted_lines)
        discount_amt = raw_subtotal * discount_pct
        net_subtotal = raw_subtotal - discount_amt
        tax_amt = net_subtotal * 0.18
        grand_total = net_subtotal + tax_amt

        # Update SQL Database
        conn = get_connection(req.tenant_id)
        cursor = conn.cursor()
        new_status = "NEGOTIATION_APPROVED"
        cursor.execute("""
            UPDATE quotations
            SET status = ?, subtotal = ?, discount_pct = ?, tax_amt = ?, grand_total = ?
            WHERE invoice_id = ?
        """, (new_status, raw_subtotal, discount_pct, tax_amt, grand_total, invoice_id))
        
        # Also update quotation_items in database
        for line in quoted_lines:
            sku_id = line["matched_sku_id"]
            qty = line["quantity"]
            u_price = line["unit_price"]
            l_total = qty * u_price
            cursor.execute("""
                UPDATE quotation_items
                SET unit_price = ?, line_total = ?
                WHERE invoice_id = ? AND sku_id = ?
            """, (u_price, l_total, invoice_id, sku_id))
            
        conn.commit()
        conn.close()

        # Write updated meta dictionary back to disk
        for p in meta_paths:
            if os.path.exists(p):
                try:
                    with open(p, 'w', encoding='utf-8') as f:
                        json.dump(meta, f, indent=2)
                except Exception:
                    pass

        customer_name = meta.get("customer_name", quotation.get("customer_name", "Valued Customer"))
        customer_phone = meta.get("customer_phone", quotation.get("customer_phone", "—"))
        customer_email = meta.get("customer_email", quotation.get("customer_email", ""))

        if t_id and t_id != "default":
            pdf_out_path = os.path.join(project_root, "static", "quotes", t_id, f"Quote_{invoice_id}.pdf")
        else:
            pdf_out_path = os.path.join(project_root, "static", "quotes", f"Quote_{invoice_id}.pdf")
        os.makedirs(os.path.dirname(pdf_out_path), exist_ok=True)

        from src.pdf_generator import generate_pdf_quotation
        generate_pdf_quotation(
            matched_lines=quoted_lines,
            discount_pct=discount_pct,
            customer_name=customer_name,
            invoice_id=invoice_id,
            output_path=pdf_out_path,
            catalog=catalog,
            customer_phone=customer_phone,
            upi_id=tenant_config.get("upi_id"),
            upi_name=tenant_config.get("upi_name"),
            logo_path=tenant_config.get("company_logo_path"),
            business_name=tenant_config.get("business_name"),
            customer_email=customer_email
        )

        if customer_email:
            from src.email_listener import build_email_reply_body, send_quotation_email_to_customer
            reply_body, grand_total = build_email_reply_body(
                matched_lines=quoted_lines,
                discount_pct=discount_pct,
                customer_name=customer_name,
                invoice_id=invoice_id,
                logo_cid="company_logo",
                tenant_config=tenant_config,
                customer_email=customer_email,
                customer_phone=customer_phone
            )
            if isinstance(reply_body, tuple):
                plain_body, html_body = reply_body
            else:
                plain_body = reply_body
                html_body = f"<html><body><p>{plain_body.replace(chr(10), '<br>')}</p></body></html>"

            disc_label = ""
            if req.item_discount_mode == "order":
                disc_label = f"{round(discount_pct * 100, 1)}% order"
            elif req.item_discount_mode == "item_pct":
                disc_label = f"item discount"
            elif req.item_discount_mode == "item_rate":
                disc_label = f"special item price"

            reply_subject = f"[Quotation #{invoice_id}] Updated Quote with {disc_label}"
            send_quotation_email_to_customer(
                tenant_id=req.tenant_id,
                customer_email=customer_email,
                reply_subject=reply_subject,
                plain_body=plain_body,
                html_body=html_body,
                pdf_path=pdf_out_path
            )

        return {
            "status": "SUCCESS",
            "message": f"Negotiation for {invoice_id} resolved ({req.action}) with {round(discount_pct*100,1)}% discount. Customer notified.",
            "pdf_url": f"/api/quote/pdf/{invoice_id}?tenant_id={req.tenant_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/inventory/update")
async def update_inventory_stock(req: InventoryUpdateRequest):
    """Updates the stock of a specific SKU in the catalog and logs the change."""
    try:
        from src.tenants import get_tenant_catalog
        from src.database_sqlite import log_inventory_update
        catalog = get_tenant_catalog(req.tenant_id)
        # Capture old stock before update
        old_stock = 0
        sku_name = req.sku_id
        for sku in catalog.skus:
            if sku["sku_id"] == req.sku_id:
                old_stock = int(sku.get("stock", 0))
                sku_name = sku.get("sku_name", req.sku_id)
                break
        success = catalog.update_sku_stock(req.sku_id, req.new_stock)
        if not success:
            raise HTTPException(status_code=404, detail=f"SKU {req.sku_id} not found in catalog.")
        # Log the change to DB
        log_inventory_update(req.sku_id, sku_name, old_stock, req.new_stock, req.tenant_id)
        return {"status": "SUCCESS", "message": f"Stock for SKU {req.sku_id} updated from {old_stock} to {req.new_stock}."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/low-stock")
async def get_low_stock(tenant_id: str = "default", threshold: int = 5):
    """Returns all SKUs with stock <= threshold."""
    try:
        from src.tenants import get_tenant_catalog
        catalog = get_tenant_catalog(tenant_id)
        low_stock_items = [
            {
                "sku_id": sku["sku_id"],
                "sku_name": sku.get("sku_name", "—"),
                "category": sku.get("category", "—"),
                "stock": int(sku.get("stock", 0)),
                "price": float(sku.get("price", 0))
            }
            for sku in catalog.skus
            if int(sku.get("stock", 0)) <= threshold
        ]
        low_stock_items.sort(key=lambda x: x["stock"])
        return {"count": len(low_stock_items), "threshold": threshold, "items": low_stock_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/catalog")
async def get_full_catalog(tenant_id: str = "default"):
    """Returns all SKUs in the catalog."""
    try:
        from src.tenants import get_tenant_catalog
        catalog = get_tenant_catalog(tenant_id)
        items = [
            {
                "sku_id": sku["sku_id"],
                "sku_name": sku.get("sku_name", "—"),
                "category": sku.get("category", "—"),
                "stock": int(sku.get("stock", 0)),
                "price": float(sku.get("price", 0))
            }
            for sku in catalog.skus
        ]
        items.sort(key=lambda x: x["sku_id"])
        return {"count": len(items), "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/inventory/logs")
async def get_inventory_update_logs(tenant_id: str = "default"):
    """Returns the audit log of all stock quantity changes."""
    try:
        from src.database_sqlite import get_inventory_logs
        logs = get_inventory_logs(tenant_id)
        return {"count": len(logs), "logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/service/status")
async def get_email_listener_status(tenant_id: str = "default"):
    try:
        from src.database_sqlite import get_service_status
        status_info = get_service_status(tenant_id=tenant_id)
        return status_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/service/logs")
async def get_service_logs(tenant_id: str = "default", limit: int = 150):
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        log_file = os.path.join(project_root, "data", "email_listener.log")
        
        if not os.path.exists(log_file):
            return {"logs": ["No logs found. Email listener has not generated any logs yet."]}
            
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            
        t_id = tenant_id.strip()
        if t_id and t_id != "default" and t_id != "all":
            filtered = []
            for line in lines:
                if "tenant" not in line.lower() or t_id.lower() in line.lower():
                    filtered.append(line.strip())
            return {"logs": filtered[-limit:]}
        else:
            return {"logs": [line.strip() for line in lines[-limit:]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quote/details/{invoice_id}")
async def get_quote_details(invoice_id: str, tenant_id: str = "default"):
    try:
        from src.database_sqlite import get_connection
        conn = get_connection(tenant_id)
        cursor = conn.cursor()

        # A "CUSTOMER_REPLIED:<QTN>" id (from the Reply-stage card) maps to the
        # underlying quotation thread.
        if invoice_id.startswith("CUSTOMER_REPLIED:"):
            invoice_id = invoice_id.split(":", 1)[1]

        cursor.execute("SELECT * FROM quotations WHERE invoice_id = ?", (invoice_id,))
        quote_row = cursor.fetchone()
        if not quote_row:
            raise HTTPException(status_code=404, detail="Quotation not found")
        quote = dict(quote_row)
        
        cursor.execute("SELECT * FROM quotation_items WHERE invoice_id = ?", (invoice_id,))
        items = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM chat_logs WHERE invoice_id = ? ORDER BY timestamp ASC", (invoice_id,))
        logs = [dict(row) for row in cursor.fetchall()]

        # --- Fallback: synthesize log entries from quotation + processed_messages if chat_logs is empty ---
        if not logs:
            synth_logs = []
            q_created = quote.get("created_at", "")
            q_status = quote.get("status", "")
            cust_name = quote.get("customer_name", "Customer")

            # 1. Initial enquiry (CUSTOMER)
            synth_logs.append({
                "id": 0,
                "invoice_id": invoice_id,
                "sender": "CUSTOMER",
                "message": f"Enquiry received from {cust_name} — quotation {invoice_id} was raised.",
                "timestamp": q_created,
            })

            # 2. Bot's original quotation reply
            synth_logs.append({
                "id": 1,
                "invoice_id": invoice_id,
                "sender": "BOT",
                "message": f"Quotation {invoice_id} was generated and sent to {cust_name}.",
                "timestamp": q_created,
            })

            # 3. If there is a CUSTOMER_REPLIED processed_message, show it
            cursor.execute(
                "SELECT processed_at FROM processed_messages WHERE invoice_id = ? ORDER BY processed_at DESC LIMIT 1",
                (f"CUSTOMER_REPLIED:{invoice_id}",)
            )
            reply_row = cursor.fetchone()
            if reply_row:
                synth_logs.append({
                    "id": 2,
                    "invoice_id": invoice_id,
                    "sender": "customer",
                    "message": "Customer sent a reply to this quotation.",
                    "timestamp": reply_row["processed_at"],
                })
                synth_logs.append({
                    "id": 3,
                    "invoice_id": invoice_id,
                    "sender": "BOT",
                    "message": f"AI responded to customer's reply. Current status: {q_status}.",
                    "timestamp": reply_row["processed_at"],
                })

            logs = synth_logs

        conn.close()

        return {
            "quotation": quote,
            "items": items,
            "logs": logs
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/overview/analytics")
async def get_overview_analytics(tenant_id: str = "default"):
    try:
        from src.database_sqlite import get_connection
        conn = get_connection(tenant_id)
        cursor = conn.cursor()
        
        # 1. Total processed (excluding SELF_SENT and IRRELEVANT)
        cursor.execute("SELECT COUNT(*) FROM processed_messages WHERE invoice_id NOT IN ('SELF_SENT', 'IRRELEVANT')")
        total_received = cursor.fetchone()[0]
        
        # 2. Irrelevant / Auto-filtered (Not counted in relevant sales metrics)
        auto_filtered = 0
        
        # 3. Quotations counts by status
        cursor.execute("SELECT status, COUNT(*) as c FROM quotations GROUP BY status")
        quote_counts = {row['status']: row['c'] for row in cursor.fetchall()}
        
        # Auto-responded quotes (QUOTE_GENERATED, QUOTE_UPDATED, NEGOTIATION_APPROVED, NEGOTIATION_REJECTED)
        auto_responded_quotes = (
            quote_counts.get("QUOTE_GENERATED", 0) +
            quote_counts.get("QUOTE_UPDATED", 0) +
            quote_counts.get("NEGOTIATION_APPROVED", 0) +
            quote_counts.get("NEGOTIATION_REJECTED", 0)
        )
        
        auto_responded = auto_responded_quotes
        
        # 4. Pending items
        # A. Escalated negotiations
        cursor.execute("SELECT invoice_id, customer_name, customer_email, status, grand_total, discount_pct, subtotal FROM quotations WHERE status IN ('NEGOTIATION_ESCALATED', 'NEGOTIATION_NEGOTIATING')")
        escalated_negs = [dict(row) for row in cursor.fetchall()]
        
        # B. Pending deficits
        cursor.execute("SELECT id, invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email FROM deficits WHERE status = 'PENDING'")
        pending_deficits = [dict(row) for row in cursor.fetchall()]
        
        # C. Unmatched items
        cursor.execute("SELECT id, customer_email, customer_name, original_body, source, created_at FROM unmatched_items")
        unmatched_items = [dict(row) for row in cursor.fetchall()]

        # D. Resolved deficits count (for KPI card)
        cursor.execute("SELECT COUNT(*) FROM deficits WHERE status = 'RESOLVED'")
        resolved_deficits_count = cursor.fetchone()[0]
        
        pending_approval_count = len(escalated_negs) + len(pending_deficits) + len(unmatched_items)
        
        # Overwrite total_received if it's less than the sum (in case of legacy/synced db rows)
        calculated_total = auto_responded + pending_approval_count
        if calculated_total > total_received:
            total_received = calculated_total
            
        # Efficiencies
        tool_efficiency = round((auto_responded / max(total_received, 1)) * 100, 1)
        human_intervention = round((pending_approval_count / max(total_received, 1)) * 100, 1)
        
        # 5. Fetch recent email/response log stream (excluding SELF_SENT and IRRELEVANT)
        cursor.execute("""
            SELECT pm.message_id, pm.invoice_id, pm.processed_at, pm.received_at,
                   q.customer_email as q_email, q.customer_name as q_name, q.status as q_status,
                   u.customer_email as u_email, u.customer_name as u_name
            FROM processed_messages pm
            LEFT JOIN quotations q ON q.invoice_id = pm.invoice_id
                OR q.invoice_id = REPLACE(pm.invoice_id, 'CUSTOMER_REPLIED:', '')
            LEFT JOIN unmatched_items u ON pm.message_id = 'UNMATCHED_' || u.id
            WHERE pm.invoice_id NOT IN ('SELF_SENT', 'IRRELEVANT')
            ORDER BY pm.processed_at DESC LIMIT 100
        """)
        raw_stream = cursor.fetchall()
        
        log_stream = []
        for row in raw_stream:
            inv_id = row['invoice_id']
            processed_at = row['processed_at']
            received_at = row['received_at'] or processed_at
            
            # Map type and status
            if inv_id == 'IRRELEVANT' or inv_id == 'EMPTY_BODY':
                email = "System / Marketing"
                name = "Spam / Auto-filtered"
                status = "Auto-Filtered"
                desc = "Spam, newsletter or irrelevant enquiry"
            elif inv_id.startswith('CUSTOMER_REPLIED:'):
                # Customer reply to a previous quotation
                qtn_ref = inv_id.replace('CUSTOMER_REPLIED:', '')
                email = row['q_email'] or "Customer"
                name = row['q_name'] or "Customer"
                q_status = row['q_status']
                if q_status in ("NEGOTIATION_APPROVED", "NEGOTIATION_NEGOTIATING", "QUOTE_UPDATED", "CONVERSATIONAL_REPLY"):
                    status = q_status
                    desc = f"AI replied to customer's thread for {qtn_ref} ({q_status})"
                else:
                    status = "CUSTOMER_REPLIED"
                    desc = f"Customer replied to {qtn_ref}"
            elif inv_id.startswith('QTN-'):
                email = row['q_email'] or "Customer"
                name = row['q_name'] or "Customer"
                status = row['q_status'] or "QUOTE_GENERATED"
                desc = f"Quotation {inv_id} Generated"
            elif 'UNMATCHED' in inv_id:
                email = row['u_email'] or "Customer"
                name = row['u_name'] or "Customer"
                # If original_body indicates human agent request → Pending
                try:
                    _body_check = (row['u_email'] or '') + inv_id
                    # Fetch from DB to check HUMAN AGENT REQUESTED tag
                    if 'UNMATCHED_' in inv_id:
                        _uid = inv_id.replace('UNMATCHED_', '')
                        _urow = cursor.execute(
                            "SELECT original_body FROM unmatched_items WHERE id = ?",
                            (_uid,)
                        ).fetchone()
                        if _urow and 'HUMAN AGENT REQUESTED' in (_urow[0] or ''):
                            status = "PENDING_HUMAN"
                            desc = "Customer requested human assistance"
                        else:
                            status = "PENDING_HUMAN"
                            desc = "Items not found in catalog (requires manual review)"
                    else:
                        status = "PENDING_HUMAN"
                        desc = "Pending manual review"
                except Exception:
                    status = "PENDING_HUMAN"
                    desc = "Pending manual review"
            elif inv_id == 'NEW':
                email = row['q_email'] or row['u_email'] or "Customer"
                name = row['q_name'] or row['u_name'] or "Incoming Mail"
                status = "Pending Review"
                desc = "New enquiry received"
            elif inv_id in ('UNPARSED_NOTICE', 'UNPARSED'):
                # Legacy/bad data rows where status was stored as invoice_id - skip them
                continue
            else:
                email = row['q_email'] or row['u_email'] or "Customer"
                name = row['q_name'] or row['u_name'] or "Incoming Mail"
                status = "Pending Review"
                desc = "New enquiry received"
                
            log_stream.append({
                "message_id": row['message_id'],
                "invoice_id": inv_id,
                "timestamp": processed_at,
                "received_at": received_at,
                "customer_email": email,
                "customer_name": name,
                "status": status,
                "description": desc
            })

            
        # Fallback: if log_stream is empty, fill it from quotations and unmatched items
        if not log_stream:
            # Load from quotations
            cursor.execute("SELECT invoice_id, customer_email, customer_name, status, created_at FROM quotations ORDER BY created_at DESC LIMIT 10")
            for row in cursor.fetchall():
                log_stream.append({
                    "message_id": f"QTN_{row['invoice_id']}",
                    "invoice_id": row['invoice_id'],
                    "timestamp": row['created_at'],
                    "received_at": row['created_at'],
                    "customer_email": row['customer_email'],
                    "customer_name": row['customer_name'],
                    "status": row['status'],
                    "description": f"Quotation {row['invoice_id']} status is {row['status']}"
                })
            # Sort by timestamp
            log_stream.sort(key=lambda x: x['timestamp'], reverse=True)
            log_stream = log_stream[:15]
            
        conn.close()
        
        return {
            "processed_count": total_received,
            "escalated_negotiations_count": len(escalated_negs),
            "resolved_deficits_count": resolved_deficits_count,
            "metrics": {
                "total_received": total_received,
                "auto_responded": auto_responded,
                "pending_approval": pending_approval_count,
                "tool_efficiency_pct": tool_efficiency,
                "human_intervention_pct": human_intervention
            },
            "recent_stream": log_stream,
            "pending_items": {
                "negotiations": escalated_negs,
                "deficits": pending_deficits,
                "unmatched": unmatched_items
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report")
async def get_report():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(static_dir, "report.html"))


from fastapi.responses import RedirectResponse, HTMLResponse
import urllib.request
import urllib.parse

@app.get("/api/outlook/login")
def outlook_login(tenant_id: str = "default"):
    tenant_config = get_tenant_config(tenant_id)
    outlook_tenant_id = tenant_config.get("outlook_tenant_id")
    outlook_client_id = tenant_config.get("outlook_client_id")
    
    if not outlook_tenant_id or not outlook_client_id:
        raise HTTPException(status_code=400, detail="Outlook configuration is missing for this tenant.")
    
    scopes = "offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send"
    redirect_uri = "http://localhost:8080/api/outlook/callback"
    
    params = {
        "client_id": outlook_client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "response_mode": "query",
        "scope": scopes,
        "state": tenant_id
    }
    
    auth_url = f"https://login.microsoftonline.com/{outlook_tenant_id}/oauth2/v2.0/authorize?" + urllib.parse.urlencode(params)
    return RedirectResponse(auth_url)

@app.get("/api/outlook/callback", response_class=HTMLResponse)
@app.get("/api/outlook/callback.", response_class=HTMLResponse)
def outlook_callback(code: str = None, error: str = None, error_description: str = None, state: str = "default"):
    if error:
        return f"""
        <html>
            <head><title>Authentication Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px; background-color: #FFF0F0;">
                <h2 style="color: #D32F2F;">Authentication Failed</h2>
                <p><strong>Error:</strong> {error}</p>
                <p><strong>Description:</strong> {error_description}</p>
            </body>
        </html>
        """
        
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is missing.")
        
    tenant_id = state
    tenant_config = get_tenant_config(tenant_id)
    outlook_tenant_id = tenant_config.get("outlook_tenant_id")
    outlook_client_id = tenant_config.get("outlook_client_id")
    outlook_client_secret = tenant_config.get("outlook_client_secret")
    
    token_url = f"https://login.microsoftonline.com/{outlook_tenant_id}/oauth2/v2.0/token"
    redirect_uri = "http://localhost:8080/api/outlook/callback"
    
    data = {
        "client_id": outlook_client_id,
        "client_secret": outlook_client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
        "scope": "offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send"
    }
    
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(token_url, data=encoded_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            
            # Save the tokens
            token_dir = os.path.join(project_root, "data")
            os.makedirs(token_dir, exist_ok=True)
            token_file = os.path.join(token_dir, f"outlook_tokens_{tenant_id}.json")
            
            with open(token_file, "w", encoding="utf-8") as f:
                json.dump(res_data, f, indent=2)
                
            return """
            <html>
                <head>
                    <title>Authentication Successful</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Arial, sans-serif;
                            text-align: center;
                            padding-top: 100px;
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: white;
                            display: inline-block;
                            padding: 40px 60px;
                            border-radius: 12px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                        }
                        h2 { color: #2E7D32; margin-top: 0; }
                        p { color: #555; font-size: 16px; }
                        .checkmark { font-size: 60px; color: #4CAF50; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="checkmark">✓</div>
                        <h2>Authentication Successful!</h2>
                        <p>Your Outlook Mail account has been authorized successfully.</p>
                        <p>You can close this browser tab now and return to the dashboard.</p>
                    </div>
                </body>
            </html>
            """
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, "read"):
            try:
                err_msg += " - " + e.read().decode("utf-8")
            except Exception:
                pass
        return f"""
        <html>
            <head><title>Token Exchange Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px; background-color: #FFF0F0;">
                <h2 style="color: #D32F2F;">Token Exchange Failed</h2>
                <p><strong>Error Details:</strong> {err_msg}</p>
            </body>
        </html>
        """


@app.get("/")
async def get_index():
    # Serves static dashboard index by default, with cache-control to prevent caching
    from fastapi.responses import FileResponse
    response = FileResponse(os.path.join(static_dir, "index.html"))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
