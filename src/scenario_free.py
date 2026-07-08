import re
from src.database import Catalog, normalize_dimensions


def parse_order_text_rules(text, catalog=None):
    """
    Scenario A Rule-based Parser: Extracts product queries and quantities using regular expressions.
    """
    if catalog is None:
        try:
            import os
            from src.database import Catalog
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
            catalog = Catalog(catalog_path)
        except Exception:
            pass

    lines = text.strip().split('\n')
    extracted_items = []
    
    # List of keywords to ignore as they are common conversational phrases
    ignore_keywords = [
        "hi bro", "dear sales", "regards", "best regards", "subject:", "sales team", 
        "urgently", "delivery today", "let me know", "price thx", "remove all", "want you to", 
        "provide me with", "respectively", "attachment", "thank you", "please find", 
        "pricing details", "quote request", "enquiry", "inquiry"
    ]
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Skip attachment metadata headers (e.g. "[From attachment '1000197932.jpg']:")
        if re.match(r'^\[From attachment', line_clean, re.IGNORECASE):
            continue
            
        # Skip conversational lines
        if any(ignore in line_clean.lower() for ignore in ignore_keywords):
            continue
            
        # Remove list bullets or markers at start (e.g., "-", "•", "*", "1.", "2.")
        item_text = re.sub(r'^[•\-\*\s]+', '', line_clean).strip()
        # Remove leading numbered list prefix like "1." or "1)" or "1:"
        item_text = re.sub(r'^\d+[.):]\s*', '', item_text).strip()

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

        # Direct SKU match to prevent splitting SKU IDs (e.g. COUPLER-PVC-075 -> coupler pvc + qty 75)
        if catalog and catalog.get_by_sku_id(item_text):
            extracted_items.append({
                "original_line": line_clean,
                "parsed_query": item_text,
                "quantity": 1
            })
            continue
            
        qty = 1
        product_query = item_text
        
        # 1. Look for quantity patterns at start (e.g. "12, brass elbow", "50 x hex bolts", "10.5 mts teflon")
        match_start = re.match(r'^(\d+(?:\.\d+)?)[,\s]*(?:x|units?|rolls?|pcs?|pieces?|cans?|lengths?|boxes?|bottles?|counts?|nos?|numbers?|qty|packet|pack|pkt|bags?|mts?|meters?|mtrs?)\s+(.+)', item_text, re.IGNORECASE)
        if not match_start:
            # Fallback to pure digit start if followed by spaces/words
            match_start = re.match(r'^(\d+(?:\.\d+)?)[,\s]+\s*(.+)', item_text, re.IGNORECASE)
        
        # 2. Look for quantity patterns at end (e.g. "brass elbow - 15 units", "hex bolts 100 pcs", "tape - 10.5 mts")
        match_end = re.search(r'\b[-–—]?\s*(\d+(?:\.\d+)?)\s*(?:units?|rolls?|pcs?|pieces?|cans?|lengths?|boxes?|bottles?|counts?|nos?|numbers?|qty|packet|pack|pkt|bags?|mts?|meters?|mtrs?)\s*$', item_text, re.IGNORECASE)
        if not match_end:
            # Fallback to pure digit end
            match_end = re.search(r'\b[-–—]?\s*(\d+(?:\.\d+)?)\s*$', item_text, re.IGNORECASE)
        
        if match_start:
            try:
                val = float(match_start.group(1))
                qty = int(val) if val.is_integer() else val
            except ValueError:
                qty = 1
            product_query = match_start.group(2).strip()
        elif match_end:
            try:
                val = float(match_end.group(1))
                qty = int(val) if val.is_integer() else val
            except ValueError:
                qty = 1
            # Remove quantity suffix from the product query
            product_query = item_text[:match_end.start()].strip()
            
        # Clean leading/trailing punctuation before normalization
        product_query = re.sub(r'^[-–—,;\s]+', '', product_query)
        product_query = re.sub(r'[-–—,;\s]+$', '', product_query).strip()
        
        # Normalize product_query dimensions/special characters AFTER quantity parsing
        product_query = normalize_dimensions(product_query)
        
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


def run_scenario_free(order_text, catalog, gemini_client=None):
    """
    Runs the complete Scenario A pipeline:
    1. Parse raw text into search queries and quantities.
    2. Run fuzzy string similarity & TF-IDF search on the catalog.
    3. (Optional) Run vector embedding search if available.
    4. Combine all candidates and generate the best match for each line.
    
    When gemini_client is provided and catalog has a built vector index,
    vector embedding matches are combined with fuzzy/TF-IDF candidates.
    Without a client, the function works exactly as before.
    """
    parsed_items = parse_order_text_rules(order_text, catalog=catalog)
    matched_lines = []
    
    # Auto-build vector index if client is available but embeddings are not loaded/built
    if gemini_client is not None and (not hasattr(catalog, 'embedding_matrix') or catalog.embedding_matrix is None):
        try:
            print("[Scenario Free] Lazy building/loading vector index...")
            catalog.build_vector_index(gemini_client)
        except Exception as e:
            print(f"[Scenario Free] Failed to build vector index: {e}")
            
    # Check if vector matching is available
    use_vector = (
        gemini_client is not None 
        and hasattr(catalog, 'embedding_matrix') 
        and catalog.embedding_matrix is not None
        and len(catalog.embedding_ids) > 0
    )
    
    # Batch query embedding (if vector search is enabled and there are items)
    batch_vector_candidates = [[] for _ in parsed_items]
    if use_vector and parsed_items:
        try:
            queries = [item['parsed_query'] for item in parsed_items]
            batch_vector_candidates = catalog.match_vector_batch(queries, gemini_client, threshold=0.70, limit=3)
        except Exception as e:
            print(f"[Vector Match Batch] Skipped batch embedding: {e}")
            batch_vector_candidates = [[] for _ in parsed_items]
            
    for idx, item in enumerate(parsed_items):
        query = item['parsed_query']
        qty = item['quantity']
        
        # Existing matching methods (always run — backward compatible)
        fuzzy_candidates = catalog.match_fuzzy(query, threshold=80, limit=3)
        tfidf_candidates = catalog.match_local_semantic(query, limit=3)
        
        # Supplementary vector matching (pre-computed in batch)
        vector_candidates = batch_vector_candidates[idx]
        
        # Combine ALL candidate sources — best score wins
        combined = {}
        for cand in vector_candidates + fuzzy_candidates + tfidf_candidates:
            sku_id = cand['sku']['sku_id']
            score = cand['score']
            if sku_id in combined:
                combined[sku_id]['score'] = max(combined[sku_id]['score'], score)
                # Prefer the method name of the higher-scoring source
                if score > combined[sku_id]['score']:
                    combined[sku_id]['method'] = cand.get('method', 'Unknown')
            else:
                combined[sku_id] = {'sku': cand['sku'], 'score': score, 'method': cand.get('method', 'Unknown')}
                
        sorted_candidates = sorted(combined.values(), key=lambda x: x['score'], reverse=True)
        
        if sorted_candidates and sorted_candidates[0]['score'] >= 80.0:
            best = sorted_candidates[0]
            match_method = best.get('method', 'Semantic/Fuzzy')
            matched_lines.append({
                "original_line": item['original_line'],
                "parsed_query": query,
                "quantity": qty,
                "matched_sku_id": best['sku']['sku_id'],
                "matched_sku_name": best['sku']['sku_name'],
                "unit_price": best['sku']['price'],
                "confidence": best['score'],
                "match_method": match_method
            })
        else:
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
