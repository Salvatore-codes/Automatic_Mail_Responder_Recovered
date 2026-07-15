import os
import sqlite3
import datetime

def get_now_ist_str():
    tz_ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    return datetime.datetime.now(tz_ist).strftime("%Y-%m-%d %H:%M:%S")


# Database Path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "trofeo_sales.db")

INITIALIZED_DBS = set()

def get_connection(tenant_id=None):
    # Always use the main database file to share tables, logs, and vertical profiles
    os.makedirs(DB_DIR, exist_ok=True)
    db_path = DB_PATH
    
    from src.tenants import sanitize_tenant_id
    t_id = sanitize_tenant_id(tenant_id)
    db_key = t_id
    if db_key not in INITIALIZED_DBS:
        INITIALIZED_DBS.add(db_key)
        print(f"[Database] Initializing database at path: {os.path.abspath(db_path)}")
        conn = sqlite3.connect(db_path, timeout=30.0)
        try:
            conn.execute("PRAGMA journal_mode=WAL")
        except Exception:
            pass
        conn.row_factory = sqlite3.Row
        init_db_conn(conn)
        conn.close()
        
    conn = sqlite3.connect(db_path, timeout=30.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
    except Exception:
        pass
    conn.row_factory = sqlite3.Row
    return conn

def init_db_conn(conn):
    cursor = conn.cursor()
    
    # 1. Quotations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quotations (
        invoice_id TEXT PRIMARY KEY,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        subtotal REAL,
        discount_pct REAL,
        tax_amt REAL,
        grand_total REAL,
        status TEXT,
        source TEXT DEFAULT 'email',
        created_at TEXT
    )
    """)
    
    # Check if customer_phone column exists (backward compatibility for existing DBs)
    try:
        cursor.execute("ALTER TABLE quotations ADD COLUMN customer_phone TEXT")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    # Check if source column exists (backward compatibility for existing DBs)
    try:
        cursor.execute("ALTER TABLE quotations ADD COLUMN source TEXT DEFAULT 'email'")
    except sqlite3.OperationalError:
        # Column already exists
        pass
        
    # 2. Quotation items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quotation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT,
        sku_id TEXT,
        sku_name TEXT,
        quantity INTEGER,
        unit_price REAL,
        line_total REAL,
        FOREIGN KEY (invoice_id) REFERENCES quotations (invoice_id) ON DELETE CASCADE
    )
    """)
    
    # 3. Chat logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT,
        sender TEXT,
        message TEXT,
        timestamp TEXT,
        FOREIGN KEY (invoice_id) REFERENCES quotations (invoice_id) ON DELETE CASCADE
    )
    """)
    
    # 4. Synonyms table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS synonyms (
        query TEXT PRIMARY KEY,
        sku_id TEXT,
        created_at TEXT
    )
    """)
    
    # 5. Unmatched items table (for manual supervisor followups)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unmatched_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_email TEXT,
        customer_name TEXT,
        original_body TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Backward-compat: add columns if they were missing from older schema
    for col_def in [
        ("customer_name", "TEXT"),
        ("original_body", "TEXT"),
        ("source", "TEXT"),
    ]:
        try:
            cursor.execute(f"ALTER TABLE unmatched_items ADD COLUMN {col_def[0]} {col_def[1]}")
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    # 6. Processed messages table to track processed emails by Message-ID
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processed_messages (
        message_id TEXT PRIMARY KEY,
        invoice_id TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    for _col_name in ["received_at", "customer_name", "customer_email"]:
        try:
            cursor.execute(f"ALTER TABLE processed_messages ADD COLUMN {_col_name} TEXT")
        except sqlite3.OperationalError:
            pass
    
    # 7. Deficits table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deficits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT,
        sku_id TEXT,
        sku_name TEXT,
        requested_qty INTEGER,
        available_qty INTEGER,
        deficit_qty INTEGER,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 8. Inventory logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku_id TEXT,
        sku_name TEXT,
        old_stock INTEGER,
        new_stock INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 9. Service status table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS service_status (
        service_name TEXT PRIMARY KEY,
        status TEXT,
        last_seen TIMESTAMP,
        error_message TEXT
    )
    """)
    
    # 10. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    # 11. Activity log table (structured event log for the dashboard)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        invoice_id TEXT,
        customer_name TEXT,
        customer_email TEXT,
        description TEXT,
        timestamp TEXT
    )
    """)
    # Backward-compat: add missing columns if DB was created before this table
    for _col in [("customer_name", "TEXT"), ("customer_email", "TEXT"), ("description", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE activity_log ADD COLUMN {_col[0]} {_col[1]}")
        except Exception:
            pass

    # 12. Tier pricing rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tier_pricing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT DEFAULT 'default',
        tier TEXT,
        category TEXT,
        discount_pct REAL
    )
    """)

    # 13. Customer custom prices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customer_custom_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT DEFAULT 'default',
        customer_email TEXT,
        sku_id TEXT,
        custom_price REAL
    )
    """)

    # 14. Vertical profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vertical_profiles (
        id TEXT PRIMARY KEY,
        name TEXT,
        industry TEXT,
        guidelines TEXT,
        tone TEXT,
        catalog_path TEXT,
        crm_path TEXT,
        source_details TEXT,
        is_active INTEGER DEFAULT 0,
        logo_path TEXT,
        business_type TEXT DEFAULT 'Trading'
    )
    """)

    # Ensure logo_path and business_type columns exist (migration safety)
    try:
        cursor.execute("ALTER TABLE vertical_profiles ADD COLUMN logo_path TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE vertical_profiles ADD COLUMN business_type TEXT DEFAULT 'Trading'")
    except sqlite3.OperationalError:
        pass

    # Seed default vertical profile if table is empty
    cursor.execute("SELECT COUNT(*) FROM vertical_profiles")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO vertical_profiles (id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "hardware",
            "Trofeo Hardware Solution",
            "Industrial Hardware & Tools",
            "Analyze customer order enquiries for hardware items like bolts, nuts, elbows, etc.",
            "Professional & Helpful",
            "data/sku_catalog.csv",
            "data/crm_customers.json",
            "Default seeded hardware profile",
            1
        ))

    conn.commit()

def init_db(tenant_id=None):
    conn = get_connection(tenant_id)
    conn.close()

def log_quotation(invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, source='email', tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    
    cursor.execute("""
    INSERT OR REPLACE INTO quotations (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, source, now_str))
    
    conn.commit()
    conn.close()

def log_quotation_item(invoice_id, sku_id, sku_name, quantity, unit_price, line_total, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (invoice_id, sku_id, sku_name, quantity, unit_price, line_total))
    
    conn.commit()
    conn.close()

def log_chat_msg(invoice_id, sender, message, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    
    cursor.execute("""
    INSERT INTO chat_logs (invoice_id, sender, message, timestamp)
    VALUES (?, ?, ?, ?)
    """, (invoice_id, sender, message, now_str))
    
    conn.commit()
    conn.close()

def update_quotation_status(invoice_id, status, discount_pct=None, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    if discount_pct is not None:
        # Recompute subtotal, net, tax, and total based on new discount percentage
        cursor.execute("SELECT subtotal FROM quotations WHERE invoice_id = ?", (invoice_id,))
        row = cursor.fetchone()
        if row:
            subtotal = row[0]
            discount_amt = subtotal * discount_pct
            net_subtotal = subtotal - discount_amt
            tax_amt = net_subtotal * 0.18
            grand_total = net_subtotal + tax_amt
            
            cursor.execute("""
            UPDATE quotations 
            SET status = ?, discount_pct = ?, tax_amt = ?, grand_total = ? 
            WHERE invoice_id = ?
            """, (status, discount_pct, tax_amt, grand_total, invoice_id))
    else:
        cursor.execute("UPDATE quotations SET status = ? WHERE invoice_id = ?", (status, invoice_id))
        
    conn.commit()
    conn.close()

def log_synonym(query, sku_id, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    
    cursor.execute("""
    INSERT OR REPLACE INTO synonyms (query, sku_id, created_at)
    VALUES (?, ?, ?)
    """, (query.lower().strip(), sku_id, now_str))
    
    conn.commit()
    conn.close()

def get_synonyms_from_db(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    cursor.execute("SELECT query, sku_id FROM synonyms")
    rows = cursor.fetchall()
    
    synonyms = {}
    for row in rows:
        synonyms[row["query"]] = row["sku_id"]
        
    conn.close()
    return synonyms

def log_unmatched_item(customer_email, customer_name, original_body, source="unknown", tenant_id=None):
    """
    Logs an enquiry that the bot could not match to any catalogue SKU.
    The full original body (which may contain text extracted from attachments)
    is stored so the master can review and quote manually.
    """
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    cursor.execute("""
    INSERT INTO unmatched_items (customer_email, customer_name, original_body, source, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (customer_email, customer_name, original_body, source, now_str))
    last_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return last_id

def get_all_unmatched_items(limit=100, tenant_id=None):
    """Returns recent unmatched enquiries for use in reports and the dashboard."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, customer_email, customer_name, original_body, source, created_at
        FROM unmatched_items
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    items = [dict(row) for row in rows]
    conn.close()
    return items

def delete_unmatched_item(item_id, tenant_id=None):
    """Deletes an unmatched item by its database ID once resolved."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM unmatched_items WHERE id = ?", (item_id,))
        conn.commit()
    except Exception as e:
        print(f"[Database] Failed to delete unmatched item {item_id}: {e}")
    finally:
        conn.close()


def get_unmatched_items_count(tenant_id=None):
    """Returns count of unmatched enquiries for dashboard stats."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM unmatched_items")
    row = cursor.fetchone()
    conn.close()
    return row["cnt"] if row else 0

def is_message_processed(message_id, tenant_id=None):
    """Checks if a given Message-ID has already been processed."""
    if not message_id:
        return False
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM processed_messages WHERE message_id = ?", (message_id.strip(),))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def log_processed_message(message_id, invoice_id, received_at=None, tenant_id=None, customer_name=None, customer_email=None):
    """Logs a processed Message-ID mapping it to the quotation sequence number.
    Returns True if successfully logged/inserted, or False if unique constraint failed (already locked by another process).
    """
    if not message_id:
        return False
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    try:
        # Check if row already exists to avoid resetting processed_at
        cursor.execute("SELECT invoice_id FROM processed_messages WHERE message_id = ?", (message_id.strip(),))
        row = cursor.fetchone()
        exists = row is not None
        
        if exists:
            # If we are trying to acquire the lock ("PROCESSING") but it already exists, return False
            if invoice_id == "PROCESSING":
                conn.close()
                return False
            
            if received_at:
                cursor.execute("""
                UPDATE processed_messages 
                SET invoice_id = ?, received_at = ?, customer_name = ?, customer_email = ?
                WHERE message_id = ?
                """, (invoice_id, received_at, customer_name, customer_email, message_id.strip()))
            else:
                cursor.execute("""
                UPDATE processed_messages 
                SET invoice_id = ?, customer_name = ?, customer_email = ?
                WHERE message_id = ?
                """, (invoice_id, customer_name, customer_email, message_id.strip()))
        else:
            now_str = get_now_ist_str()
            cursor.execute("""
            INSERT INTO processed_messages (message_id, invoice_id, received_at, customer_name, customer_email, processed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (message_id.strip(), invoice_id, received_at, customer_name, customer_email, now_str))
            
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        # Unique constraint failed - locked by another process
        try:
            conn.rollback()
        except Exception:
            pass
        conn.close()
        return False
    except Exception as e:
        print(f"[Warning] log_processed_message failed: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
        conn.close()
        return False

def generate_next_invoice_id(tenant_id=None):
    """
    Generates the next sequential invoice ID in the format QTN-XXXXX.
    e.g., QTN-00001, QTN-00002...
    """
    import time
    conn = get_connection(tenant_id=tenant_id)
    cursor = conn.cursor()
    try:
        # We search for invoice_ids starting with 'QTN-'
        cursor.execute("SELECT invoice_id FROM quotations WHERE invoice_id LIKE 'QTN-%' ORDER BY invoice_id DESC")
        rows = cursor.fetchall()
        max_num = 0
        for r in rows:
            inv_id = r["invoice_id"]
            try:
                # Extract number part
                num_part = inv_id.split("-")[1]
                num = int(num_part)
                if num > max_num:
                    max_num = num
            except Exception:
                pass
        next_num = max_num + 1
        return f"QTN-{next_num:05d}"
    except Exception:
        # Fallback to a timestamp-based organized ID if table or query fails
        return f"QTN-{int(time.time()) % 100000:05d}"
    finally:
        conn.close()

# Initialize default DB on import
init_db()

def log_deficit(invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    cursor.execute("""
    INSERT INTO deficits (invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    """, (invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone, now_str))
    conn.commit()
    conn.close()

def get_all_deficits(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone, status, created_at
    FROM deficits
    ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    items = [dict(row) for row in rows]
    conn.close()
    return items

def resolve_deficit(deficit_id, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("UPDATE deficits SET status = 'RESOLVED' WHERE id = ?", (deficit_id,))
    conn.commit()
    conn.close()

def get_escalated_negotiations(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, created_at
    FROM quotations
    WHERE status IN ('NEGOTIATION_ESCALATED', 'NEGOTIATION_NEGOTIATING')
    ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    items = [dict(row) for row in rows]
    conn.close()
    return items

def log_inventory_update(sku_id, sku_name, old_stock, new_stock, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    cursor.execute("""
    INSERT INTO inventory_logs (sku_id, sku_name, old_stock, new_stock, updated_at)
    VALUES (?, ?, ?, ?, ?)
    """, (sku_id, sku_name, old_stock, new_stock, now_str))
    conn.commit()
    conn.close()

def get_inventory_logs(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, sku_id, sku_name, old_stock, new_stock, updated_at
        FROM inventory_logs
        ORDER BY updated_at DESC
        LIMIT 100
    """)
    rows = cursor.fetchall()
    items = [dict(row) for row in rows]
    conn.close()
    return items


def update_service_status(status, error_message=None, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    cursor.execute("""
        INSERT OR REPLACE INTO service_status (service_name, status, last_seen, error_message)
        VALUES (?, ?, ?, ?)
    """, ("email_listener", status, now_str, error_message))
    conn.commit()
    conn.close()


def get_service_status(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status, last_seen, error_message FROM service_status WHERE service_name = ?", ("email_listener",))
        row = cursor.fetchone()
        if row:
            return dict(row)
    except Exception:
        pass
    finally:
        conn.close()
    return {"status": "UNKNOWN", "last_seen": None, "error_message": None}


def get_latest_message_id(invoice_id, tenant_id=None):
    """Retrieves the latest processed Message-ID for a given invoice_id."""
    if not invoice_id:
        return None
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    clean_id = invoice_id
    if clean_id.startswith("CUSTOMER_REPLIED:"):
        clean_id = clean_id.split(":", 1)[1]
    try:
        cursor.execute("""
            SELECT message_id FROM processed_messages 
            WHERE invoice_id = ? OR invoice_id = ? OR invoice_id = ?
            ORDER BY processed_at DESC LIMIT 1
        """, (clean_id, f"CUSTOMER_REPLIED:{clean_id}", f"CUSTOMER_REPLIED:{clean_id}"))
        row = cursor.fetchone()
        return row["message_id"] if row else None
    except Exception as e:
        print(f"[Warning] SQLite Message-ID lookup failed: {e}")
        return None
    finally:
        conn.close()


def log_activity(event_type, invoice_id=None, customer_name=None, customer_email=None, description=None, tenant_id=None):
    """Logs a structured activity event to the activity_log table."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = get_now_ist_str()
    try:
        cursor.execute("""
        INSERT INTO activity_log (event_type, invoice_id, customer_name, customer_email, description, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (event_type, invoice_id, customer_name, customer_email, description, now_str))
        conn.commit()
    except Exception as e:
        print(f"[ActivityLog] Failed to log activity: {e}")
    finally:
        conn.close()


def get_activity_log(limit=200, tenant_id=None):
    """Returns the most recent structured activity log entries for the dashboard."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, event_type, invoice_id, customer_name, customer_email, description, timestamp
            FROM activity_log
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[ActivityLog] Failed to fetch activity log: {e}")
        return []
    finally:
        conn.close()


def get_chat_history_for_context(invoice_id, tenant_id=None, max_entries=20):
    """Builds a plain-text conversation summary from chat_logs for AI context injection.
    
    Returns a multi-line string like:
        [Customer - 2026-07-06 11:23 IST]: I need 10 brass elbows...
        [Bot - 2026-07-06 11:23 IST]: Quotation QTN-00123 generated. Total: Rs.1450...
    or empty string if no prior history.
    """
    if not invoice_id:
        return ""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT sender, message, timestamp
            FROM chat_logs
            WHERE invoice_id = ?
            ORDER BY timestamp ASC
            LIMIT ?
        """, (invoice_id, max_entries))
        rows = cursor.fetchall()
        if not rows:
            return ""
        lines = []
        for row in rows:
            sender_label = row["sender"].upper() if row["sender"] else "UNKNOWN"
            ts = row["timestamp"] or ""
            msg = (row["message"] or "").strip()[:500]  # cap per-message to 500 chars
            lines.append(f"[{sender_label} - {ts} IST]: {msg}")
        return "\n".join(lines)
    except Exception as e:
        print(f"[ChatHistory] Failed to fetch thread context: {e}")
        return ""
    finally:
        conn.close()


def get_setting(key, default_value=None, tenant_id=None):
    """Retrieves a configuration setting value from the settings table."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        if row:
            return row["value"]
    except Exception as e:
        print(f"[Database] Error reading setting {key}: {e}")
    finally:
        conn.close()
    return default_value


def set_setting(key, value, tenant_id=None):
    """Saves or updates a configuration setting value in the settings table."""
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
        conn.commit()
    except Exception as e:
        print(f"[Database] Error writing setting {key}: {e}")
    finally:
        conn.close()


def get_training_keywords(tenant_id=None):
    """Retrieves list of relevance keywords from the settings table."""
    import json
    val = get_setting("training_keywords", None, tenant_id)
    if val:
        try:
            return json.loads(val)
        except Exception:
            pass
    # Default fallback list
    return [
        "quote", "quotation", "enquiry", "enquiries", "inquiry", "inquiries", 
        "pricing", "need", "needed", "material", "materials", "mtl", "mtls", 
        "rfq", "purchase", "order", "price", "prices", "request", "hardware", 
        "fastener", "fasteners", "match", "estimate", "estimating", "invoice",
        "requisition", "req", "items", "slip", "rfp", "vendor", "signoff",
        "welcome", "discussion", "onboarding", "agreement", "contract", "sign",
        "setup", "register", "registration", "details", "proposal", "proposals", 
        "commercial", "commercials", "offer", "offers", "rate", "rates", "bid", 
        "bids", "tender", "tenders"
    ]

def save_training_keywords(keywords, tenant_id=None):
    """Saves the relevance keywords list to the settings table."""
    import json
    # Normalize list
    keywords_clean = sorted(list(set(str(k).lower().strip() for k in keywords if str(k).strip())))
    set_setting("training_keywords", json.dumps(keywords_clean), tenant_id)
    return keywords_clean

def add_training_keyword(keyword, tenant_id=None):
    """Adds a single keyword to the relevance settings list if not present."""
    k_clean = str(keyword).lower().strip()
    if not k_clean:
        return False
    kws = get_training_keywords(tenant_id)
    if k_clean not in kws:
        kws.append(k_clean)
        save_training_keywords(kws, tenant_id)
        return True
    return False


def get_negotiation_keywords(tenant_id=None):
    """Retrieves list of negotiation/discount keywords from the settings table."""
    import json
    val = get_setting("negotiation_keywords", None, tenant_id)
    if val:
        try:
            return json.loads(val)
        except Exception:
            pass
    # Default fallback list
    return [
        "discount", "discounts", "cheaper", "reduction", "reductions", "reduce", 
        "negotiate", "negotiating", "negotiation", "negotiations", "deal", "deals", 
        "concession", "concessions", "cash", "special", "better", "lower", "less"
    ]

def save_negotiation_keywords(keywords, tenant_id=None):
    """Saves the negotiation/discount keywords list to the settings table."""
    import json
    keywords_clean = sorted(list(set(str(k).lower().strip() for k in keywords if str(k).strip())))
    set_setting("negotiation_keywords", json.dumps(keywords_clean), tenant_id)
    return keywords_clean

def add_negotiation_keyword(keyword, tenant_id=None):
    """Adds a single keyword to the negotiation settings list if not present."""
    k_clean = str(keyword).lower().strip()
    if not k_clean:
        return False
    kws = get_negotiation_keywords(tenant_id)
    if k_clean not in kws:
        kws.append(k_clean)
        save_negotiation_keywords(kws, tenant_id)
        return True
    return False


def auto_train_from_email(subject, body, tenant_id=None):
    """Extracts nouns/meaningful words from manual reply subject/body and automatically trains the system by adding them."""
    import re
    import json
    from datetime import datetime
    
    stop_words = {
        "the", "and", "please", "dear", "you", "for", "this", "that", "with", "from", 
        "have", "your", "are", "was", "were", "been", "has", "had", "will", "would", 
        "should", "could", "can", "may", "might", "must", "shall", "does", "did", 
        "done", "doing", "about", "above", "after", "again", "against", "all", "any", 
        "both", "each", "few", "more", "most", "other", "some", "such", "than", "too", 
        "very", "just", "only", "then", "once", "here", "there", "when", "where", 
        "why", "how", "under", "over", "into", "onto", "down", "up", "out", "off", 
        "our", "ours", "him", "her", "his", "its", "them", "their", "they", "she", 
        "but", "not", "hello", "hi", "thanks", "thank", "regards", "best", "sincerely", 
        "com", "net", "org", "edu", "gov", "mail", "email", "subject", "body", "sent", 
        "received", "date", "time", "message", "reply", "forward", "original", "write", 
        "wrote", "attachment", "attachments", "commercials", "products", "shared", "karthikeyan"
    }
    
    # Extract candidate words from subject and body
    text = (subject or "") + " " + (body or "")
    # Find all words that are purely alphabetic and of length 3-15
    words = re.findall(r'\b[a-zA-Z]{3,15}\b', text.lower())
    
    learned = []
    current_kws = get_training_keywords(tenant_id)
    
    for w in words:
        if w not in stop_words and w not in current_kws:
            current_kws.append(w)
            learned.append(w)
            
    if learned:
        save_training_keywords(current_kws, tenant_id)
        # Log to recently learned keywords list
        recent_val = get_setting("recently_learned", "[]", tenant_id)
        try:
            recent_list = json.loads(recent_val)
        except Exception:
            recent_list = []
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for lw in learned:
            # Avoid duplicating in the recent log
            if not any(item['word'] == lw for item in recent_list):
                recent_list.insert(0, {"word": lw, "timestamp": timestamp})
        
        # Keep only the last 20 learned items
        recent_list = recent_list[:20]
        set_setting("recently_learned", json.dumps(recent_list), tenant_id)
        print(f"[AI Auto-Train] Learned new keywords from manual reply: {learned}")
        
        # Log to Activity Log
        try:
            from src.database_sqlite import log_activity
            log_activity(
                "AI_TRAINED",
                invoice_id=None,
                customer_name="AI System",
                customer_email="auto-trainer@trofeo.ai",
                description=f"Auto-trained new relevance keywords: {', '.join(learned[:5])}...",
                tenant_id=tenant_id
            )
        except Exception as ae:
            print(f"[AI Auto-Train] Failed to log activity: {ae}")
            
    return learned


def get_customer_tier(customer_email, tenant_id=None):
    """Loads the customer profile from crm_customers.json and returns their tier."""
    from src.tenants import get_tenant_config, sanitize_tenant_id
    t_id = sanitize_tenant_id(tenant_id)
    tenant_config = get_tenant_config(t_id)
    crm_p = tenant_config.get("crm_json")
    project_root = os.path.dirname(os.path.dirname(__file__))
    if crm_p:
        if not os.path.isabs(crm_p):
            crm_p = os.path.join(project_root, crm_p)
        if not os.path.exists(crm_p):
            crm_p = os.path.join(project_root, "data", "crm_customers.json")
    else:
        crm_p = os.path.join(project_root, "data", "crm_customers.json")
        
    import json
    try:
        with open(crm_p, "r", encoding="utf-8") as f:
            customers = json.load(f)
        profile = customers.get(customer_email.lower().strip() if customer_email else "", {"tier": "retail"})
        return profile.get("tier", "retail")
    except Exception:
        return "retail"


def get_dynamic_unit_price(customer_email, sku_id, base_price, category=None, tenant_id=None):
    """
    Finds the custom override price or tier discount price for a customer/SKU.
    1. Direct override: customer_custom_prices table lookup.
    2. Tier Category multiplier: tier_pricing_rules table lookup.
    3. Fallback: base_price.
    """
    if not customer_email or not sku_id:
        return base_price
        
    # Resolve category from catalog if not provided or empty/General
    if not category or category in ("General", "—", ""):
        from src.tenants import get_tenant_catalog
        try:
            catalog = get_tenant_catalog(tenant_id)
            sku_profile = next((s for s in catalog.skus if s.get("sku_id") == sku_id), None)
            if sku_profile:
                category = sku_profile.get("category", "General")
        except Exception as ce:
            print(f"[Pricing] Catalog category lookup failed: {ce}")

    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    # 1. Custom price override lookup
    try:
        cursor.execute(
            "SELECT custom_price FROM customer_custom_prices WHERE customer_email = ? AND sku_id = ?",
            (customer_email.lower().strip(), sku_id.strip())
        )
        row = cursor.fetchone()
        if row is not None:
            val = float(row["custom_price"])
            conn.close()
            return val
    except Exception as e:
        print(f"[Pricing] Error looking up custom price: {e}")
        
    # 2. Tier category multiplier lookup
    tier = get_customer_tier(customer_email, tenant_id)
    if tier and tier != "retail" and category:
        try:
            cursor.execute(
                "SELECT discount_pct FROM tier_pricing_rules WHERE tier = ? AND category = ?",
                (tier.lower().strip(), category.strip())
            )
            row = cursor.fetchone()
            if row is not None:
                discount_pct = float(row["discount_pct"])
                conn.close()
                return float(base_price) * (1.0 - discount_pct)
        except Exception as e:
            print(f"[Pricing] Error looking up tier pricing rules: {e}")
            
    conn.close()
    return base_price


def get_tier_pricing_rules(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tier_pricing_rules")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def add_tier_pricing_rule(tier, category, discount_pct, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM tier_pricing_rules WHERE tier = ? AND category = ?",
        (tier.lower().strip(), category.strip())
    )
    row = cursor.fetchone()
    if row:
        cursor.execute(
            "UPDATE tier_pricing_rules SET discount_pct = ? WHERE id = ?",
            (float(discount_pct), row["id"])
        )
    else:
        cursor.execute(
            "INSERT INTO tier_pricing_rules (tier, category, discount_pct) VALUES (?, ?, ?)",
            (tier.lower().strip(), category.strip(), float(discount_pct))
        )
    conn.commit()
    conn.close()
    return True


def delete_tier_pricing_rule(rule_id, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tier_pricing_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()
    return True


def get_customer_custom_prices(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_custom_prices")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def add_customer_custom_price(customer_email, sku_id, custom_price, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM customer_custom_prices WHERE customer_email = ? AND sku_id = ?",
        (customer_email.lower().strip(), sku_id.strip())
    )
    row = cursor.fetchone()
    if row:
        cursor.execute(
            "UPDATE customer_custom_prices SET custom_price = ? WHERE id = ?",
            (float(custom_price), row["id"])
        )
    else:
        cursor.execute(
            "INSERT INTO customer_custom_prices (customer_email, sku_id, custom_price) VALUES (?, ?, ?)",
            (customer_email.lower().strip(), sku_id.strip(), float(custom_price))
        )
    conn.commit()
    conn.close()
    return True


def delete_customer_custom_price(price_id, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_custom_prices WHERE id = ?", (price_id,))
    conn.commit()
    conn.close()
    return True


def save_vertical_profile(profile_id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active=0, tenant_id=None, logo_path=None, business_type='Trading'):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    
    if is_active == 1:
        cursor.execute("UPDATE vertical_profiles SET is_active = 0")

    # Ensure logo_path and business_type columns exist (migration safety)
    try:
        cursor.execute("ALTER TABLE vertical_profiles ADD COLUMN logo_path TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE vertical_profiles ADD COLUMN business_type TEXT DEFAULT 'Trading'")
    except Exception:
        pass
    conn.commit()
        
    cursor.execute("""
    INSERT OR REPLACE INTO vertical_profiles (id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active, logo_path, business_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (profile_id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active, logo_path or "", business_type or "Trading"))
    
    conn.commit()
    conn.close()
    return True

def get_active_vertical(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active, logo_path, business_type
        FROM vertical_profiles 
        WHERE is_active = 1 LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            return dict(row)
    except Exception as e:
        print(f"[Database] Error fetching active vertical: {e}")
    finally:
        conn.close()
    
    return {
        "id": "hardware",
        "name": "Trofeo Hardware Solution",
        "industry": "Industrial Hardware & Tools",
        "guidelines": "Analyze customer order enquiries for hardware items like bolts, nuts, elbows, etc.",
        "tone": "Professional & Helpful",
        "catalog_path": "data/sku_catalog.csv",
        "crm_path": "data/crm_customers.json",
        "source_details": "Default seeded hardware profile",
        "is_active": 1,
        "logo_path": "",
        "business_type": "Trading"
    }

def get_all_verticals(tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, industry, guidelines, tone, catalog_path, crm_path, source_details, is_active, logo_path, business_type FROM vertical_profiles")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[Database] Error listing verticals: {e}")
        return []
    finally:
        conn.close()

def set_active_vertical(profile_id, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE vertical_profiles SET is_active = 0")
        cursor.execute("UPDATE vertical_profiles SET is_active = 1 WHERE id = ?", (profile_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"[Database] Error setting active vertical: {e}")
        return False
    finally:
        conn.close()



