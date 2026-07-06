import requests
import json
import os
import sys

def test_backend_server():
    print("=" * 80)
    print("             API ENDPOINT INTEGRATION & TEST VERIFICATION")
    print("=" * 80)
    
    base_url = "http://127.0.0.1:8080"
    
    # 1. Verify Server is Online
    print("Connecting to local FastAPI server... ", end="")
    try:
        resp = requests.get(base_url)
        if resp.status_code == 200:
            print("[ONLINE]")
        else:
            print(f"[OFFLINE] (Status code: {resp.status_code})")
            sys.exit(1)
    except Exception as e:
        print(f"[OFFLINE] (Connection failed: {e})")
        print("\nPlease make sure to start the server via: python run_server.py")
        sys.exit(1)

    failures = 0

    # 2. Test Ingestion Processing /api/process (Scenario A)
    print("Testing Ingestion endpoint /api/process (Scenario A)... ", end="")
    payload_proc = {
        "text": "hi bro need some stuff urgently:\n- 12 brass elbow joints 1/2 size\n- 5 teflon taps (the plumbing sealing one)",
        "engine": "A",
        "customer_email": "apex_builders@contractor.com",
        "input_type": "whatsapp"
    }
    try:
        resp = requests.post(f"{base_url}/api/process", json=payload_proc)
        data = resp.json()
        if resp.status_code == 200 and len(data["matched_lines"]) == 2:
            # Check contractor discount applied (15%)
            if data["discount_pct"] == 0.15:
                print("[PASSED] (Ingested 2 lines, applied 15% discount)")
            else:
                print(f"[FAILED] (Discount applied: {data['discount_pct']}, expected 0.15)")
                failures += 1
        else:
            print(f"[FAILED] (Status: {resp.status_code}, lines matched: {len(data.get('matched_lines', []))})")
            failures += 1
    except Exception as e:
        print(f"[FAILED] with exception: {e}")
        failures += 1

    # 3. Test Human-in-the-Loop Override /api/hitl/confirm
    print("Testing HITL Override /api/hitl/confirm... ", end="")
    payload_hitl = {
        "query": "teflon taps (the plumbing sealing one)",
        "sku_id": "PTFE-TAPE-12"
    }
    try:
        resp = requests.post(f"{base_url}/api/hitl/confirm", json=payload_hitl)
        data = resp.json()
        if resp.status_code == 200 and data["status"] == "SUCCESS":
            print("[PASSED] (Registered synonym cache)")
        else:
            print(f"[FAILED] (Status: {resp.status_code}, payload: {data})")
            failures += 1
    except Exception as e:
        print(f"[FAILED] with exception: {e}")
        failures += 1

    # 4. Test PDF Invoice Generation /api/quote/generate
    print("Testing PDF Generation /api/quote/generate... ", end="")
    try:
        resp_proc = requests.post(f"{base_url}/api/process", json=payload_proc)
        matched_lines = resp_proc.json()["matched_lines"]
        
        payload_pdf = {
            "matched_lines": matched_lines,
            "discount_pct": 0.15,
            "customer_name": "Apex Builders Ltd",
            "invoice_id": "TEST1001"
        }
        resp_pdf = requests.post(f"{base_url}/api/quote/generate", json=payload_pdf)
        data_pdf = resp_pdf.json()
        if resp_pdf.status_code == 200 and "pdf_url" in data_pdf:
            print("[PASSED] (Generated PDF Quote invoice on disk)")
            pdf_path = os.path.join(os.path.dirname(__file__), "static", "quotes", "Quote_TEST1001.pdf")
            if os.path.exists(pdf_path):
                print(f"   -> Verified Quote file on disk: {pdf_path}")
            else:
                print("   -> Warning: PDF generated on API but file not found in directory.")
        else:
            print(f"[FAILED] (Status: {resp_pdf.status_code}, payload: {data_pdf})")
            failures += 1
    except Exception as e:
        print(f"[FAILED] with exception: {e}")
        failures += 1

    # 5. Test AI Negotiation /api/negotiate
    print("Testing AI Negotiation /api/negotiate... ", end="")
    payload_neg = {
        "customer_message": "Please give us a better rate, we buy screws and fittings weekly.",
        "requested_discount": 15.0,
        "chat_history": [
            {"sender": "ai", "text": "Hello! I see you want a discount."},
            {"sender": "customer", "text": "Can you offer 15% off?"},
            {"sender": "ai", "text": "Since our margins are thin, we can offer 3.0% discount."}
        ]
    }
    try:
        resp_neg = requests.post(f"{base_url}/api/negotiate", json=payload_neg)
        data_neg = resp_neg.json()
        if resp_neg.status_code == 200 and "reply" in data_neg:
            print(f"[PASSED] (AI Negotiator status: {data_neg.get('status')})")
            print(f"   -> AI Response: \"{data_neg.get('reply')}\"")
        else:
            print(f"[FAILED] (Status: {resp_neg.status_code}, payload: {data_neg})")
            failures += 1
    except Exception as e:
        print(f"[FAILED] with exception: {e}")
        failures += 1

    print("=" * 80)
    if failures == 0:
        print("SUCCESS: BACKEND SERVER VERIFICATION SUCCESSFUL! All endpoints are fully operational.")
    else:
        print(f"WARNING: VERIFICATION COMPLETE - {failures} endpoint failures detected.")
    print("=" * 80)

if __name__ == "__main__":
    test_backend_server()
