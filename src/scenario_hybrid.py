import os
import json
from google import genai
from google.genai import types
from src.database import Catalog

# Pre-defined mock Gemini responses for testing when API key is missing
MOCK_GEMINI_RESPONSES = {
    "email": [
        {"extracted_item": "Brass Threaded Elbow Fitting 1/2 Inch", "quantity": 15, "original_phrase": "1. Brass Threaded Elbow Fitting 1/2 Inch - 15 units"},
        {"extracted_item": "PTFE Teflon Seal Tape 12mm", "quantity": 10, "original_phrase": "2. PTFE Teflon Seal Tape 12mm - 10 rolls"},
        {"extracted_item": "Hex Head Bolt M8 x 50mm", "quantity": 100, "original_phrase": "3. Hex Head Bolt M8 x 50mm - 100 pcs"},
        {"extracted_item": "Hex Nut M8 Zinc Plated", "quantity": 100, "original_phrase": "4. Standard Hex Nut M8 - 100 pcs"},
        {"extracted_item": "Spirit Level Aluminum 24 Inch", "quantity": 2, "original_phrase": "5. Spirit Level 24 Inch - 2 units"},
        {"extracted_item": "PVC Conduit Pipe 20mm x 2m", "quantity": 20, "original_phrase": "6. PVC Conduit Pipe 20mm (2m length) - 20 lengths"},
        {"extracted_item": "Emulsion Wall Paint White 5L", "quantity": 4, "original_phrase": "7. White Emulsion Wall Paint 5L - 4 cans"}
    ],
    "whatsapp": [
        {"extracted_item": "Brass Threaded Elbow Fitting 1/2 Inch", "quantity": 12, "original_phrase": "- 12 brass elbow joints 1/2 size"},
        {"extracted_item": "PTFE Teflon Seal Tape 12mm", "quantity": 5, "original_phrase": "- 5 teflon taps (the plumbing sealing one)"},
        {"extracted_item": "Hex Head Bolt M8 x 50mm", "quantity": 50, "original_phrase": "- 50 hex bolts m8 50mm"},
        {"extracted_item": "Hex Nut M8 Zinc Plated", "quantity": 50, "original_phrase": "matching 50 hex nuts m8"},
        {"extracted_item": "Spirit Level Aluminum 24 Inch", "quantity": 1, "original_phrase": "- 1 spirit level 24inch size"},
        {"extracted_item": "WD-40 Multi-Use Lubricant 300ml", "quantity": 1, "original_phrase": "- 1 wd-40 spray can (300ml)"},
        {"extracted_item": "Paint Brush 2 Inch Basic", "quantity": 4, "original_phrase": "- 4 paint brushes 2 inch"}
    ]
}


def parse_order_with_gemini(text, client, is_mock=False, input_type="custom", tenant_id=None):
    """
    Scenario B LLM Ingestion: Uses Gemini to extract clean, structured JSON items from raw text/images.
    If is_mock=True or the API is offline, it serves high-quality mock extractions based on the input type.
    """
    if is_mock:
        if input_type in MOCK_GEMINI_RESPONSES:
            return MOCK_GEMINI_RESPONSES[input_type]
        else:
            # Simple heuristic fallback if user inputs custom text in mock mode
            print("[Warning] API Key missing/invalid and using custom text. Running heuristic extraction...")
            from src.scenario_free import parse_order_text_rules
            free_extracted = parse_order_text_rules(text)
            return [
                {
                    "extracted_item": item['parsed_query'],
                    "quantity": item['quantity'],
                    "original_phrase": item['original_line']
                } for item in free_extracted
            ]
            
    from src.database_sqlite import get_active_vertical
    active_vertical = get_active_vertical(tenant_id)
    industry = active_vertical.get("industry", "hardware")
    guidelines = active_vertical.get("guidelines", "")

    prompt = f"""
    You are an intelligent order processing agent for a {industry} business.
    Your task is to read the customer order enquiry and extract all individual {industry} items they want to buy or hire.

    IMPORTANT: The customer enquiry may be written in English, Tamil (தமிழ்), or Romanized Tamil (Tanglish) like "yennaku 10 bolts venum", "ஆடிட் செய்ய வேண்டும்", or "10 rolls teflon tape required".
    Translate any Tamil or Romanized Tamil product/service terms into their English equivalent name/description so they can be matched against the catalog.

    Company Guidelines to follow:
    {guidelines}

    IMPORTANT: The input may be a structured TABLE copied from a spreadsheet or web form, where columns are separated by tabs or newlines.
    Common table column layouts include:
    - Particulars | Part No | Quantity | UOM
    - Part No | Description | Qty | Unit
    - Description | SKU | Quantity | UOM
    The first row is always the header — SKIP it. Each subsequent row is one product.
    Some rows may have the Part No (SKU code like "BOLT-HEX-M8-50") in the FIRST column and the description in the SECOND column — handle both orderings.

    For each data row, identify:
    1. 'extracted_item': The English product/service name/description (translate from Tamil if written in Tamil). E.g. "Utility Knife Spare Blades 10pc", "Hex Head Bolt M8 x 50mm", "Statutory Audit Assistance".
    2. 'sku_hint': The Part No / SKU code if present in the row (e.g. "BLADES-KNIFE-10", "BOLT-HEX-M8-50"). Leave as empty string "" if not present.
    3. 'quantity': The numeric quantity requested as an integer. Default to 1 if not specified.
    4. 'original_phrase': The full original row text from the customer.

    Rules:
    - Do NOT invent items not present in the input.
    - Do NOT duplicate rows.
    - Skip any row that is a header (contains words like "Particulars", "Part No", "Quantity", "UOM", "Description", "SKU").
    - If a row contains ONLY a SKU code with no description, look at adjacent rows to pair them correctly.

    Return ONLY a valid JSON array of objects. No markdown, no backticks.
    Example output:
    [
      {{"extracted_item": "Utility Knife Spare Blades 10pc", "sku_hint": "BLADES-KNIFE-10", "quantity": 15, "original_phrase": "Utility Knife Spare Blades 10pc | BLADES-KNIFE-10 | 15 | Nos"}},
      {{"extracted_item": "Hex Head Bolt M8 x 50mm", "sku_hint": "BOLT-HEX-M8-50", "quantity": 3, "original_phrase": "BOLT-HEX-M8-50 | Hex Head Bolt M8 x 50mm | 3 | Pcs"}}
    ]

    Here is the customer enquiry:
    ---
    {text}
    ---
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Using Gemini 2.5 Flash for state of the art fast parsing
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"[Error] Gemini API generation failed: {e}. Falling back to simulated mock output.")
        return parse_order_with_gemini(text, client, is_mock=True, input_type=input_type, tenant_id=tenant_id)


def run_scenario_hybrid(order_text, catalog, input_type="custom", tenant_id=None):
    """
    Runs the complete Scenario B (Hybrid) pipeline:
    1. Extract structured JSON items using Gemini (live or mock).
    2. Match extracted queries against catalog using Gemini Semantic Embeddings (or local TF-IDF fallback if key missing).
    3. Return matched items with confidence scores.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    client = None
    is_mock = True
    
    if api_key and api_key.strip() and not api_key.startswith("your_"):
        try:
            client = genai.Client(api_key=api_key)
            is_mock = False
        except Exception as e:
            print(f"[System] Error initializing Gemini client: {e}. Running in Mock Mode.")
    
    if is_mock:
        print("[System] Running in MOCK Mode (No valid GEMINI_API_KEY detected).")
    else:
        print("[System] Running in LIVE API Mode (GEMINI_API_KEY detected).")
        
    # Step 1: Parse the unstructured text with Gemini
    extracted_items = parse_order_with_gemini(order_text, client, is_mock=is_mock, input_type=input_type, tenant_id=tenant_id)
    
    matched_lines = []
    
    # Step 2: Match each extracted item
    for item in extracted_items:
        query = item.get('extracted_item', '')
        qty = item.get('quantity', 1)
        original = item.get('original_phrase', query)
        sku_hint = item.get('sku_hint', '').strip()
        
        best_match = None
        match_method = "None"
        confidence = 0.0
        
        # Priority 0: Direct SKU lookup — if Gemini extracted a Part No, use it directly
        if sku_hint:
            direct = catalog.get_by_sku_id(sku_hint)
            if direct:
                best_match = direct
                confidence = 100.0
                match_method = "Direct SKU Lookup"
        
        if not best_match and not is_mock and client:
            # Priority 1: Match using Gemini embeddings
            candidates = catalog.match_gemini_embeddings(query, client, limit=1)
            if candidates:
                best_match = candidates[0]['sku']
                confidence = candidates[0]['score']
                match_method = "Gemini Embeddings"
        
        # Priority 2: Fallback to local TF-IDF semantic search
        if not best_match:
            search_query = query or sku_hint
            candidates = catalog.match_local_semantic(search_query, limit=1)
            if candidates:
                best_match = candidates[0]['sku']
                confidence = candidates[0]['score']
                match_method = "Local TF-IDF Match"
                
        if best_match and confidence >= 80.0:
            matched_lines.append({
                "original_line": original,
                "parsed_query": query,
                "quantity": qty,
                "matched_sku_id": best_match['sku_id'],
                "matched_sku_name": best_match['sku_name'],
                "unit_price": best_match['price'],
                "confidence": confidence,
                "match_method": match_method
            })
        else:
            matched_lines.append({
                "original_line": original,
                "parsed_query": query,
                "quantity": qty,
                "matched_sku_id": "UNKNOWN",
                "matched_sku_name": "No match found",
                "unit_price": 0.0,
                "confidence": 0.0,
                "match_method": "None"
            })
            
    return matched_lines

