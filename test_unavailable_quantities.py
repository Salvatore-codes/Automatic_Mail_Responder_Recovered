import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# Ensure import of local source files works
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


from src.database import Catalog
from src.email_listener import adjust_quantities_by_stock, build_email_reply_body
from src.pdf_generator import generate_pdf_quotation

# Mock Catalog
class MockCatalog:
    def __init__(self):
        self.skus = [
            {"sku_id": "SKU-A", "name": "Brass Elbow Fitting 1/2 Inch", "price": 100.0, "stock": 10, "category": "Plumbing"},
            {"sku_id": "SKU-B", "name": "Teflon Tape 12mm", "price": 20.0, "stock": 4, "category": "Plumbing"},
            {"sku_id": "SKU-C", "name": "Hex Bolt M8", "price": 50.0, "stock": 0, "category": "Hardware"}
        ]

def run_tests():
    catalog = MockCatalog()
    
    # Customer enquiry list:
    # 1. Brass Elbow Fitting 1/2 Inch - Requested: 5 (10 available) -> Fully available
    # 2. Teflon Tape 12mm - Requested: 10 (4 available) -> Partially available (deficit 6)
    # 3. Hex Bolt M8 - Requested: 15 (0 available) -> Fully unavailable (deficit 15)
    matched_lines = [
        {
            "matched_sku_id": "SKU-A",
            "matched_sku_name": "Brass Elbow Fitting 1/2 Inch",
            "quantity": 5,
            "unit_price": 100.0,
            "confidence": 95.0
        },
        {
            "matched_sku_id": "SKU-B",
            "matched_sku_name": "Teflon Tape 12mm",
            "quantity": 10,
            "unit_price": 20.0,
            "confidence": 95.0
        },
        {
            "matched_sku_id": "SKU-C",
            "matched_sku_name": "Hex Bolt M8",
            "quantity": 15,
            "unit_price": 50.0,
            "confidence": 95.0
        }
    ]
    
    print("Running adjust_quantities_by_stock...")
    deficit_lines = adjust_quantities_by_stock(matched_lines, catalog)
    
    # Assertions on matched_lines after capping:
    # SKU-A: quantity should remain 5, deficit 0, stock_avail 10
    print(f"SKU-A Quantity: {matched_lines[0]['quantity']} (Expected: 5)")
    print(f"SKU-A Deficit: {matched_lines[0]['deficit']} (Expected: 0)")
    
    # SKU-B: quantity should be 0 (excluded since requested > stock), deficit 6, stock_avail 4
    print(f"SKU-B Quantity: {matched_lines[1]['quantity']} (Expected: 0)")
    print(f"SKU-B Deficit: {matched_lines[1]['deficit']} (Expected: 6)")
    
    # SKU-C: quantity should be 0 (excluded since stock 0), deficit 15, stock_avail 0
    print(f"SKU-C Quantity: {matched_lines[2]['quantity']} (Expected: 0)")
    print(f"SKU-C Deficit: {matched_lines[2]['deficit']} (Expected: 15)")
    
    assert matched_lines[0]['quantity'] == 5
    assert matched_lines[0]['deficit'] == 0
    assert matched_lines[1]['quantity'] == 0
    assert matched_lines[1]['deficit'] == 6
    assert matched_lines[2]['quantity'] == 0
    assert matched_lines[2]['deficit'] == 15
    
    print("\nRunning build_email_reply_body...")
    (plain_text, html_text), grand_total = build_email_reply_body(
        matched_lines=matched_lines,
        discount_pct=0.1,  # 10%
        customer_name="Test Customer",
        invoice_id="INV-9999",
        customer_email="test@customer.com",
        customer_phone="+91 90000 00000"
    )
    
    # Math validation:
    # Quoted items:
    # SKU-A: 5 * 100 = 500
    # Total available: 500
    # Discount (10%): -50
    # Net: 450
    # GST (18%): 81
    # Grand Total: 531.00
    
    print(f"Calculated Grand Total: ₹{grand_total:.2f} (Expected: ₹531.00)")
    assert abs(grand_total - 531.00) < 0.01
    
    # Check that plain_text contains the "Unavailable Products" box
    print("\nChecking Plain Text Email content...")
    print("Has 'Unavailable Products':", "Unavailable Products" in plain_text)
    print("Has 'Teflon Tape 12mm: Requested 10 unit(s), but only 4 unit(s) available':", "Teflon Tape 12mm: Requested 10 unit(s), but only 4 unit(s) available" in plain_text)
    print("Has 'Hex Bolt M8: Requested 15 unit(s), but only 0 unit(s) available':", "Hex Bolt M8: Requested 15 unit(s), but only 0 unit(s) available" in plain_text)
    assert "Unavailable Products" in plain_text
    assert "Teflon Tape 12mm: Requested 10 unit(s), but only 4 unit(s) available" in plain_text
    assert "Hex Bolt M8: Requested 15 unit(s), but only 0 unit(s) available" in plain_text
    
    # Check that main table only lists SKU-A and excludes SKU-B
    assert "Brass Elbow Fitting 1/2 Inch" in plain_text
    assert "| 0    | ₹20.00" not in plain_text
    # SKU-C has quantity 0, should NOT be listed in main table
    # Wait, we check if SKU-C is listed in the main quoted part (where it says In Stock or PARTIAL)
    # The string "Hex Bolt M8" is in plain_text (under Unavailable Products), but the line with "Hex Bolt M8"
    # and total amount shouldn't be in the table. Let's make sure:
    assert "| 0    | ₹50.00" not in plain_text
    
    # Check HTML Email content
    print("\nChecking HTML Email content...")
    print("Has 'Unavailable Products':", "Unavailable Products" in html_text)
    print("Has 'Teflon Tape 12mm':", "Teflon Tape 12mm" in html_text)
    print("Has 'Hex Bolt M8':", "Hex Bolt M8" in html_text)
    assert "Unavailable Products" in html_text
    assert "Teflon Tape 12mm" in html_text
    assert "Hex Bolt M8" in html_text
    assert "Currently Unavailable" not in html_text # Completely out-of-stock items should be in the Unavailable Products table only, not the main table
    
    print("\nRunning generate_pdf_quotation...")
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "quotes", "Quote_INV-9999.pdf")
    generate_pdf_quotation(
        matched_lines=matched_lines,
        discount_pct=0.1,
        customer_name="Test Customer",
        invoice_id="INV-9999",
        output_path=pdf_path,
        catalog=catalog
    )
    print(f"PDF successfully generated at: {pdf_path}")
    assert os.path.exists(pdf_path)
    
    # Clean up PDF
    os.remove(pdf_path)
    meta_path = pdf_path.replace(".pdf", "_meta.json")
    if os.path.exists(meta_path):
        os.remove(meta_path)

    # Test send_deficit_purchase_order_alert
    print("\nRunning send_deficit_purchase_order_alert...")
    from src.email_listener import send_deficit_purchase_order_alert
    import src.email_listener
    
    captured_body = None
    def mock_send_master_notification(smtp_server, smtp_port, email_user, email_pass, master_email, subject, body_text):
        nonlocal captured_body
        captured_body = body_text
        
    original_send = src.email_listener.send_master_notification
    src.email_listener.send_master_notification = mock_send_master_notification
    
    try:
        send_deficit_purchase_order_alert(
            smtp_server="smtp.gmail.com",
            smtp_port=587,
            email_user="test@gmail.com",
            email_pass="pass",
            master_email="master@gmail.com",
            customer_name="Rajarajan S",
            customer_email="rajarajansvelora@gmail.com",
            customer_phone="+91 90000 00000",
            original_subject="Share this in quote",
            deficit_lines=deficit_lines
        )
        
        print("Captured Body:\n", captured_body)
        assert captured_body is not None
        assert "Available Qty: 4" in captured_body
        assert "Available Qty: 0" in captured_body
        assert "Deficit Qty: 6" in captured_body
        assert "Deficit Qty: 15" in captured_body
        assert "Requested Qty: 10" in captured_body
        assert "Requested Qty: 15" in captured_body
        print("send_deficit_purchase_order_alert assertions passed!")
    finally:
        src.email_listener.send_master_notification = original_send
        
    # Test match_vector_batch
    print("\nRunning match_vector_batch tests...")
    class MockEmbeddings:
        def __init__(self, values):
            self.values = values

    class MockEmbeddingResponse:
        def __init__(self, embeddings):
            self.embeddings = embeddings

    class MockModels:
        def embed_content(self, model, contents):
            embeddings = []
            # Treat contents as a list of queries (handles single string or list)
            queries = [contents] if isinstance(contents, str) else contents
            for query in queries:
                vec = [0.0] * 3072
                if "elbow" in query.lower():
                    vec[0] = 1.0
                elif "tape" in query.lower():
                    vec[1] = 1.0
                else:
                    vec[2] = 1.0
                embeddings.append(MockEmbeddings(vec))
            return MockEmbeddingResponse(embeddings)

    class MockGeminiClient:
        def __init__(self):
            self.models = MockModels()

    import numpy as np
    catalog_test = Catalog("data/sku_catalog.csv")
    catalog_test.embedding_ids = ["ELBOW-BRASS-050", "PTFE-TAPE-12"]
    
    # embedding_matrix shape [2, 3072]
    matrix = np.zeros((2, 3072), dtype=np.float32)
    matrix[0, 0] = 1.0 # matches elbow
    matrix[1, 1] = 1.0 # matches tape
    catalog_test.embedding_matrix = matrix
    
    client_test = MockGeminiClient()
    queries = ["1/2 inch brass elbow", "teflon tape"]
    
    batch_results = catalog_test.match_vector_batch(queries, client_test, threshold=0.70, limit=2)
    print("Batch Results:", batch_results)
    assert len(batch_results) == 2
    assert batch_results[0][0]["sku"]["sku_id"] == "ELBOW-BRASS-050"
    assert batch_results[1][0]["sku"]["sku_id"] == "PTFE-TAPE-12"
    print("match_vector_batch unit assertions passed!")

    # Test dynamic catalog reloading
    print("\nRunning dynamic catalog reload tests...")
    from src.tenants import get_tenant_catalog, _CATALOG_CACHE
    
    cat1 = get_tenant_catalog("default")
    assert "default" in _CATALOG_CACHE
    mtime1 = _CATALOG_CACHE["default"]["mtime"]
    
    # Touch catalog file (updating its mtime)
    csv_path = _CATALOG_CACHE["default"]["catalog"].csv_path
    os.utime(csv_path, None) # set mtime to current time
    
    cat2 = get_tenant_catalog("default")
    mtime2 = _CATALOG_CACHE["default"]["mtime"]
    print(f"Mtime 1: {mtime1}, Mtime 2: {mtime2}")
    assert mtime1 != mtime2
    assert cat1 is not cat2 # a new instance was loaded!
    print("Dynamic catalog reloading assertions passed!")
        
    print("\n\033[92mALL TESTS PASSED SUCCESSFULLY!\033[0m")

if __name__ == "__main__":
    run_tests()
