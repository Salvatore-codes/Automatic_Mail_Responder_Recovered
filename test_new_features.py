"""
Quick targeted smoke-test for the new features:
  1. unmatched_items DB schema migration works
  2. log_unmatched_item() stores a row correctly
  3. get_all_unmatched_items() retrieves it
  4. get_unmatched_items_count() returns correct count
  5. extract_text_from_attachments() with no attachments returns empty string
  6. is_email_relevant() respects attachment_text parameter
"""
import os
import sys
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── 1. DB import (triggers init_db / migration)
from src.database_sqlite import (
    log_unmatched_item,
    get_all_unmatched_items,
    get_unmatched_items_count,
    DB_PATH
)

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

def check(title, cond):
    print(f"[{PASS if cond else FAIL}] {title}")
    return 1 if cond else 0

passes = 0
total  = 0

# ── 2. DB file exists after init
total += 1
passes += check("DB file created by init_db()", os.path.exists(DB_PATH))

# ── 3. unmatched_items table has correct columns
conn = sqlite3.connect(DB_PATH)
cols = {row[1] for row in conn.execute("PRAGMA table_info(unmatched_items)")}
conn.close()

total += 1
passes += check(
    "unmatched_items has all new columns",
    {"customer_email", "customer_name", "original_body", "source", "created_at"}.issubset(cols)
)

# ── 4. log_unmatched_item writes correctly
log_unmatched_item(
    customer_email="testbuyer@example.com",
    customer_name="Test Buyer",
    original_body="Please quote: 10 x Tungsten-Carbide Widget Mk-V",
    source="mock_email"
)
total += 1
passes += check("log_unmatched_item() does not raise", True)

# ── 5. get_all_unmatched_items retrieves the row
items = get_all_unmatched_items(limit=10)
total += 1
passes += check(
    "get_all_unmatched_items() returns at least 1 row",
    len(items) >= 1
)

if items:
    row = next((i for i in items if i.get("customer_email") == "testbuyer@example.com"), None)
    total += 1
    passes += check(
        "logged row has correct customer_name",
        row is not None and row.get("customer_name") == "Test Buyer"
    )
    total += 1
    passes += check(
        "logged row has correct source field",
        row is not None and row.get("source") == "mock_email"
    )

# ── 6. get_unmatched_items_count()
count = get_unmatched_items_count()
total += 1
passes += check("get_unmatched_items_count() returns >= 1", count >= 1)

# ── 7. extract_text_from_attachments returns empty when no API key set
os.environ.pop("GEMINI_API_KEY", None)
from email.message import Message
from src.email_listener import extract_text_from_attachments
msg = Message()
result = extract_text_from_attachments(msg)
total += 1
passes += check(
    "extract_text_from_attachments() returns '' when GEMINI_API_KEY not set",
    result == ""
)

# ── 8. is_email_relevant respects attachment_text
from src.database import Catalog
from src.email_listener import is_email_relevant

project_root = os.path.dirname(os.path.abspath(__file__))
catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
catalog = Catalog(catalog_path)

# Email with no body keywords but attachment text has a product keyword
total += 1
passes += check(
    "is_email_relevant() returns True when attachment_text contains 'elbow fitting'",
    is_email_relevant(
        sender="stranger@other.com",
        subject="Hello",
        body="Please see attached.",
        catalog=catalog,
        crm_emails=set(),
        attachment_text="1. Brass elbow fitting 1/2 inch x 20 pcs"
    )
)

# Email with no relevant content at all
total += 1
passes += check(
    "is_email_relevant() returns False for completely irrelevant email",
    not is_email_relevant(
        sender="stranger@other.com",
        subject="Hello there how are you",
        body="Hope you are doing well.",
        catalog=catalog,
        crm_emails=set(),
        attachment_text=""
    )
)

# ── 9. processed_messages tracking tests
from src.database_sqlite import is_message_processed, log_processed_message
import uuid

test_msg_id = f"<test-{uuid.uuid4()}@example.com>"
total += 1
passes += check(
    "is_message_processed() returns False for unseen message ID",
    not is_message_processed(test_msg_id)
)

log_processed_message(test_msg_id, "12345")
total += 1
passes += check(
    "is_message_processed() returns True after log_processed_message()",
    is_message_processed(test_msg_id)
)

print()
print(f"Results: {passes}/{total} tests passed.")
sys.exit(0 if passes == total else 1)
