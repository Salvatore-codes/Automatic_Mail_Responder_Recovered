import unittest
import os
import sys
import shutil

# Add project root to python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.database_sqlite import (
    init_db,
    add_tier_pricing_rule,
    add_customer_custom_price,
    get_dynamic_unit_price,
    get_connection
)

class TestDynamicPricing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use a separate test database
        cls.test_tenant = "test_pricing_tenant"
        # Ensure clean state
        cls.db_path = os.path.join(project_root, "data", f"sales_{cls.test_tenant}.db")
        if os.path.exists(cls.db_path):
            try:
                os.remove(cls.db_path)
            except Exception:
                pass
        
        # Initialize database
        init_db(tenant_id=cls.test_tenant)

    def test_dynamic_pricing_resolution(self):
        # 1. Setup tier pricing rules
        # wholesale tier gets 15% discount on Plumbing category
        add_tier_pricing_rule("wholesale", "Plumbing", 0.15, tenant_id=self.test_tenant)
        
        # 2. Setup custom overrides
        # specific customer gets M10 bolt at ₹0.65 (base is ₹0.85)
        add_customer_custom_price("rajarajansvelora@gmail.com", "BOLT-HEX-M10-80", 0.65, tenant_id=self.test_tenant)

        # 3. Test Cases:
        
        # Case A: Customer with a specific custom SKU override
        # Base price = 0.85, Category = Fasteners
        price_a = get_dynamic_unit_price(
            customer_email="rajarajansvelora@gmail.com",
            sku_id="BOLT-HEX-M10-80",
            base_price=0.85,
            category="Fasteners",
            tenant_id=self.test_tenant
        )
        self.assertEqual(price_a, 0.65, "Should return custom overridden price of 0.65")

        # Case B: Customer on wholesale tier getting category discount
        # Base price = 12.50, Category = Plumbing
        price_b = get_dynamic_unit_price(
            customer_email="rajarajansvelora@gmail.com", # tier: wholesale (from crm_customers.json)
            sku_id="ELBOW-BRASS-050",
            base_price=12.50,
            category="Plumbing",
            tenant_id=self.test_tenant
        )
        self.assertAlmostEqual(price_b, 12.50 * 0.85, places=3, msg="Should apply 15% category tier discount")

        # Case C: Fallback to base price when no overrides or rules apply
        # Base price = 12.50, Category = Plumbing (but customer is retail)
        price_c = get_dynamic_unit_price(
            customer_email="walkin_retail@guest.com", # tier: retail
            sku_id="ELBOW-BRASS-050",
            base_price=12.50,
            category="Plumbing",
            tenant_id=self.test_tenant
        )
        self.assertEqual(price_c, 12.50, "Retail customer should fallback to base price of 12.50")

        # Case D: Fallback to base price for a category without rules
        # Base price = 0.45, Category = Fasteners (no tier rule exists for Fasteners)
        price_d = get_dynamic_unit_price(
            customer_email="rajarajansvelora@gmail.com", # tier: wholesale
            sku_id="BOLT-HEX-M8-50",
            base_price=0.45,
            category="Fasteners",
            tenant_id=self.test_tenant
        )
        self.assertEqual(price_d, 0.45, "Wholesale customer should fallback to base price for categories without rules")

    @classmethod
    def tearDownClass(cls):
        # Clean up database
        if os.path.exists(cls.db_path):
            try:
                os.remove(cls.db_path)
            except Exception:
                pass

if __name__ == "__main__":
    unittest.main()
