import sqlite3
conn = sqlite3.connect('data/trofeo_sales.db')
c = conn.cursor()
c.execute("DELETE FROM processed_messages WHERE invoice_id IN ('QUOTE_GENERATED', 'QUOTE_UPDATED', 'UNPARSED_NOTICE', 'UNPARSED')")
conn.commit()
print('Cleaned rows:', c.rowcount)
conn.close()
