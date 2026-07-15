import unittest
import os
import sys
from unittest.mock import MagicMock, patch

# Add project root to python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.database_sqlite import (
    init_db,
    save_vertical_profile,
    get_active_vertical,
    get_all_verticals,
    set_active_vertical,
    save_training_keywords,
    get_training_keywords,
    save_negotiation_keywords,
    get_negotiation_keywords
)
from src.onboard_agent import onboard_business

class TestOnboardingAgent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_tenant = "test_onboarding_tenant"
        cls.db_path = os.path.join(project_root, "data", f"sales_{cls.test_tenant}.db")
        if os.path.exists(cls.db_path):
            try:
                os.remove(cls.db_path)
            except Exception:
                pass
        init_db(tenant_id=cls.test_tenant)

    def test_database_vertical_crud(self):
        # 1. Test save_vertical_profile
        save_vertical_profile(
            profile_id="medical",
            name="Trofeo Medical Supplies",
            industry="Medical Devices",
            guidelines="Answer medical orders strictly",
            tone="Highly formal",
            catalog_path="data/medical_catalog.csv",
            crm_path="data/medical_crm.json",
            source_details="Scraped website info",
            is_active=1,
            tenant_id=self.test_tenant
        )

        # 2. Test get_active_vertical
        active = get_active_vertical(self.test_tenant)
        self.assertIsNotNone(active)
        self.assertEqual(active["id"], "medical")
        self.assertEqual(active["name"], "Trofeo Medical Supplies")
        self.assertEqual(active["industry"], "Medical Devices")
        self.assertEqual(active["guidelines"], "Answer medical orders strictly")
        self.assertEqual(active["is_active"], 1)

        # 3. Save another profile and verify listing
        save_vertical_profile(
            profile_id="grocery",
            name="Trofeo Grocery Store",
            industry="FMCG / Groceries",
            guidelines="Respond with delivery time estimates",
            tone="Friendly and welcoming",
            catalog_path="data/grocery_catalog.csv",
            crm_path="data/grocery_crm.json",
            source_details="Manual brochure upload",
            is_active=0,
            tenant_id=self.test_tenant
        )

        verticals = get_all_verticals(self.test_tenant)
        self.assertEqual(len(verticals), 3)
        
        # Verify set_active_vertical switches the active flag
        success = set_active_vertical("grocery", self.test_tenant)
        self.assertTrue(success)
        
        active = get_active_vertical(self.test_tenant)
        self.assertEqual(active["id"], "grocery")
        self.assertEqual(active["is_active"], 1)

    def test_training_keywords_persistence(self):
        # Test saving and loading training keywords
        relevance_kws = ["syringe", "stethoscope", "scalpel", "gauze"]
        save_training_keywords(relevance_kws, self.test_tenant)
        
        loaded_relevance = get_training_keywords(self.test_tenant)
        self.assertEqual(sorted(loaded_relevance), sorted(relevance_kws))

        # Test saving and loading negotiation keywords
        negotiation_kws = ["discount", "bulk price", "cheaper", "reduction"]
        save_negotiation_keywords(negotiation_kws, self.test_tenant)
        
        loaded_negotiation = get_negotiation_keywords(self.test_tenant)
        self.assertEqual(sorted(loaded_negotiation), sorted(negotiation_kws))

    @patch("google.genai.Client")
    def test_onboard_business_mock_llm(self, mock_client_class):
        # Setup mock client response
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        # Synthesized response JSON from Gemini
        mock_response = MagicMock()
        mock_response.text = """
        {
            "company_name": "Trofeo Medical Supplies",
            "industry": "Medical Supplies",
            "tone": "Highly professional and clinical",
            "guidelines": "Always verify FDA approval status and batch expiration dates.",
            "suggested_relevance_keywords": ["syringe", "stethoscope", "thermometer"],
            "suggested_negotiation_keywords": ["medical discount", "hosp rate"]
        }
        """
        mock_client.models.generate_content.return_value = mock_response

        # Execute onboarding
        res = onboard_business(
            description_text="We sell medical instruments like syringes, stethoscopes, and thermometers.",
            url=None,
            tenant_id=self.test_tenant
        )

        # Assert results match synthesized output
        self.assertEqual(res["company_name"], "Trofeo Medical Supplies")
        self.assertEqual(res["industry"], "Medical Supplies")
        self.assertEqual(res["tone"], "Highly professional and clinical")
        self.assertIn("verify FDA approval", res["guidelines"])
        self.assertEqual(res["suggested_relevance_keywords"], ["syringe", "stethoscope", "thermometer"])

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.db_path):
            try:
                os.remove(cls.db_path)
            except Exception:
                pass

if __name__ == "__main__":
    unittest.main()
