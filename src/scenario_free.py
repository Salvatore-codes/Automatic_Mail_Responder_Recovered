import re
from src.database import Catalog

def parse_order_text_rules(text):
    """
    Scenario A Rule-based Parser: Extracts product queries and quantities using regular expressions.
    """
    lines = text.strip().split('\n')
    extracted_items = []
    
    # List of keywords to ignore as they are common conversational phrases
    ignore_keywords = ["hi bro", "dear sales", "regards", "best regards", "subject:", "sales team", "urgently", "delivery today", "let me know", "price thx"]
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Skip conversational lines
        if any(ignore in line_clean.lower() for ignore in ignore_keywords):
            continue
            
        # Remove list bullets or markers at start (e.g., "-", "•", "*") but keep digits
        item_text = re.sub(r'^[•\-\*\s]+', '', line_clean).strip()

        # Clean common introductory phrases at the start of the line (case-insensitive)
        intro_prefixes = [
            r'^please\s+quote\s+the\s+following\s*:\s*',
            r'^please\s+quote\s+the\s+following\s*',
            r'^please\s+provide\s+pricing\s+for\s*:\s*',
            r'^please\s+provide\s+pricing\s+for\s*',
            r'^please\s+quote\s*:\s*',
            r'^please\s+quote\s*',
            r'^quote\s+for\s*',
            r'^quote\s*:\s*',
            r'^need\s+prices\s+for\s*:\s*',
            r'^need\s+prices\s+for\s*',
            r'^need\s+pricing\s+for\s*',
            r'^need\s+asap\s*',
            r'^need\s*',
            r'^hi\s+bro\s+need\s+asap\s*',
            r'^hi\s+bro\s+need\s*',
            r'^please\s+provide\s*',
            r'^please\s+send\s+pricing\s+for\s*',
        ]
        for pref in intro_prefixes:
            item_text = re.sub(pref, '', item_text, flags=re.IGNORECASE).strip()

        if not item_text:
            continue
            
        qty = 1
        product_query = item_text
        
        # 1. Look for quantity patterns at start (e.g. "12 brass elbow", "50 hex bolts")
        match_start = re.match(r'^(\d+)\s*(?:x|units|rolls|pcs|pieces|cans|lengths|boxes|bottles)?\s+(.+)', item_text, re.IGNORECASE)
        
        # 2. Look for quantity patterns at end (e.g. "brass elbow - 15 units", "hex bolts 100 pcs")
        match_end = re.search(r'\b[-–—]?\s*(\d+)\s*(?:units|rolls|pcs|pieces|cans|lengths|boxes|bottles|cans)?\s*$', item_text, re.IGNORECASE)
        
        if match_start:
            qty = int(match_start.group(1))
            product_query = match_start.group(2).strip()
        elif match_end:
            qty = int(match_end.group(1))
            # Remove quantity suffix from the product query
            product_query = item_text[:match_end.start()].strip()
            # Clean up trailing dashes
            product_query = re.sub(r'[-–—]$', '', product_query).strip()
            
        # Clean up generic helper words
        product_query = re.sub(r'\b(need|some|stuff|rolls of|cans of|lengths of|size|joints|and also matching)\b', '', product_query, flags=re.IGNORECASE)
        product_query = re.sub(r'\s+', ' ', product_query).strip()
        
        if len(product_query) > 2:
            extracted_items.append({
                "original_line": line_clean,
                "parsed_query": product_query,
                "quantity": qty
            })
            
    return extracted_items


def run_scenario_free(order_text, catalog):
    """
    Runs the complete Scenario A pipeline:
    1. Parse raw text into search queries and quantities.
    2. Run fuzzy string similarity & TF-IDF search on the catalog.
    3. Generate the best match for each line.
    """
    parsed_items = parse_order_text_rules(order_text)
    matched_lines = []
    
    for item in parsed_items:
        query = item['parsed_query']
        qty = item['quantity']
        
        # Get candidates from Fuzzy matching with high threshold (80)
        fuzzy_candidates = catalog.match_fuzzy(query, threshold=80, limit=3)
        # Get candidates from Local TF-IDF semantic matching
        tfidf_candidates = catalog.match_local_semantic(query, limit=3)
        
        # Combine lists and pick the best match
        combined = {}
        
        for cand in fuzzy_candidates:
            sku_id = cand['sku']['sku_id']
            combined[sku_id] = {
                "sku": cand['sku'],
                "score": cand['score'],
                "method": "Fuzzy Match"
            }
            
        for cand in tfidf_candidates:
            sku_id = cand['sku']['sku_id']
            if sku_id in combined:
                combined[sku_id]['score'] = max(combined[sku_id]['score'], cand['score'])
                combined[sku_id]['method'] = "Fuzzy + Semantic"
            else:
                combined[sku_id] = {
                    "sku": cand['sku'],
                    "score": cand['score'],
                    "method": "Local TF-IDF Match"
                }
                
        # Sort combined candidates by score descending
        sorted_candidates = sorted(combined.values(), key=lambda x: x['score'], reverse=True)
        
        # Enforce minimum matching score of 80.0% (nearing 90%)
        if sorted_candidates and sorted_candidates[0]['score'] >= 80.0:
            best_match = sorted_candidates[0]
            matched_lines.append({
                "original_line": item['original_line'],
                "parsed_query": query,
                "quantity": qty,
                "matched_sku_id": best_match['sku']['sku_id'],
                "matched_sku_name": best_match['sku']['sku_name'],
                "unit_price": best_match['sku']['price'],
                "confidence": best_match['score'],
                "match_method": best_match['method']
            })
        else:
            # No match found or score below threshold
            matched_lines.append({
                "original_line": item['original_line'],
                "parsed_query": query,
                "quantity": qty,
                "matched_sku_id": "UNKNOWN",
                "matched_sku_name": "No match found",
                "unit_price": 0.0,
                "confidence": 0.0,
                "match_method": "None"
            })
            
    return matched_lines
