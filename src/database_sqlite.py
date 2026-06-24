import os
import sqlite3
import datetime

# Database Path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "trofeo_sales.db")

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
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
    
    conn.commit()
    conn.close()
 
def log_quotation(invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
    INSERT OR REPLACE INTO quotations (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, now_str))
    
    conn.commit()
    conn.close()

def log_quotation_item(invoice_id, sku_id, sku_name, quantity, unit_price, line_total):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO quotation_items (invoice_id, sku_id, sku_name, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (invoice_id, sku_id, sku_name, quantity, unit_price, line_total))
    
    conn.commit()
    conn.close()

def log_chat_msg(invoice_id, sender, message):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
    INSERT INTO chat_logs (invoice_id, sender, message, timestamp)
    VALUES (?, ?, ?, ?)
    """, (invoice_id, sender, message, now_str))
    
    conn.commit()
    conn.close()

def update_quotation_status(invoice_id, status, discount_pct=None):
    conn = get_connection()
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

def log_synonym(query, sku_id):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
    INSERT OR REPLACE INTO synonyms (query, sku_id, created_at)
    VALUES (?, ?, ?)
    """, (query.lower().strip(), sku_id, now_str))
    
    conn.commit()
    conn.close()

def get_synonyms_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT query, sku_id FROM synonyms")
    rows = cursor.fetchall()
    
    synonyms = {}
    for row in rows:
        synonyms[row["query"]] = row["sku_id"]
        
    conn.close()
    return synonyms

# Initialize DB on import
init_db()
