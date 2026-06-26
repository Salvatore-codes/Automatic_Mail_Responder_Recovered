import os
import sqlite3
import datetime

# Database Path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "trofeo_sales.db")

INITIALIZED_DBS = set()

def get_connection(tenant_id=None):
    from src.tenants import sanitize_tenant_id
    t_id = sanitize_tenant_id(tenant_id)
    
    os.makedirs(DB_DIR, exist_ok=True)
    if t_id and t_id != "default":
        db_path = os.path.join(DB_DIR, f"sales_{t_id}.db")
    else:
        db_path = DB_PATH
        
    db_key = t_id
    if db_key not in INITIALIZED_DBS:
        INITIALIZED_DBS.add(db_key)
        # Create connection, set WAL mode, and run initialization
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
        created_at TEXT
    )
    """)
    
    # Check if customer_phone column exists (backward compatibility for existing DBs)
    try:
        cursor.execute("ALTER TABLE quotations ADD COLUMN customer_phone TEXT")
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
    
    conn.commit()

def init_db(tenant_id=None):
    conn = get_connection(tenant_id)
    conn.close()

def log_quotation(invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, tenant_id=None):
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
    INSERT OR REPLACE INTO quotations (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, now_str))
    
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
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
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
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
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
    cursor.execute("""
    INSERT INTO unmatched_items (customer_email, customer_name, original_body, source)
    VALUES (?, ?, ?, ?)
    """, (customer_email, customer_name, original_body, source))
    conn.commit()
    conn.close()

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

def log_processed_message(message_id, invoice_id, tenant_id=None):
    """Logs a processed Message-ID mapping it to the quotation sequence number."""
    if not message_id:
        return
    conn = get_connection(tenant_id)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO processed_messages (message_id, invoice_id)
    VALUES (?, ?)
    """, (message_id.strip(), invoice_id))
    conn.commit()
    conn.close()

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
    cursor.execute("""
    INSERT INTO deficits (invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    """, (invoice_id, sku_id, sku_name, requested_qty, available_qty, deficit_qty, customer_name, customer_email, customer_phone))
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
