import os
import re
import sys
import html
import time
import json
import imaplib
import smtplib
import email
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from src.database import Catalog
from src.scenario_free import run_scenario_free
from src.scenario_hybrid import run_scenario_hybrid
from src.pdf_generator import generate_pdf_quotation, find_company_logo

# Business Profile & Signature Config
BUSINESS_NAME = os.environ.get("BUSINESS_NAME", "Trofeo Solution")
SALES_EXECUTIVE_NAME = os.environ.get("SALES_EXECUTIVE_NAME", "Rajaram")
SALES_EXECUTIVE_TITLE = os.environ.get("SALES_EXECUTIVE_TITLE", "Sales Executive")
SALES_EXECUTIVE_PHONE = os.environ.get("SALES_EXECUTIVE_PHONE", "+91 98765 43210")
SALES_EXECUTIVE_EMAIL = os.environ.get("SALES_EXECUTIVE_EMAIL", "sales@trofeosolution.com")

# Helper: Extract phone number from email body
def extract_phone_number(body_text):
    """
    Scans the email body text using regex to extract a phone/contact number.
    Looks for standard formats like:
    - +91-XXXXX-XXXXX
    - +91 XXXXX XXXXX
    - +91XXXXXXXXXX
    - 0XXXXXXXXXX
    - +1 XXX XXX XXXX
    - 10-digit number
    """
    if not body_text:
        return None
        
    # Match standard international & Indian format:
    # e.g. +91 98765 43210, +91-9876543210, 09876543210, +1 (555) 123-4567, 555-123-4567
    phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4}'
    match = re.search(phone_pattern, body_text)
    if match:
        # Avoid matching decimal price patterns or invoice numbers
        matched = match.group(0).strip()
        # Clean up letters or other special chars
        return matched
    
    # Fallback to simple 10-digit number sequence
    match_simple = re.search(r'\b\d{10}\b', body_text)
    if match_simple:
        return match_simple.group(0)
        
    return None

# Helper: Parse email headers and body from plain text (used in simulation)
def parse_mock_email(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Regex extract headers
    from_match = re.search(r'^From:\s*(.+)$', content, re.MULTILINE | re.IGNORECASE)
    sub_match = re.search(r'^Subject:\s*(.+)$', content, re.MULTILINE | re.IGNORECASE)
    body_start = re.search(r'^Body:\s*$', content, re.MULTILINE | re.IGNORECASE)
    
    sender = from_match.group(1).strip() if from_match else "walkin_retail@guest.com"
    subject = sub_match.group(1).strip() if sub_match else "Order Enquiry"
    
    body = ""
    if body_start:
        body = content[body_start.end():].strip()
    else:
        # Fallback: everything after headers
        lines = content.split('\n')
        body_lines = [l for l in lines if not (l.lower().startswith("from:") or l.lower().startswith("subject:"))]
        body = "\n".join(body_lines).strip()
        
    return sender, subject, body

def strip_email_history(body_text):
    """Strips reply history, signatures, and trailing quoted text from email body."""
    if not body_text:
        return ""
        
    lines = body_text.split('\n')
    cleaned_lines = []
    
    # Common headers indicating start of reply history
    history_patterns = [
        r'^\s*On\s+.*\s+wrote:\s*$',
        r'^\s*-+\s*Original\s+Message\s*-+\s*$',
        r'^\s*-+\s*Forwarded\s+Message\s*-+\s*$',
        r'^\s*From:\s+.*',
        r'^\s*________________________________\s*$',
        r'^\s*={5,}\s*$', # line of equals (our email separator)
        r'^\s*-{5,}\s*$', # line of dashes
    ]
    
    for line in lines:
        line_stripped = line.strip()
        if any(re.match(pat, line_stripped, re.IGNORECASE) for pat in history_patterns):
            break
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines).strip()

def clean_reply_subject(original_subject, invoice_id=None, is_unparsed=False):
    """Cleans up RE: prefixes and appends Quotation/Unparsed brackets cleanly."""
    subject = original_subject
    
    # Remove existing "RE:", "FW:", "Subject:" (case-insensitive, recursive)
    while True:
        sub_clean = re.sub(r'^\s*(re|fw|fwd|subject)\s*:\s*', '', subject, flags=re.IGNORECASE).strip()
        if sub_clean == subject:
            break
        subject = sub_clean
        
    # Remove existing Quotation/Unparsed brackets
    subject = re.sub(r'\[Quotation\s+#\d+\]', '', subject, flags=re.IGNORECASE).strip()
    subject = re.sub(r'\[Unparsed\s+Enquiry\]', '', subject, flags=re.IGNORECASE).strip()
    subject = re.sub(r'\[Quotation\s+#TEST\d+\]', '', subject, flags=re.IGNORECASE).strip()
    
    if invoice_id:
        return f"RE: {subject} [Quotation #{invoice_id}]"
    elif is_unparsed:
        return f"RE: {subject} [Unparsed Enquiry]"
    else:
        return f"RE: {subject}"

def get_crm_discount(email_addr, crm_path):
    if os.path.exists(crm_path):
        try:
            with open(crm_path, 'r', encoding='utf-8') as f:
                customers = json.load(f)
                profile = customers.get(email_addr)
                if profile:
                    return profile["discount"], profile["name"], profile.get("phone", "+91 90000 00000")
        except Exception:
            pass
    return 0.0, "Walk-in Retail Client", "+91 90000 00000"

def build_email_reply_body(matched_lines, discount_pct, customer_name, invoice_id, logo_cid=None):
    """Formats the reply body with the quote breakdown (both Plain Text and HTML)."""
    # 1. Plain Text Body
    body = [
        f"Dear {customer_name},\n",
        f"Thank you for reaching out to us. Please find below the pricing for the items you requested (Quotation Ref: #{invoice_id}).\n",
        "We have gone through your requirements and put together the best available rates for you:\n",
        "-" * 80,
        f"{'Item Description':<40} | {'Qty':<4} | {'Price':<6} | {'Total':<7} | {'Stock Status':<12}",
        "-" * 80
    ]
    
    raw_subtotal = 0.0
    for line in matched_lines:
        if line['matched_sku_id'] == "UNKNOWN":
            continue
            
        sku_display = line['matched_sku_name']
        if len(skuDisplay := sku_display) > 38:
            skuDisplay = skuDisplay[:35] + "..."
            
        qty = line['quantity']
        price = line['unit_price']
        total = price * qty
        raw_subtotal += total
        
        stock_status = "In Stock"
        if line['matched_sku_id'] == "PTFE-TAPE-12" or line['matched_sku_id'] == "SCREW-WOOD-8-40":
            stock_status = "OUT OF STOCK"
            
        body.append(f"{skuDisplay:<40} | {qty:<4} | ₹{price:<5.2f} | ₹{total:<6.2f} | {stock_status:<12}")
        
    body.append("-" * 80)
    
    discount_amt = raw_subtotal * discount_pct
    net_subtotal = raw_subtotal - discount_amt
    tax_amt = net_subtotal * 0.18
    grand_total = net_subtotal + tax_amt
    
    body.append(f"{'':<45} Subtotal:         ₹{raw_subtotal:>8.2f}")
    if discount_pct > 0:
        body.append(f"{'':<45} Special Discount ({int(discount_pct*100)}%): -₹{discount_amt:>8.2f}")
        body.append(f"{'':<45} Net Amount:       ₹{net_subtotal:>8.2f}")
    body.append(f"{'':<45} GST 18%:          ₹{tax_amt:>8.2f}")
    body.append(f"{'':<45} Total Payable:    ₹{grand_total:>8.2f}")
    body.append("-" * 80)
    
    body.append("\nI have attached a detailed PDF quotation for your reference. It also includes a QR code for quick payment.")
    body.append("If you'd like to discuss the pricing or need any changes, feel free to reply to this email — happy to help.")
    body.append("\nWarm regards,")
    body.append(SALES_EXECUTIVE_NAME)
    body.append(f"{SALES_EXECUTIVE_TITLE} | {BUSINESS_NAME}")
    body.append(SALES_EXECUTIVE_PHONE)
    
    plain_text = "\n".join(body)
    
    # 2. HTML Body
    html_lines = [
        "<html><head><style>",
        "body { font-family: Arial, 'Helvetica Neue', sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 24px; font-size: 14px; }",
        "table { width: 100%; border-collapse: collapse; margin: 20px 0; }",
        "th { background-color: #1e293b; color: white; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 13px; }",
        "td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }",
        "tr:hover td { background-color: #f8fafc; }",
        ".summary-table { width: 320px; margin-left: auto; border: none; }",
        ".summary-table td { border: none; padding: 4px 10px; text-align: right; }",
        ".summary-label { font-weight: normal; color: #64748b; }",
        ".summary-value { font-weight: 600; color: #1e293b; }",
        ".total-row td { font-size: 15px; font-weight: 700; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 10px; }",
        ".footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 18px; color: #64748b; font-size: 13px; }",
        ".footer b { color: #1e293b; }",
        "</style></head><body>",
        f"<p>Dear {html.escape(customer_name)},</p>",
        f"<p>Thank you for reaching out to us. Please find below the pricing for the items you requested <b>(Quotation Ref: #{invoice_id})</b>.</p>",
        "<p>We have gone through your requirements and put together the best available rates for you:</p>",
        "<table>",
        "<thead><tr>",
        "<th>Item Description</th>",
        "<th style='text-align: center;'>Qty</th>",
        "<th style='text-align: right;'>Unit Price</th>",
        "<th style='text-align: right;'>Total</th>",
        "<th>Availability</th>",
        "</tr></thead><tbody>"
    ]
    
    for line in matched_lines:
        if line['matched_sku_id'] == "UNKNOWN":
            continue
        qty = line['quantity']
        price = line['unit_price']
        total = price * qty
        
        stock_html = "<span style='color:#16a34a;'>In Stock</span>"
        if line['matched_sku_id'] == "PTFE-TAPE-12" or line['matched_sku_id'] == "SCREW-WOOD-8-40":
            stock_html = "<span style='color:#dc2626; font-weight:600;'>Currently Unavailable</span>"
            
        html_lines.append(
            f"<tr>"
            f"<td>{html.escape(line['matched_sku_name'])}</td>"
            f"<td style='text-align: center;'>{qty}</td>"
            f"<td style='text-align: right;'>₹{price:.2f}</td>"
            f"<td style='text-align: right;'>₹{total:.2f}</td>"
            f"<td>{stock_html}</td>"
            f"</tr>"
        )
        
    html_lines.append("</tbody></table>")
    
    html_lines.append("<table class='summary-table'>")
    html_lines.append(f"<tr><td class='summary-label'>Subtotal:</td><td class='summary-value'>₹{raw_subtotal:.2f}</td></tr>")
    if discount_pct > 0:
        html_lines.append(f"<tr><td class='summary-label'>Special Discount ({int(discount_pct*100)}%):</td><td class='summary-value' style='color:#16a34a;'>-₹{discount_amt:.2f}</td></tr>")
        html_lines.append(f"<tr><td class='summary-label'>Net Amount:</td><td class='summary-value'>₹{net_subtotal:.2f}</td></tr>")
    html_lines.append(f"<tr><td class='summary-label'>GST (18%):</td><td class='summary-value'>₹{tax_amt:.2f}</td></tr>")
    html_lines.append(f"<tr class='total-row'><td>Total Payable:</td><td>₹{grand_total:.2f}</td></tr>")
    html_lines.append("</table>")
    
    html_lines.append("<p style='margin-top:20px;'>I have attached a detailed PDF quotation for your reference. It also includes a QR code for quick payment.</p>")
    html_lines.append("<p>If you'd like to discuss the pricing or need any changes, feel free to reply to this email &mdash; happy to help!</p>")
    
    html_lines.append("<div class='footer'>")
    if logo_cid:
        html_lines.append(f"<img src='cid:{logo_cid}' alt='{BUSINESS_NAME}' style='max-height: 50px; margin-bottom: 12px; display:block;'>")
    html_lines.append(f"Warm regards,<br><b>{SALES_EXECUTIVE_NAME}</b><br>{SALES_EXECUTIVE_TITLE} &nbsp;|&nbsp; {BUSINESS_NAME}<br><span style='color:#94a3b8;'>{SALES_EXECUTIVE_PHONE} &nbsp;&bull;&nbsp; {SALES_EXECUTIVE_EMAIL}</span>")
    html_lines.append("</div></body></html>")
    
    html_text = "\n".join(html_lines)
    
    return (plain_text, html_text), grand_total

def build_empty_reply_body(customer_name, logo_cid=None):
    """Formats a reply body for when no order items could be parsed (both Plain Text and HTML)."""
    # Plain text
    body = [
        f"Dear {customer_name},\n",
        "Thank you for getting in touch with us.\n",
        "We went through your message but had a bit of trouble identifying the specific items and quantities you need. Could you send us a clearer list so we can get you the pricing quickly?\n",
        "For example:",
        "  - 10 x Brass Threaded Elbow Fitting 1/2 Inch",
        "  - 5 x PTFE Teflon Seal Tape 12mm\n",
        "Once we have the details, we'll get back to you with the quote right away.",
        "\nWarm regards,",
        SALES_EXECUTIVE_NAME,
        f"{SALES_EXECUTIVE_TITLE} | {BUSINESS_NAME}",
        SALES_EXECUTIVE_PHONE
    ]
    plain_text = "\n".join(body)
    
    # HTML
    html_lines = [
        "<html><head><style>",
        "body { font-family: Arial, 'Helvetica Neue', sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 24px; font-size: 14px; }",
        ".footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 18px; color: #64748b; font-size: 13px; }",
        ".footer b { color: #1e293b; }",
        "</style></head><body>",
        f"<p>Dear {html.escape(customer_name)},</p>",
        "<p>Thank you for getting in touch with us.</p>",
        "<p>We went through your message but had a bit of trouble identifying the specific items and quantities you need. Could you send us a clearer list so we can get you the pricing quickly?</p>",
        "<p>For example:</p>",
        "<ul style='color:#334155;'>",
        "<li>10 x Brass Threaded Elbow Fitting 1/2 Inch</li>",
        "<li>5 x PTFE Teflon Seal Tape 12mm</li>",
        "</ul>",
        "<p>Once we have the details, we&#39;ll get back to you with the quote right away.</p>",
        "<div class='footer'>",
    ]
    if logo_cid:
        html_lines.append(f"<img src='cid:{logo_cid}' alt='{BUSINESS_NAME}' style='max-height: 50px; margin-bottom: 12px; display:block;'>")
    html_lines.append(f"Warm regards,<br><b>{SALES_EXECUTIVE_NAME}</b><br>{SALES_EXECUTIVE_TITLE} &nbsp;|&nbsp; {BUSINESS_NAME}<br><span style='color:#94a3b8;'>{SALES_EXECUTIVE_PHONE} &nbsp;&bull;&nbsp; {SALES_EXECUTIVE_EMAIL}</span>")
    html_lines.append("</div></body></html>")
    
    html_text = "\n".join(html_lines)
    return plain_text, html_text

def is_negotiation_msg(text):
    """Checks if the text contains negotiation-related keywords."""
    negotiation_keywords = ["discount", "off", "cheaper", "reduce", "less", "negotiat", "rate", "%", "deal", "better", "lower", "offer"]
    text_lower = text.lower()
    return any(kw in text_lower for kw in negotiation_keywords)

def extract_requested_discount(text):
    """Extracts requested discount percentage from message body using regex patterns."""
    # Pattern 1: 10%
    pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
    if pct_match:
        return float(pct_match.group(1))
    
    # Pattern 2: 10 percent
    pct_match_word = re.search(r'(\d+(?:\.\d+)?)\s*percent', text, re.IGNORECASE)
    if pct_match_word:
        return float(pct_match_word.group(1))
        
    # Pattern 3: discount of 10
    off_match = re.search(r'(?:discount|off|reduce)\s+(?:of\s+)?(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if off_match:
        return float(off_match.group(1))
        
    # Default to 5% if unspecified
    return 5.0

def process_incoming_email(sender, subject, body, catalog, crm_path, mode, project_root):
    """
    Main ingestion business logic. Parses the email body, matches SKUs, 
    manages CRM discounts, handles price negotiations, and returns the response.
    Returns: (reply_subject, reply_body_tuple, pdf_path, status)
    """
    body_clean = strip_email_history(body)
    
    import email.utils
    display_name, email_addr = email.utils.parseaddr(sender)
    if not email_addr:
        email_addr = sender
    
    # Check if this is a thread reply to an existing quotation
    quote_id_match = re.search(r'\[Quotation\s+#([A-Z0-9]+)\]', subject, re.IGNORECASE)
    
    meta_path = None
    meta = None
    existing_invoice_id = None
    
    if quote_id_match:
        existing_invoice_id = quote_id_match.group(1)
        meta_filename = f"Quote_{existing_invoice_id}_meta.json"
        
        # Meta files might be stored in static/quotes or in mock_outbox (simulation mode)
        meta_paths = [
            os.path.join(project_root, "static", "quotes", meta_filename),
            os.path.join(project_root, "mock_outbox", meta_filename)
        ]
        for p in meta_paths:
            if os.path.exists(p):
                meta_path = p
                try:
                    with open(p, 'r', encoding='utf-8') as f:
                        meta = json.load(f)
                    break
                except Exception:
                    pass

    # Process conversational thread replies if we have the quotation metadata
    if meta and existing_invoice_id:
        # 1. Check if this is a negotiation request (takes priority!)
        if is_negotiation_msg(body_clean):
            requested_discount = extract_requested_discount(body_clean)
            chat_history = meta.get("chat_history", [])
            chat_history.append({"sender": "customer", "text": body_clean})
            
            # Setup GenAI client for live mode if API key is valid
            api_key = os.environ.get("GEMINI_API_KEY")
            client = None
            is_live = False
            if api_key and api_key.strip() and not api_key.startswith("your_"):
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    is_live = True
                except Exception:
                    pass
            
            from src.negotiator import run_negotiation_step
            neg_result = run_negotiation_step(
                customer_message=body_clean,
                requested_discount=requested_discount,
                chat_history=chat_history,
                is_live=is_live,
                client=client
            )
            
            status = neg_result.get("status", "NEGOTIATING")
            approved_discount = neg_result.get("approved_discount", 0.0)
            reply_text = neg_result.get("reply", "")
            
            chat_history.append({"sender": "ai", "text": reply_text})
            meta["chat_history"] = chat_history
            
            pdf_out_path = None
            if status == "APPROVED":
                new_discount_pct = approved_discount / 100.0
                meta["discount_pct"] = new_discount_pct
                
                if mode == "mock":
                    pdf_out_path = os.path.join(project_root, "mock_outbox", f"Quote_{existing_invoice_id}.pdf")
                else:
                    pdf_out_path = os.path.join(project_root, "static", "quotes", f"Quote_{existing_invoice_id}.pdf")
                
                generate_pdf_quotation(
                    matched_lines=meta["matched_lines"],
                    discount_pct=new_discount_pct,
                    customer_name=meta["customer_name"],
                    invoice_id=existing_invoice_id,
                    output_path=pdf_out_path,
                    catalog=catalog
                )
                
                reply_body, grand_total = build_email_reply_body(
                    meta["matched_lines"],
                    new_discount_pct,
                    meta["customer_name"],
                    existing_invoice_id,
                    logo_cid="company_logo"
                )
                
                # Log to SQLite
                try:
                    from src.database_sqlite import update_quotation_status, log_chat_msg
                    update_quotation_status(existing_invoice_id, "NEGOTIATION_APPROVED", new_discount_pct)
                    log_chat_msg(existing_invoice_id, "customer", body_clean)
                    log_chat_msg(existing_invoice_id, "ai", reply_text)
                except Exception as e:
                    print(f"[Warning] SQLite logging failed: {e}")
                
                # Combine AI reply and table breakdown
                full_reply_plain = f"{reply_text}\n\n{reply_body[0]}"
                full_reply_html = f"<html><body><p>{reply_text.replace('\n', '<br>')}</p>{reply_body[1].replace('<html><body>', '').replace('</body></html>', '')}</body></html>"
                reply_payload = (full_reply_plain, full_reply_html)
            else:
                reply_payload = (reply_text, f"<html><body><p>{reply_text.replace('\n', '<br>')}</p></body></html>")
                
                # Log to SQLite
                try:
                    from src.database_sqlite import update_quotation_status, log_chat_msg
                    update_quotation_status(existing_invoice_id, f"NEGOTIATION_{status}")
                    log_chat_msg(existing_invoice_id, "customer", body_clean)
                    log_chat_msg(existing_invoice_id, "ai", reply_text)
                except Exception as e:
                    print(f"[Warning] SQLite logging failed: {e}")
                    
                # Write back meta updates for intermediate negotiation/escalation turns
                try:
                    with open(meta_path, 'w', encoding='utf-8') as f:
                        json.dump(meta, f, indent=2)
                except Exception:
                    pass
            
            reply_subject = clean_reply_subject(subject, invoice_id=existing_invoice_id)
            return reply_subject, reply_payload, pdf_out_path, f"NEGOTIATION_{status}"
            
        # 2. Check if the customer is modifying the quotation items (high-confidence items only!)
        matched_lines = run_scenario_free(body_clean, catalog)
        has_valid_matches = matched_lines and any(
            line['matched_sku_id'] != "UNKNOWN" and line['confidence'] >= 80.0 
            for line in matched_lines
        )
        
        if has_valid_matches:
            # Re-generate the quote with the new items under the same ID
            discount_pct = meta.get("discount_pct", 0.0)
            customer_name = meta.get("customer_name", "Walk-in Retail Client")
            customer_phone = meta.get("customer_phone", "—")
            
            # If body has a new phone number, extract it
            new_phone = extract_phone_number(body_clean)
            if new_phone:
                customer_phone = new_phone
                meta["customer_phone"] = customer_phone
            
            if mode == "mock":
                pdf_out_path = os.path.join(project_root, "mock_outbox", f"Quote_{existing_invoice_id}.pdf")
            else:
                pdf_out_path = os.path.join(project_root, "static", "quotes", f"Quote_{existing_invoice_id}.pdf")
                
            generate_pdf_quotation(matched_lines, discount_pct, customer_name, existing_invoice_id, pdf_out_path, catalog)
            reply_body, grand_total = build_email_reply_body(matched_lines, discount_pct, customer_name, existing_invoice_id, logo_cid="company_logo")
            
            # Log to SQLite
            try:
                from src.database_sqlite import log_quotation, log_quotation_item
                raw_subtotal = sum(i["quantity"] * i["unit_price"] for i in matched_lines if i["matched_sku_id"] != "UNKNOWN")
                discount_amt = raw_subtotal * discount_pct
                net_subtotal = raw_subtotal - discount_amt
                tax_amt = net_subtotal * 0.18
                
                log_quotation(
                    invoice_id=existing_invoice_id,
                    customer_name=customer_name,
                    customer_email=email_addr,
                    customer_phone=customer_phone,
                    subtotal=raw_subtotal,
                    discount_pct=discount_pct,
                    tax_amt=tax_amt,
                    grand_total=grand_total,
                    status="QUOTE_UPDATED"
                )
                for item in matched_lines:
                    if item["matched_sku_id"] != "UNKNOWN":
                        log_quotation_item(
                            invoice_id=existing_invoice_id,
                            sku_id=item["matched_sku_id"],
                            sku_name=item["matched_sku_name"],
                            quantity=item["quantity"],
                            unit_price=item["unit_price"],
                            line_total=item["quantity"] * item["unit_price"]
                        )
            except Exception as e:
                print(f"[Warning] SQLite logging failed: {e}")
                
            reply_subject = clean_reply_subject(subject, invoice_id=existing_invoice_id)
            return reply_subject, reply_body, pdf_out_path, "QUOTE_UPDATED"

        else:
            # Handle general conversational enquiry
            chat_history = meta.get("chat_history", [])
            chat_history.append({"sender": "customer", "text": body_clean})
            
            api_key = os.environ.get("GEMINI_API_KEY")
            client = None
            is_live = False
            if api_key and api_key.strip() and not api_key.startswith("your_"):
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    is_live = True
                except Exception:
                    pass
            
            if is_live and client:
                history_formatted = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[:-1]])
                prompt = f"""
                You are a sales assistant representing Trofeo Hardware.
                A customer is replying to their existing quotation #{existing_invoice_id}.
                
                Here is the quotation metadata:
                - Customer Name: {meta['customer_name']}
                - Current Discount Applied: {meta['discount_pct']*100}%
                - Items Quoted: {json.dumps(meta['matched_lines'])}
                
                Here is the conversation history:
                {history_formatted}
                
                Customer's latest reply: "{body_clean}"
                
                Write a concise, polite, and professional response. If they are confirming the order, thank them and let them know the team will prepare the final invoice for payment. If they are asking a product question, answer it if you can based on the items, or politely state you are forwarding this to a salesperson.
                """
                try:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt
                    )
                    reply_text = response.text.strip()
                except Exception:
                    reply_text = f"Thank you for your message. We have received your query regarding Quotation #{existing_invoice_id} and escalated it to our sales desk. A representative will contact you shortly."
            else:
                reply_text = f"Thank you for your message. We have received your query regarding Quotation #{existing_invoice_id} and escalated it to our sales desk. A representative will contact you shortly."
                
            chat_history.append({"sender": "ai", "text": reply_text})
            meta["chat_history"] = chat_history
            
            try:
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump(meta, f, indent=2)
            except Exception:
                pass
                
            reply_subject = clean_reply_subject(subject, invoice_id=existing_invoice_id)
            reply_payload = (reply_text, f"<html><body><p>{reply_text.replace('\n', '<br>')}</p></body></html>")
            return reply_subject, reply_payload, None, "CONVERSATIONAL_REPLY"

    # Default logic: Brand new quotation request
    matched_lines = run_scenario_free(body_clean, catalog)
    

    discount_pct, customer_name, customer_phone = get_crm_discount(email_addr, crm_path)
    if customer_name == "Walk-in Retail Client":
        if display_name:
            customer_name = display_name
        else:
            customer_name = email_addr.split('@')[0]
            
    # Extract phone number if present in email body
    extracted_phone = extract_phone_number(body_clean)
    if extracted_phone:
        customer_phone = extracted_phone
            
    invoice_id = str(int(time.time()) % 100000)
    
    has_valid_matches = matched_lines and any(
        line['matched_sku_id'] != "UNKNOWN" and line['confidence'] >= 80.0 
        for line in matched_lines
    )
    
    if has_valid_matches:
        if mode == "mock":
            pdf_out_path = os.path.join(project_root, "mock_outbox", f"Quote_{invoice_id}.pdf")
        else:
            pdf_out_path = os.path.join(project_root, "static", "quotes", f"Quote_{invoice_id}.pdf")
            
        generate_pdf_quotation(matched_lines, discount_pct, customer_name, invoice_id, pdf_out_path, catalog, customer_phone=customer_phone)
        reply_body, grand_total = build_email_reply_body(matched_lines, discount_pct, customer_name, invoice_id, logo_cid="company_logo")
        
        # Log to SQLite
        try:
            from src.database_sqlite import log_quotation, log_quotation_item
            raw_subtotal = sum(i["quantity"] * i["unit_price"] for i in matched_lines if i["matched_sku_id"] != "UNKNOWN")
            discount_amt = raw_subtotal * discount_pct
            net_subtotal = raw_subtotal - discount_amt
            tax_amt = net_subtotal * 0.18
            
            log_quotation(
                invoice_id=invoice_id,
                customer_name=customer_name,
                customer_email=email_addr,
                customer_phone=customer_phone,
                subtotal=raw_subtotal,
                discount_pct=discount_pct,
                tax_amt=tax_amt,
                grand_total=grand_total,
                status="QUOTE_GENERATED"
            )
            for item in matched_lines:
                if item["matched_sku_id"] != "UNKNOWN":
                    log_quotation_item(
                        invoice_id=invoice_id,
                        sku_id=item["matched_sku_id"],
                        sku_name=item["matched_sku_name"],
                        quantity=item["quantity"],
                        unit_price=item["unit_price"],
                        line_total=item["quantity"] * item["unit_price"]
                    )
        except Exception as e:
            print(f"[Warning] SQLite logging failed: {e}")
            
        reply_subject = clean_reply_subject(subject, invoice_id=invoice_id)
        return reply_subject, reply_body, pdf_out_path, "QUOTE_GENERATED"
    else:
        reply_body = build_empty_reply_body(customer_name, logo_cid="company_logo")
        reply_subject = clean_reply_subject(subject, is_unparsed=True)
        return reply_subject, reply_body, None, "UNPARSED_NOTICE"

def load_crm_emails(crm_path):
    """Loads email addresses of registered customers from CRM."""
    if not crm_path or not os.path.exists(crm_path):
        return set()
    try:
        with open(crm_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {email_addr.lower().strip() for email_addr in data.keys()}
    except Exception as e:
        print(f"[Warning] Failed to load CRM customer emails: {e}")
        return set()

def is_email_relevant(sender, subject, body, catalog, crm_emails):
    """
    Checks if an incoming email is relevant to Trofeo Hardware.
    An email is relevant if:
    1. Sender's email is in our CRM database.
    2. Subject contains a quotation reference (e.g. [Quotation #1635]) or is a reply.
    3. Subject contains standard quotation/sales keywords.
    4. Body contains any SKU ID from our catalog.
    5. Body contains any of our catalog product names/keywords.
    """
    sender_lower = sender.lower().strip()
    subject_lower = subject.lower().strip()
    body_lower = body.lower().strip() if body else ""
    
    # 1. Check if sender is a registered CRM client
    if sender_lower in crm_emails:
        print(f"[Email Filter] MATCH: Sender {sender} is a registered CRM client.")
        return True
        
    # 2. Check if subject has Quotation ID reference (e.g. Quotation #1635)
    if "quotation #" in subject_lower or "quote #" in subject_lower:
        print(f"[Email Filter] MATCH: Subject refers to an active quotation reference.")
        return True
        
    # 3. Check general sales/RFQ keywords in subject
    interest_keywords = [
        "enquiry", "inquiry", "order", "rfq", "quote", "purchase", "materials", "material", "request", 
        "quotation", "price", "pricing", "cost", "negotiate", "discount", "estimate", "invoice", "proforma", 
        "po", "billing", "rate", "rates", "rfp", "specsheet", "specification", "specifications", "tender", 
        "supplier", "vendor", "delivery", "leadtime", "lead time", "payment", "terms", "requisition", "valves",
        "fitting", "fittings", "bolts", "nuts", "screws", "fasteners", "washers"
    ]
    if any(kw in subject_lower for kw in interest_keywords):
        print(f"[Email Filter] MATCH: Subject matched interest keywords.")
        return True
        
    # 4. Check if body contains any SKU ID from the catalog
    for sku_id in catalog.skus.keys():
        if sku_id.lower() in body_lower:
            print(f"[Email Filter] MATCH: Body contains SKU ID '{sku_id}'.")
            return True
            
    # 5. Check if body contains catalog product keywords
    product_keywords = [
        # Plumbing / Fittings
        "elbow", "fitting", "coupling", "joint", "valve", "gate valve", "pipe", "nipple", "adapter", 
        "teflon", "ptfe", "gasket", "seal", "hose", "pvc", "brass", "copper", "union", "plumbing",
        # Fasteners
        "bolt", "nut", "screw", "washer", "fastener", "rivet", "anchor", "nail", "thread", "threaded",
        # Tools
        "hammer", "claw hammer", "level", "spirit level", "tape", "seal tape", "brush", "paint brush", 
        "tool", "tools", "wrench", "screwdriver", "pliers", "saw", "drill", "lubricant", "wd-40", "spray",
        # General Hardware Materials
        "hardware", "steel", "metal", "iron", "zinc", "silicone", "sealant", "adhesive", "mounting"
    ]
    for pk in product_keywords:
        if re.search(r'\b' + re.escape(pk) + r'\b', body_lower) or re.search(r'\b' + re.escape(pk) + r'\b', subject_lower):
            print(f"[Email Filter] MATCH: Message references product keyword '{pk}'.")
            return True
            
    return False

def send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject, body_text):
    """Sends a notification email to the Master/Admin user using the SMTP settings."""
    if not master_email or not email_user or not email_pass:
        return
        
    try:
        msg = MIMEMultipart()
        msg["From"] = email_user
        msg["To"] = master_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, 'plain'))
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        server.login(email_user, email_pass)
        server.sendmail(email_user, master_email, msg.as_string())
        server.close()
        print(f"[Master Notification] Sent notification to {master_email} (Subject: {subject})")
    except Exception as e:
        print(f"[Warning] Failed to send master notification: {e}")

def poll_email_inbox(catalog, crm_path, mode="mock"):
    """
    Main polling function. Checks for incoming mails (Live or Mock simulation).
    """
    project_root = os.path.dirname(os.path.dirname(crm_path))
    crm_emails = load_crm_emails(crm_path)
    
    if mode == "mock":
        inbox_dir = os.path.join(project_root, "mock_inbox")
        outbox_dir = os.path.join(project_root, "mock_outbox")
        os.makedirs(inbox_dir, exist_ok=True)
        os.makedirs(outbox_dir, exist_ok=True)
        
        files = [f for f in os.listdir(inbox_dir) if f.endswith(".txt")]
        if not files:
            return
            
        print(f"[Email Listener] Found {len(files)} new enquiry files in mock_inbox.")
        for file in files:
            file_path = os.path.join(inbox_dir, file)
            try:
                sender, subject, body = parse_mock_email(file_path)
                
                # Apply unified relevance check
                if not is_email_relevant(sender, subject, body, catalog, crm_emails):
                    print(f"[Email Filter] Skipped irrelevant mock email from {sender} (Subject: {subject})")
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    continue
                
                print(f"\n[Processing Mock Email] From: {sender} | Subject: {subject}")
                
                # Fetch master email credentials in case they want to test notifications in mock mode
                master_email = os.environ.get("MASTER_EMAIL")
                email_user = os.environ.get("EMAIL_USER")
                email_pass = os.environ.get("EMAIL_PASS")
                smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
                try:
                    smtp_port = int(os.environ.get("SMTP_PORT", 465))
                except (ValueError, TypeError):
                    smtp_port = 465
                
                # Extract details for notifications
                from email.utils import parseaddr
                display_name, email_addr = parseaddr(sender)
                _, crm_name, crm_phone = get_crm_discount(email_addr if email_addr else sender, crm_path)
                sender_name = crm_name
                if sender_name == "Walk-in Retail Client":
                    sender_name = display_name if display_name else (email_addr if email_addr else sender).split('@')[0]
                contact_phone = extract_phone_number(body)
                if not contact_phone:
                    contact_phone = crm_phone
                if not contact_phone:
                    contact_phone = "—"
                
                # 1. Notify Master User of incoming enquiry
                if master_email and email_user and email_pass and email_user.strip() and not email_user.startswith("your_"):
                    subject_notif = f"[Notification] New enquiry received from {sender_name}"
                    body_notif = (
                        f"Dear Master User,\n\n"
                        f"An enquiry email has been received and processed in mock mode.\n\n"
                        f"Customer Details:\n"
                        f"- Name: {sender_name}\n"
                        f"- Email: {email_addr if email_addr else sender}\n"
                        f"- Contact Number: {contact_phone}\n\n"
                        f"Original Message Subject: {subject}\n"
                        f"Original Message Body:\n"
                        f"--------------------------------------------------\n"
                        f"{body}\n"
                        f"--------------------------------------------------\n\n"
                        f"Regards,\n"
                        f"Trofeo Auto-bot"
                    )
                    send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject_notif, body_notif)

                reply_subject, reply_body_tuple, pdf_path, status = process_incoming_email(
                    sender, subject, body, catalog, crm_path, mode, project_root
                )
                
                if isinstance(reply_body_tuple, tuple):
                    plain_body = reply_body_tuple[0]
                else:
                    plain_body = reply_body_tuple
                
                # 2. Notify Master User of outgoing reply
                if master_email and email_user and email_pass and email_user.strip() and not email_user.startswith("your_"):
                    subject_reply_notif = f"[Notification] Reply sent to {sender_name}"
                    body_reply_notif = (
                        f"Dear Master User,\n\n"
                        f"The bot has successfully sent a reply to the customer's enquiry in mock mode.\n\n"
                        f"Customer Details:\n"
                        f"- Name: {sender_name}\n"
                        f"- Email: {email_addr if email_addr else sender}\n"
                        f"- Contact Number: {contact_phone}\n\n"
                        f"Reply Details:\n"
                        f"- Subject: {reply_subject}\n"
                        f"- Status: {status}\n\n"
                        f"Replied Message Content:\n"
                        f"--------------------------------------------------\n"
                        f"{plain_body}\n"
                        f"--------------------------------------------------\n\n"
                        f"Regards,\n"
                        f"Trofeo Auto-bot"
                    )
                    send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject_reply_notif, body_reply_notif)
                
                reply_filename = file.replace(".txt", "_reply.txt")
                reply_path = os.path.join(outbox_dir, reply_filename)
                
                with open(reply_path, 'w', encoding='utf-8') as rf:
                    rf.write(f"To: {sender}\n")
                    rf.write(f"Subject: {reply_subject}\n")
                    if pdf_path:
                        rf.write(f"Attachment: {os.path.basename(pdf_path)}\n")
                    rf.write("=" * 80 + "\n")
                    rf.write(plain_body)
                print(f"[Success] Processed (status: {status}). Written reply & quote to mock_outbox/.")
                
            except Exception as e:
                print(f"[Error] Failed to process mock email {file}: {e}")
            finally:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    
    else:
        # Live IMAP/SMTP Pipeline
        imap_server = os.environ.get("IMAP_SERVER", "imap.gmail.com")
        imap_port = int(os.environ.get("IMAP_PORT", 993))
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 465))
        email_user = os.environ.get("EMAIL_USER")
        email_pass = os.environ.get("EMAIL_PASS")
        
        if not email_user or not email_pass:
            print("[Email Listener] Error: Credentials missing in environment variables.")
            return
  
        try:
            mail = imaplib.IMAP4_SSL(imap_server, imap_port)
            mail.login(email_user, email_pass)
            mail.select("inbox")
            
            status, messages = mail.search(None, 'UNSEEN')
            if status == "OK" and messages[0]:
                mail_ids = messages[0].split()
                mail_ids = list(reversed(mail_ids))[:15]
                print(f"[Email Listener] Found {len(messages[0].split())} unread emails. Checking the 15 newest.")
                
                for m_id in mail_ids:
                    res, msg_data = mail.fetch(m_id, '(BODY[HEADER.FIELDS (SUBJECT FROM MESSAGE-ID)])')
                    if res != "OK" or not msg_data or not msg_data[0]:
                        continue
                    
                    raw_headers = msg_data[0][1]
                    msg_headers = email.message_from_bytes(raw_headers)
                    
                    subject_raw = msg_headers.get("Subject", "Order Enquiry")
                    
                    subject = ""
                    try:
                        parts = email.header.decode_header(subject_raw)
                        for part, encoding in parts:
                            if isinstance(part, bytes):
                                subject += part.decode(encoding or 'utf-8', errors='ignore')
                            else:
                                subject += part
                    except Exception:
                        subject = str(subject_raw)
                    
                    sender_header = msg_headers.get("From", "")
                    sender = email.utils.parseaddr(sender_header)[1]
                    msg_id = msg_headers.get("Message-ID")
                    
                    # Prevent infinite loop by skipping emails sent by ourselves
                    if email_user and sender.lower() == email_user.lower():
                        print(f"[Email Listener] Ignored email from ourselves ({sender}) to prevent loop.")
                        mail.store(m_id, '+FLAGS', '\\Seen')
                        continue
                    
                    res, msg_data = mail.fetch(m_id, '(RFC822)')
                    if res != "OK" or not msg_data or not msg_data[0]:
                        continue
                        
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                                break
                    else:
                        body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
                    
                    # Apply unified relevance check (skips if not matched)
                    if not is_email_relevant(sender, subject, body, catalog, crm_emails):
                        print(f"[Email Filter] Skipped irrelevant email from {sender} (Subject: {subject})")
                        mail.store(m_id, '+FLAGS', '\\Seen')
                        continue
                        
                    if not body.strip():
                        mail.store(m_id, '+FLAGS', '\\Seen')
                        continue
                        
                    print(f"\n[Processing Live Email] From: {sender} | Subject: {subject}")
                    
                    # Extract details for notifications
                    from email.utils import parseaddr
                    display_name, email_addr = parseaddr(sender_header)
                    _, crm_name, crm_phone = get_crm_discount(sender, crm_path)
                    sender_name = crm_name
                    if sender_name == "Walk-in Retail Client":
                        sender_name = display_name if display_name else sender.split('@')[0]
                    contact_phone = extract_phone_number(body)
                    if not contact_phone:
                        contact_phone = crm_phone
                    if not contact_phone:
                        contact_phone = "—"
                        
                    # 1. Notify Master User of incoming enquiry
                    master_email = os.environ.get("MASTER_EMAIL")
                    if master_email and email_user and email_pass:
                        subject_notif = f"[Notification] New enquiry received from {sender_name}"
                        body_notif = (
                            f"Dear Master User,\n\n"
                            f"An enquiry email has been received and processed.\n\n"
                            f"Customer Details:\n"
                            f"- Name: {sender_name}\n"
                            f"- Email: {sender}\n"
                            f"- Contact Number: {contact_phone}\n\n"
                            f"Original Message Subject: {subject}\n"
                            f"Original Message Body:\n"
                            f"--------------------------------------------------\n"
                            f"{body}\n"
                            f"--------------------------------------------------\n\n"
                            f"Regards,\n"
                            f"Trofeo Auto-bot"
                        )
                        send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject_notif, body_notif)
                    
                    reply_subject, reply_body_tuple, pdf_path, status = process_incoming_email(
                        sender_header, subject, body, catalog, crm_path, mode, project_root
                    )
                    
                    if isinstance(reply_body_tuple, tuple):
                        plain_body, html_body = reply_body_tuple
                    else:
                        plain_body = reply_body_tuple
                        html_body = f"<html><body><p>{plain_body.replace('\n', '<br>')}</p></body></html>"
                    
                    reply_msg = MIMEMultipart()
                    reply_msg["From"] = email_user
                    reply_msg["To"] = sender
                    reply_msg["Subject"] = reply_subject
                    
                    if msg_id:
                        reply_msg["In-Reply-To"] = msg_id
                        reply_msg["References"] = msg_id
                        
                    # Setup alternative part container
                    msg_alt = MIMEMultipart('alternative')
                    msg_alt.attach(MIMEText(plain_body, 'plain'))
                    msg_alt.attach(MIMEText(html_body, 'html'))
                    reply_msg.attach(msg_alt)
                    
                    # Attach logo image inline
                    logo_path = find_company_logo(project_root)
                    if logo_path and os.path.exists(logo_path):
                        try:
                            from email.mime.image import MIMEImage
                            with open(logo_path, 'rb') as f:
                                logo_img = MIMEImage(f.read())
                            logo_img.add_header('Content-ID', '<company_logo>')
                            logo_img.add_header('Content-Disposition', 'inline', filename=os.path.basename(logo_path))
                            reply_msg.attach(logo_img)
                        except Exception as le:
                            print(f"[Warning] Failed to attach inline logo: {le}")
                    
                    if pdf_path:
                        with open(pdf_path, "rb") as f:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(pdf_path)}")
                        reply_msg.attach(part)
                    
                    # Send via SMTP
                    if smtp_port == 465:
                        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
                    else:
                        server = smtplib.SMTP(smtp_server, smtp_port)
                        server.starttls()
                    server.login(email_user, email_pass)
                    server.sendmail(email_user, sender, reply_msg.as_string())
                    server.close()
                    
                    mail.store(m_id, '+FLAGS', '\\Seen')
                    print(f"[Success] Processed email from {sender} (status: {status}) and sent reply via SMTP.")
                    
                    # 2. Notify Master User of outgoing reply
                    if master_email and email_user and email_pass:
                        subject_reply_notif = f"[Notification] Reply sent to {sender_name}"
                        body_reply_notif = (
                            f"Dear Master User,\n\n"
                            f"The bot has successfully sent a reply to the customer's enquiry.\n\n"
                            f"Customer Details:\n"
                            f"- Name: {sender_name}\n"
                            f"- Email: {sender}\n"
                            f"- Contact Number: {contact_phone}\n\n"
                            f"Reply Details:\n"
                            f"- Subject: {reply_subject}\n"
                            f"- Status: {status}\n\n"
                            f"Replied Message Content:\n"
                            f"--------------------------------------------------\n"
                            f"{plain_body}\n"
                            f"--------------------------------------------------\n\n"
                            f"Regards,\n"
                            f"Trofeo Auto-bot"
                        )
                        send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject_reply_notif, body_reply_notif)
                    
            # Now, enter native IMAP IDLE to wait for new emails (real-time push)
            print("[Email Listener] Entering IDLE state to wait for real-time emails...")
            import select
            
            # Send IDLE command
            tag = mail._new_tag().decode()
            mail.send(f'{tag} IDLE\r\n'.encode())
            
            # Read continuation response "+ idling"
            response = mail.readline()
            if b'+' in response:
                sock = mail.socket()
                # Wait up to 30 seconds for socket data
                ready, _, _ = select.select([sock], [], [], 30)
                if ready:
                    print("[Email Listener] Real-time email event detected!")
                    
            # Send DONE to exit IDLE
            mail.send(b'DONE\r\n')
            # Read tagged response
            mail.readline()
            
            mail.close()
            mail.logout()
            
        except Exception as e:
            print(f"[Email Listener Error] Live processing crashed: {e}")
