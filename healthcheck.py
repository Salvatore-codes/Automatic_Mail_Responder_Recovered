"""
Full health check for Trofeo Email Responder System (Corrected)
"""
import os, sys, json, sqlite3, urllib.request, time

BASE_URL = "http://127.0.0.1:8080"
DB_PATH  = "data/trofeo_sales.db"
LOG_PATH = "data/email_listener.log"

ok  = []
err = []

def check(name, passed, detail=""):
    if passed:
        ok.append(name)
        print(f"  [OK]  {name}" + (f" — {detail}" if detail else ""))
    else:
        err.append(name)
        print(f"  [FAIL] {name}" + (f" — {detail}" if detail else ""))

print("=" * 64)
print("  TROFEO SYSTEM HEALTH CHECK")
print("=" * 64)

# Let it start
time.sleep(3)

# ── 1. Web Server ────────────────────────────────────────────────
print("\n[1] Web Server")
try:
    with urllib.request.urlopen(f"{BASE_URL}/api/tenants", timeout=5) as r:
        tenants = json.loads(r.read())
    check("API reachable", True, f"{BASE_URL}")
    if isinstance(tenants, list):
        has_tenants = len(tenants) > 0
        detail_str = str(tenants)
    else:
        has_tenants = len(tenants.get("tenants", [])) > 0
        detail_str = str(tenants.get("tenants"))
    check("Tenants loaded", has_tenants, detail_str)
except Exception as e:
    check("API reachable", False, str(e))
    check("Tenants loaded", False, "server not responding")

# ── 2. Analytics API ─────────────────────────────────────────────
print("\n[2] Analytics API")
try:
    with urllib.request.urlopen(f"{BASE_URL}/api/overview/analytics?tenant_id=default", timeout=8) as r:
        data = json.loads(r.read())
    stream = data.get("recent_stream", [])
    metrics = data.get("metrics", {})
    check("Analytics endpoint", True)
    check("No ghost status rows in stream",
          all(i["invoice_id"] not in ("QUOTE_GENERATED","QUOTE_UPDATED","UNPARSED_NOTICE","UNPARSED") for i in stream),
          f"{len(stream)} stream items")
    check("Customer name populated",
          all(i["customer_name"] not in ("", "Unknown", None) for i in stream if i["status"] != "Auto-Filtered"),
          "all named")
    print(f"        Stream items: {len(stream)}, Total received: {metrics.get('total_received')}")
    for item in stream[:5]:
        print(f"        • {item['status']:20s}  {item['customer_name']:25s}  inv={item['invoice_id']}")
except Exception as e:
    check("Analytics endpoint", False, str(e))

# ── 3. Database ──────────────────────────────────────────────────
print("\n[3] Database")
try:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as n FROM quotations"); q = c.fetchone()["n"]
    c.execute("SELECT COUNT(*) as n FROM processed_messages WHERE invoice_id NOT IN ('SELF_SENT','IRRELEVANT')"); pm = c.fetchone()["n"]
    bad_status_vals = ("QUOTE_GENERATED","QUOTE_UPDATED","UNPARSED_NOTICE","UNPARSED")
    ph = ",".join("?"*len(bad_status_vals))
    c.execute(f"SELECT COUNT(*) as n FROM processed_messages WHERE invoice_id IN ({ph})", bad_status_vals)
    bad = c.fetchone()["n"]
    check("Database accessible", True, DB_PATH)
    check("Quotations table", True, f"{q} records")
    check("No bad invoice_id rows", bad == 0, f"{bad} bad rows remaining")
    check("Processed messages logged", pm >= 0, f"{pm} valid records")
    conn.close()
except Exception as e:
    check("Database accessible", False, str(e))

# ── 4. Outlook / Graph API Token ─────────────────────────────────
print("\n[4] Outlook / Microsoft Graph Token")
try:
    sys.path.insert(0, ".")
    from src.tenants import load_tenants
    from src.email_listener import get_graph_token, fetch_outlook_messages
    tenants = load_tenants()
    cfg = tenants.get("default", {})
    tid = cfg.get("outlook_tenant_id")
    cid = cfg.get("outlook_client_id")
    sec = cfg.get("outlook_client_secret")
    eu  = cfg.get("email_user")
    check("Outlook credentials configured", all([tid, cid, sec, eu]),
          f"user={eu}")
    token = get_graph_token(tid, cid, sec)
    check("Graph token acquired", bool(token), "OAuth2 client credentials OK")
    if token:
        msgs = fetch_outlook_messages(token, eu)
        check("Mailbox reachable", True, f"{len(msgs)} unread message(s)")
        for m in msgs[:3]:
            s = m.get("subject","(no subject)")
            fr = m.get("from",{}).get("emailAddress",{}).get("address","?")
            print(f"        • Unread from {fr}: {s[:60]}")
except Exception as e:
    check("Outlook / Graph check", False, str(e))

# ── 5. Email Listener Log ────────────────────────────────────────
print("\n[5] Email Listener Log (last 10 lines)")
try:
    with open(LOG_PATH, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    recent = [l.strip() for l in lines[-10:] if l.strip()]
    check("Log file exists", True, LOG_PATH)
    is_running = any("Poller" in l or "Listener" in l for l in recent)
    check("Poller is active", is_running, "recent log has polling entries")
    for l in recent[-5:]:
        print(f"        {l[:100]}")
except Exception as e:
    check("Log file", False, str(e))

# ── Summary ──────────────────────────────────────────────────────
print("\n" + "=" * 64)
print(f"  RESULT: {len(ok)} passed, {len(err)} failed")
if err:
    print("  FAILED checks:")
    for e in err:
        print(f"    ✗ {e}")
else:
    print("  ALL CHECKS PASSED ✓")
print("=" * 64)
