import sqlite3

conn = sqlite3.connect('data/trofeo_sales.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Find rows where invoice_id is a status string instead of a real QTN-XXXXX id
STATUS_STRINGS = ('QUOTE_GENERATED', 'QUOTE_UPDATED', 'UNPARSED_NOTICE', 'UNPARSED')
placeholders = ','.join('?' for _ in STATUS_STRINGS)
c.execute(f"SELECT message_id, invoice_id, processed_at FROM processed_messages WHERE invoice_id IN ({placeholders})", STATUS_STRINGS)
bad_rows = c.fetchall()
print(f"Bad rows to fix: {len(bad_rows)}")

fixed = 0
for row in bad_rows:
    msg_id = row['message_id']
    old_inv = row['invoice_id']
    proc_at = row['processed_at']

    # Try to find a quotation created within 120 seconds of this processed_at
    c.execute("""
        SELECT invoice_id, customer_name, customer_email FROM quotations
        WHERE ABS(julianday(created_at) - julianday(?)) * 86400 < 120
        ORDER BY ABS(julianday(created_at) - julianday(?)) ASC
        LIMIT 1
    """, (proc_at, proc_at))
    match = c.fetchone()

    if match:
        real_id = match['invoice_id']
        print(f"  Fix: {msg_id[:40]}  {old_inv} -> {real_id}  ({match['customer_name']} / {match['customer_email']})")
        c.execute('UPDATE processed_messages SET invoice_id = ? WHERE message_id = ?', (real_id, msg_id))
        fixed += 1
    else:
        print(f"  No quotation match for: {msg_id[:40]} (status={old_inv}, time={proc_at})")

conn.commit()
print(f"\nFixed {fixed} rows.")

print("\nCurrent processed_messages (top 5):")
c.execute("SELECT message_id, invoice_id, processed_at FROM processed_messages ORDER BY processed_at DESC LIMIT 5")
for r in c.fetchall():
    print(f"  {r['processed_at']}  invoice={r['invoice_id']}  msg={r['message_id'][:50]}")

conn.close()
print("\nDone.")
