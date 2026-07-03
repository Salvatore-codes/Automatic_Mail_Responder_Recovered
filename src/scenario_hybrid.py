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


def parse_order_with_gemini(text, client, is_mock=False, input_type="custom"):
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
            
    prompt = f"""
    You are an intelligent order processing agent for a hardware shop.
    Your task is to read the customer order enquiry (which may contain spelling errors, shorthand, or conversational fluff)
    and extract all individual hardware items they want to buy.
    
    For each item, identify:
    1. 'extracted_item': Cleaned, standardized name of the product with all sizes/specs (e.g. "PTFE Teflon Seal Tape 12mm", "Hex Head Bolt M8 x 50mm", "Brass Elbow 1/2 Inch").
    2. 'quantity': The count/units requested. (Extract integers only, default to 1 if not specified).
    3. 'original_phrase': The original line or segment of text from the customer.

    Return ONLY a JSON array of objects. Do not include markdown formatting or backticks around the JSON.
    Example output format:
    [
      {{"extracted_item": "brass elbow 1/2 inch", "quantity": 10, "original_phrase": "- 10 brass elbow joints 1/2"}}
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
        return parse_order_with_gemini(text, client, is_mock=True, input_type=input_type)


def run_scenario_hybrid(order_text, catalog, input_type="custom"):
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
    extracted_items = parse_order_with_gemini(order_text, client, is_mock=is_mock, input_type=input_type)
    
    matched_lines = []
    
    # Step 2: Match each extracted item
    for item in extracted_items:
        query = item['extracted_item']
        qty = item['quantity']
        original = item['original_phrase']
        
        best_match = None
        match_method = "None"
        confidence = 0.0
        
        if not is_mock and client:
            # Match using Gemini embeddings
            candidates = catalog.match_gemini_embeddings(query, client, limit=1)
            if candidates:
                best_match = candidates[0]['sku']
                confidence = candidates[0]['score']
                match_method = "Gemini Embeddings"
        
        # Fallback to local TF-IDF semantic search if live match fails or is in mock mode
        if not best_match:
            candidates = catalog.match_local_semantic(query, limit=1)
            if candidates:
                best_match = candidates[0]['sku']
                confidence = candidates[0]['score']
                match_method = "Local TF-IDF Match (Simulated)"
                
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
