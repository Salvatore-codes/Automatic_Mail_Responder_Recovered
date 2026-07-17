import unittest
import os
import sys
import datetime

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.database_sqlite import (
    init_db,
    get_connection,
    log_quotation,
    get_setting,
    set_setting
)
from src.database import Catalog
from src.negotiator import run_negotiation_step
from src.email_listener import (
    find_in_stock_alternative,
    adjust_quantities_by_stock,
    send_autonomous_followups
)

class TestAutonomousAgent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_tenant = "test_autonomous_tenant"
        init_db(tenant_id=cls.test_tenant)
        cls.catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
        cls.catalog = Catalog(cls.catalog_path, tenant_id=cls.test_tenant)

    def test_oos_alternative_lookup(self):
        # Find alternative for out-of-stock item
        alt = find_in_stock_alternative(
            category="Conduits & Fittings",
            original_price=20.0,
            requested_qty=5,
            catalog=self.catalog,
            exclude_sku_id="CONDUIT-16MM"
        )
        if alt:
            self.assertNotEqual(alt["sku_id"], "CONDUIT-16MM")
            self.assertTrue(int(alt.get("stock", 0)) >= 5)

    def test_adjust_quantities_with_replacement(self):
        class MockCatalog:
            def __init__(self):
                self.skus = [
                    {"sku_id": "SKU-A", "sku_name": "Product A", "category": "Category-1", "price": 10.0, "stock": 0},
                    {"sku_id": "SKU-B", "sku_name": "Product B", "category": "Category-1", "price": 12.0, "stock": 10},
                ]
            def get_by_sku_id(self, sku_id):
                for s in self.skus:
                    if s["sku_id"] == sku_id:
                        return s
                return None

        mock_cat = MockCatalog()
        matched_lines = [
            {
                "matched_sku_id": "SKU-A",
                "matched_sku_name": "Product A",
                "quantity": 5,
                "unit_price": 10.0,
                "confidence": 90.0,
                "parsed_query": "Product A"
            }
        ]
        
        adjust_quantities_by_stock(
            matched_lines,
            mock_cat,
            cap_by_stock=True,
            tenant_id=self.test_tenant
        )
        
        self.assertEqual(matched_lines[0]["matched_sku_id"], "SKU-B")
        self.assertTrue(matched_lines[0].get("is_replacement"))
        self.assertEqual(matched_lines[0].get("original_sku_id"), "SKU-A")

    def test_margin_aware_bargaining(self):
        class MockCatalog:
            def __init__(self):
                self.skus = [
                    {"sku_id": "SKU-A", "price": 100.0, "cost_price": 70.0},
                ]
            def get_by_sku_id(self, sku_id):
                for s in self.skus:
                    if s["sku_id"] == sku_id:
                        return s
                return None

        mock_cat = MockCatalog()
        items = [{"matched_sku_id": "SKU-A", "quantity": 1, "unit_price": 100.0}]
        
        res = run_negotiation_step(
            customer_message="Can I get 5% discount?",
            requested_discount=5.0,
            chat_history=[],
            items=items,
            catalog=mock_cat
        )
        self.assertEqual(res["status"], "NEGOTIATING")
        self.assertEqual(res["approved_discount"], 3.5)

    def test_followup_triggering(self):
        conn = get_connection(self.test_tenant)
        conn.execute("DELETE FROM quotations WHERE invoice_id = 'QTN-OLD01'")
        
        ist_now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        old_time = ist_now - datetime.timedelta(hours=72)
        old_time_str = old_time.strftime("%Y-%m-%d %H:%M:%S")
        
        conn.execute("""
            INSERT INTO quotations (invoice_id, customer_name, customer_email, customer_phone, subtotal, discount_pct, tax_amt, grand_total, status, source, created_at, assigned_operator)
            VALUES ('QTN-OLD01', 'Old Cust', 'old@test.com', '+123', 100.0, 0.0, 18.0, 118.0, 'QUOTE_GENERATED', 'email', ?, 'operator@trofeo.com')
        """, (old_time_str,))
        conn.commit()
        conn.close()
        
        config = {
            "id": self.test_tenant,
            "business_name": "Test Co",
            "email_user": "your_email@gmail.com"
        }
        send_autonomous_followups(self.test_tenant, config)
        
        conn = get_connection(self.test_tenant)
        row = conn.execute("SELECT status FROM quotations WHERE invoice_id = 'QTN-OLD01'").fetchone()
        conn.close()
        self.assertEqual(row["status"], "FOLLOW_UP_SENT")

if __name__ == "__main__":
    unittest.main()
