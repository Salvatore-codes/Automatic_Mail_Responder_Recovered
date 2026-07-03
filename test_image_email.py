"""
One-shot test: Connect to Gmail, find the image-only email, and test attachment extraction.
Does NOT enter IDLE loop - just runs once and exits.
"""
import os
import sys
import imaplib
import email
import email.utils
import email.header

# Load .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, val = line.partition('=')
                os.environ.setdefault(key.strip(), val.strip())

sys.path.insert(0, os.path.dirname(__file__))

from src.database import Catalog
from src.email_listener import (
    extract_text_from_attachments, has_attachments, is_email_relevant,
    process_incoming_email, load_crm_emails, get_crm_discount, extract_phone_number
)

print("=" * 70)
print("ONE-SHOT ATTACHMENT PROCESSING TEST")
print("=" * 70)

catalog = Catalog(os.path.join(os.path.dirname(__file__), 'data', 'sku_catalog.csv'))
crm_path = os.path.join(os.path.dirname(__file__), 'data', 'crm_customers.json')
crm_emails = load_crm_emails(crm_path)
project_root = os.path.dirname(__file__)

email_user = os.environ.get("EMAIL_USER")
email_pass = os.environ.get("EMAIL_PASS")
imap_server = os.environ.get("IMAP_SERVER", "imap.gmail.com")

print(f"Connecting to {imap_server} as {email_user}...")
mail = imaplib.IMAP4_SSL(imap_server, 993)
mail.login(email_user, email_pass)
mail.select("inbox")

# Search for the specific image email (SEEN emails from rajarajansvelora@gmail.com)
status, messages = mail.search(None, 'ALL')
mail_ids = list(reversed(messages[0].split()))[:30]  # Check last 30

target_id = None
for m_id in mail_ids:
    res, hdr_data = mail.fetch(m_id, '(BODY[HEADER.FIELDS (SUBJECT FROM)])')
    if res != 'OK':
        continue
    hdr = email.message_from_bytes(hdr_data[0][1])
    subj_raw = hdr.get("Subject", "")
    subj_parts = email.header.decode_header(subj_raw)
    subj = ""
    for part, enc in subj_parts:
        subj += part.decode(enc or 'utf-8', errors='ignore') if isinstance(part, bytes) else part
    frm = hdr.get("From", "")
    
    if "product attached in image" in subj.lower() or "I want this below product" in subj:
        print(f"\n>>> Found target email: '{subj}' from {frm}")
        target_id = m_id
        break

if not target_id:
    print("Target email not found. Checking last 5 emails instead...")
    for m_id in mail_ids[:5]:
        res, hdr_data = mail.fetch(m_id, '(BODY[HEADER.FIELDS (SUBJECT FROM)])')
        hdr = email.message_from_bytes(hdr_data[0][1])
        subj_raw = hdr.get("Subject", "")
        subj_parts = email.header.decode_header(subj_raw)
        subj = ""
        for part, enc in subj_parts:
            subj += part.decode(enc or 'utf-8', errors='ignore') if isinstance(part, bytes) else part
        frm = hdr.get("From", "")
        print(f"  Email: '{subj}' from {frm}")
        if "rajarajansvelora" in frm.lower():
            target_id = m_id
            print(f"  => Using this email for test")
            break

if target_id:
    res, msg_data = mail.fetch(target_id, '(RFC822)')
    raw_email = msg_data[0][1]
    msg = email.message_from_bytes(raw_email)
    
    sender_header = msg.get("From", "")
    sender = email.utils.parseaddr(sender_header)[1]
    subject = ""
    subj_raw = msg.get("Subject", "")
    subj_parts = email.header.decode_header(subj_raw)
    for part, enc in subj_parts:
        subject += part.decode(enc or 'utf-8', errors='ignore') if isinstance(part, bytes) else part

    print(f"\nFrom: {sender}")
    print(f"Subject: {subject}")

    # Extract body
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
    else:
        body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

    print(f"\nEmail body (raw): '{body.strip()[:200]}'")
    
    # Check for attachments
    email_has_attach = has_attachments(msg)
    print(f"\nHas attachments: {email_has_attach}")
    
    # Check relevance BEFORE attachment extraction
    rel_before = is_email_relevant(sender, subject, body, catalog, crm_emails, 
                                    attachment_text="", email_has_attachments=email_has_attach)
    print(f"Relevant (before attachment extraction): {rel_before}")
    
    if rel_before:
        print("\n>>> EXTRACTING ATTACHMENT TEXT via Gemini...")
        attachment_text = extract_text_from_attachments(msg)
        print(f"\nAttachment text extracted:\n{attachment_text[:500] if attachment_text else 'NONE'}")
        
        if attachment_text:
            body = (body + "\n\n" + attachment_text).strip()
            print(f"\nCombined body for processing:\n{body[:500]}")
        
        if body.strip():
            print("\n>>> PROCESSING EMAIL...")
            reply_subject, reply_body_tuple, pdf_path, status = process_incoming_email(
                sender_header, subject, body, catalog, crm_path, "live", project_root
            )
            print(f"\n>>> STATUS: {status}")
            print(f">>> Reply Subject: {reply_subject}")
            if isinstance(reply_body_tuple, tuple):
                print(f">>> Reply Body (first 300 chars):\n{reply_body_tuple[0][:300]}")
        else:
            print("Body is empty even after attachment extraction - cannot process.")
    else:
        print("Email not considered relevant - would be skipped.")

mail.close()
mail.logout()
print("\n>>> Test complete.")
