import os
import sys
import unittest
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

# Add the project root to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import Catalog
from src.email_listener import extract_text_from_attachments, process_incoming_email

class TestLocalOCRIntegration(unittest.TestCase):

    def setUp(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.catalog_path = os.path.join(self.project_root, "data", "sku_catalog.csv")
        self.crm_path = os.path.join(self.project_root, "data", "crm_customers.json")
        self.catalog = Catalog(self.catalog_path)
        
        # Test image path from artifact directory
        self.image_path = None
        user_dir = os.path.expanduser("~")
        brain_root = os.path.join(user_dir, ".gemini", "antigravity-ide", "brain")
        if os.path.exists(brain_root):
            import glob
            png_files = glob.glob(os.path.join(brain_root, "*", "media__*.png"))
            for pf in png_files:
                if "1783407675264" in pf or "1783410374334" in pf or "1783356803945" in pf:
                    self.image_path = pf
                    break
            if not self.image_path and png_files:
                self.image_path = png_files[0]
        
        if not self.image_path:
            self.image_path = r"C:\Users\Admin\.gemini\antigravity-ide\brain\398c9097-b2c6-40a2-a845-fd867e4f26cc\media__1783407675264.png"

    def test_local_ocr_end_to_end(self):
        # 1. Load the raw image bytes
        self.assertTrue(os.path.exists(self.image_path), f"Test image not found at: {self.image_path}")
        with open(self.image_path, "rb") as f:
            img_data = f.read()

        # 2. Build a mock MIME email message containing the image attachment
        msg = MIMEMultipart()
        msg["Subject"] = "Request for Quote with Attachment"
        msg["From"] = "apex_builders@contractor.com"
        
        image_part = MIMEImage(img_data, name="order_list.png")
        image_part.add_header("Content-Disposition", "attachment", filename="order_list.png")
        msg.attach(image_part)

        # 3. Temporarily clear GEMINI_API_KEY to ensure local OCR is used
        old_api_key = os.environ.get("GEMINI_API_KEY", "")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        try:
            # 4. Extract attachment text using the fallback local OCR path
            extracted_text = extract_text_from_attachments(msg)
            print(f"\n[Test] Extracted text from attachment:\n{extracted_text}\n")
            
            # Verify the output format and lines are preserved
            self.assertIn("BLADES-KNIFE-IO", extracted_text)
            self.assertTrue(any(x in extracted_text for x in ["BOLT-HEX-MIO", "BOLT-HEX-M10", "BOLT-HEX-MIO-80"]), "Could not find expected hex bolt SKU in OCR text")

            # 5. Process the incoming email using the combined text body
            combined_body = f"Please quote the attached list:\n\n{extracted_text}"
            sender_header = "Apex Builders <apex_builders@contractor.com>"
            subject = "New Order Image"
            
            reply_subject, reply_body_tuple, pdf_path, status = process_incoming_email(
                sender_header, subject, combined_body, self.catalog, self.crm_path, "mock", self.project_root
            )

            # 6. Verify processing results
            self.assertEqual(status, "QUOTE_GENERATED")
            self.assertIsNotNone(pdf_path)
            self.assertTrue(os.path.exists(pdf_path))
            
            # Check the generated PDF exists in mock_outbox
            print(f"[Test] PDF quote successfully generated at: {pdf_path}")

        finally:
            # Restore original API key if any
            if old_api_key:
                os.environ["GEMINI_API_KEY"] = old_api_key

if __name__ == "__main__":
    unittest.main()
