import unittest
import openpyxl
from io import BytesIO
from unittest.mock import MagicMock, patch

from src.email_listener import (
    extract_text_from_xlsx,
    extract_text_from_xls,
    extract_text_from_docx
)

class TestAttachmentParsing(unittest.TestCase):

    def test_extract_text_from_xlsx(self):
        # Create a mock Excel spreadsheet in memory using openpyxl
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "OrderList"
        sheet.append(["Product SKU", "Quantity", "Comment"])
        sheet.append(["BOX-CONDUIT-1G", 10, "Needed urgently"])
        sheet.append(["PTFE-TAPE-12", 5, "Alternative accepted"])
        
        # Save to bytes
        out = BytesIO()
        wb.save(out)
        xlsx_bytes = out.getvalue()
        wb.close()
        
        # Parse it
        extracted_text = extract_text_from_xlsx(xlsx_bytes)
        
        # Verify
        self.assertIn("Sheet: OrderList", extracted_text)
        self.assertIn("BOX-CONDUIT-1G, 10, Needed urgently", extracted_text)
        self.assertIn("PTFE-TAPE-12, 5, Alternative accepted", extracted_text)

    @patch("xlrd.open_workbook")
    def test_extract_text_from_xls_mock(self, mock_open_workbook):
        # Mock the workbook structure for xlrd
        mock_wb = MagicMock()
        mock_wb.nsheets = 1
        
        mock_sheet = MagicMock()
        mock_sheet.name = "LegacyOrder"
        mock_sheet.nrows = 2
        mock_sheet.row_values.side_effect = [
            ["SKU ID", "QTY"],
            ["ELBOW-BRASS-050", 15]
        ]
        
        mock_wb.sheet_by_index.return_value = mock_sheet
        mock_open_workbook.return_value = mock_wb
        
        # Call with dummy bytes
        xls_bytes = b"fake xls binary data"
        extracted_text = extract_text_from_xls(xls_bytes)
        
        # Verify
        mock_open_workbook.assert_called_once_with(file_contents=xls_bytes)
        self.assertIn("Sheet: LegacyOrder", extracted_text)
        self.assertIn("ELBOW-BRASS-050, 15", extracted_text)

    def test_extract_text_from_docx_invalid(self):
        # Passing invalid bytes to docx parsing should return empty string gracefully
        self.assertEqual(extract_text_from_docx(b"invalid zip data"), "")

if __name__ == "__main__":
    unittest.main()
