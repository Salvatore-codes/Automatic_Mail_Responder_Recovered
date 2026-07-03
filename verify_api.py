import urllib.request, json, time
time.sleep(3)
url = 'http://127.0.0.1:8080/api/overview/analytics?tenant_id=default'
with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())
print('recent_stream:')
for item in data.get('recent_stream', []):
    s = item.get('status')
    n = item.get('customer_name')
    e = item.get('customer_email')
    inv = item.get('invoice_id')
    print(f'  status={s} | name={n} | email={e} | inv={inv}')
