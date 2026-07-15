import csv
import os
import re
import math
import json
import hashlib
import time
import random
from rapidfuzz import process, fuzz

try:
    import numpy as np
except ImportError:
    np = None

# A lightweight pure-Python TF-IDF system for local semantic-like matching
def correct_ocr_typos(text):
    if not text:
        return ""
    # Common WinRT OCR misidentifications for Trofeo catalog items:
    text = re.sub(r'\bblades-knife-io\b', 'blades-knife-10', text, flags=re.IGNORECASE)
    text = re.sub(r'\bblades knife io\b', 'blades knife 10', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbolt-hex-mio-so\b', 'bolt-hex-m10-80', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbolt hex mio so\b', 'bolt hex m10 80', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbolt-hex-ms-so\b', 'bolt-hex-m8-50', text, flags=re.IGNORECASE)
    text = re.sub(r'\bbolt hex ms so\b', 'bolt hex m8 50', text, flags=re.IGNORECASE)
    
    # Generic OCR substitutions for common numeric/alphabetic mixups in SKU structures
    text = re.sub(r'\bmio\b', 'm10', text, flags=re.IGNORECASE)
    text = re.sub(r'\bms\b', 'm8', text, flags=re.IGNORECASE)
    text = re.sub(r'\bm8[- ]so\b', 'm8-50', text, flags=re.IGNORECASE)
    text = re.sub(r'\bm10[- ]so\b', 'm10-80', text, flags=re.IGNORECASE)
    text = re.sub(r'\bknife[- ]io\b', 'knife-10', text, flags=re.IGNORECASE)
    
    # Fractions and dimensions OCR correction
    text = re.sub(r'\b[il]/2\b', '1/2', text, flags=re.IGNORECASE)
    text = re.sub(r'\b[il]\s+1/2\b', '1 1/2', text, flags=re.IGNORECASE)
    text = re.sub(r'\b[il] inch\b', '1 inch', text, flags=re.IGNORECASE)
    
    return text

def normalize_dimensions(text):
    if not text:
        return ""
    text = correct_ocr_typos(text)
    text = text.lower()
    
    # Normalize unicode quotes/prime symbols to standard double/single quotes
    text = re.sub(r'[\u2018\u2019\u201A\u201B]', "'", text)
    text = re.sub(r'[\u201C\u201D\u201E\u201F\u2033\u2036\u02BA]', '"', text)
    
    # Normalize multiplication signs
    text = re.sub(r'\s*[×\u00D7\*]\s*', ' x ', text)
    
    # Normalize mixed fractions (e.g. 1 1/2 or 1-1/2 -> 1.5)
    text = re.sub(r'\b(\d+)\s+1/2\b', lambda m: str(float(m.group(1)) + 0.5), text)
    text = re.sub(r'\b(\d+)-1/2\b', lambda m: str(float(m.group(1)) + 0.5), text)
    text = re.sub(r'\b(\d+)\s+3/4\b', lambda m: str(float(m.group(1)) + 0.75), text)
    text = re.sub(r'\b(\d+)-3/4\b', lambda m: str(float(m.group(1)) + 0.75), text)
    text = re.sub(r'\b(\d+)\s+1/4\b', lambda m: str(float(m.group(1)) + 0.25), text)
    text = re.sub(r'\b(\d+)-1/4\b', lambda m: str(float(m.group(1)) + 0.25), text)
    
    # Simple fractions
    text = re.sub(r'\b1/2\b', '0.5', text)
    text = re.sub(r'\b3/4\b', '0.75', text)
    text = re.sub(r'\b1/4\b', '0.25', text)
    text = re.sub(r'\b3/8\b', '0.375', text)
    text = re.sub(r'\b5/8\b', '0.625', text)
    
    # Normalize inch indicators following a number to 'inch'
    text = re.sub(r'(\d+(?:\.\d+)?)\s*(?:"|\'\'|inch|inches|-inch|\bin\b)', r'\1 inch', text)
    
    # Normalize mm indicators following a number to 'mm' (with space before it for tokenization)
    text = re.sub(r'(\d+(?:\.\d+)?)\s*(?:mm|millimeter|millimeters|-mm)\b', r'\1 mm', text)
    
    # Normalize M-style dimensions like M8+50, M8-50, m 8+50, m8 x 50, etc.
    # We want them to become 'm8 x 50'
    text = re.sub(r'\bm\s*(\d+)\s*[+x\-]?\s*(\d+)\b', r'm\1 x \2', text)
    
    # Replace hyphens/dashes with spaces to facilitate tokenization
    text = re.sub(r'[-–—]', ' ', text)
    
    # Stemming / Suffix normalization of common words to ensure exact matching
    text = re.sub(r'\bthreaded\b', 'thread', text)
    text = re.sub(r'\bwiring\b', 'wire', text)
    text = re.sub(r'\bcables\b', 'cable', text)
    text = re.sub(r'\bbolts\b', 'bolt', text)
    text = re.sub(r'\bnuts\b', 'nut', text)
    text = re.sub(r'\bwashers\b', 'washer', text)
    text = re.sub(r'\bscrews\b', 'screw', text)
    text = re.sub(r'\bpliers\b', 'plier', text)
    text = re.sub(r'\bwrenches\b', 'wrench', text)
    text = re.sub(r'\bvalves\b', 'valve', text)
    text = re.sub(r'\bpipes\b', 'pipe', text)
    text = re.sub(r'\bfittings\b', 'fitting', text)
    text = re.sub(r'\bconnectors\b', 'connector', text)
    text = re.sub(r'\bgaskets\b', 'gasket', text)
    text = re.sub(r'\bstaples\b', 'staple', text)
    text = re.sub(r'\bblades\b', 'blade', text)
    text = re.sub(r'\bstraps\b', 'strap', text)
    
    # Strip any trailing punctuation (like comma, semicolon, dash, etc.) and whitespace
    text = re.sub(r'[-–—,;\s]+$', '', text)
    text = re.sub(r'^\s*[-–—,;\s]+', '', text)
    
    # Clean multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize(text):
    normalized = normalize_dimensions(text)
    # Allow float values (like 0.5 or 1.5) by using \b\w+(?:\.\d+)?\b
    return re.findall(r'\b\w+(?:\.\d+)?\b', normalized)


class SimpleTFIDF:
    def __init__(self, documents):
        self.documents = [tokenize(doc) for doc in documents]
        self.df = {}
        for doc in self.documents:
            for term in set(doc):
                self.df[term] = self.df.get(term, 0) + 1
        self.num_docs = len(documents)
        
    def get_tfidf_vector(self, tokens):
        vector = {}
        if not tokens:
            return vector
        for token in tokens:
            tf = tokens.count(token) / len(tokens)
            df = self.df.get(token, 0)
            idf = math.log((1 + self.num_docs) / (1 + df)) + 1
            vector[token] = tf * idf
        return vector

    def cosine_similarity(self, vec1, vec2):
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])
        sum1 = sum([val**2 for val in vec1.values()])
        sum2 = sum([val**2 for val in vec2.values()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)
        if not denominator:
            return 0.0
        return numerator / denominator


class Catalog:
    def __init__(self, csv_path, tenant_id=None):
        self.csv_path = csv_path
        self.tenant_id = tenant_id
        self.skus = []
        self.load_catalog()
        
        # Load synonyms (Feedback Learning Loop)
        self.synonyms_path = os.path.join(os.path.dirname(csv_path), "synonyms.json")
        self.synonyms = {}
        self.load_synonyms()
        
        # Initialize local TF-IDF matcher
        sku_texts = [f"{sku['sku_name']} {sku['description']} {sku['category']}" for sku in self.skus]
        self.tfidf = SimpleTFIDF(sku_texts)
        self.sku_vectors = [self.tfidf.get_tfidf_vector(tokenize(text)) for text in sku_texts]
        
        self.gemini_embeddings = {}
        
        # Vector embedding index (built lazily via build_vector_index)
        self.embedding_matrix = None
        self.embedding_ids = []
        
    def load_catalog(self):
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"Catalog file not found at {self.csv_path}")
        with open(self.csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=1):
                # Skip empty or completely malformed rows
                if not row or not row.get('sku_id'):
                    continue
                try:
                    price_str = re.sub(r'[^\d.]', '', row.get('price', '0'))
                    row['price'] = float(price_str) if price_str else 0.0
                    
                    stock_str = re.sub(r'[^\d]', '', row.get('stock', '100'))
                    row['stock'] = int(stock_str) if stock_str else 100
                    
                    # Ensure category has a default
                    if not row.get('category'):
                        row['category'] = 'General'
                        
                    self.skus.append(row)
                except Exception as e:
                    print(f"[Warning] Skipping malformed catalog row #{row_num}: {e}")
                
    def load_synonyms(self):
        if os.path.exists(self.synonyms_path):
            try:
                with open(self.synonyms_path, 'r', encoding='utf-8') as f:
                    self.synonyms = json.load(f)
            except Exception:
                self.synonyms = {}
        else:
            self.synonyms = {}
            
        # Merge from SQLite database
        try:
            from src.database_sqlite import get_synonyms_from_db
            db_synonyms = get_synonyms_from_db(tenant_id=self.tenant_id)
            for k, v in db_synonyms.items():
                self.synonyms[k] = v
        except Exception as e:
            print(f"[Warning] Failed to sync synonyms from SQLite for tenant {self.tenant_id}: {e}")
                
    def register_synonym(self, query, sku_id):
        clean_q = query.lower().strip()
        self.synonyms[clean_q] = sku_id
        
        # Save to JSON file
        try:
            with open(self.synonyms_path, 'w', encoding='utf-8') as f:
                json.dump(self.synonyms, f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to write synonym JSON: {e}")
            
        # Save to SQLite database
        try:
            from src.database_sqlite import log_synonym
            log_synonym(clean_q, sku_id, tenant_id=self.tenant_id)
        except Exception as e:
            print(f"[Warning] Failed to save synonym to SQLite for tenant {self.tenant_id}: {e}")

    def get_by_sku_id(self, sku_id):
        """
        Direct lookup of a catalog entry by its exact SKU ID (case-insensitive).
        Returns the SKU dict if found, or None.
        """
        sku_id_upper = sku_id.strip().upper()
        for sku in self.skus:
            if sku['sku_id'].strip().upper() == sku_id_upper:
                return sku
        return None

    def check_synonyms(self, query):
        clean_q = query.lower().strip()
        
        # 0. Check if query matches or contains any SKU ID (ignoring dashes)
        for sku in self.skus:
            sku_id_clean = sku['sku_id'].lower().replace('-', ' ').strip()
            q_clean = clean_q.replace('-', ' ').strip()
            if q_clean == sku_id_clean or re.search(r'\b' + re.escape(sku_id_clean) + r'\b', q_clean):
                return [{
                    "sku": sku,
                    "score": 100.0,
                    "method": "Exact SKU ID Match"
                }]
                
        # 1. Exact match first
        if clean_q in self.synonyms:
            sku_id = self.synonyms[clean_q]
            sku = next((s for s in self.skus if s['sku_id'] == sku_id), None)
            if sku:
                return [{
                    "sku": sku,
                    "score": 100.0,
                    "method": "Synonym Learner"
                }]
                
        # 2. Check if any synonym key is a substring or word in clean_q
        sorted_keys = sorted(self.synonyms.keys(), key=len, reverse=True)
        for key in sorted_keys:
            # Substring match (e.g. "teflon" in "teflon tape rolls") or word match
            if key in clean_q or re.search(r'\b' + re.escape(key) + r'\b', clean_q):
                sku_id = self.synonyms[key]
                sku = next((s for s in self.skus if s['sku_id'] == sku_id), None)
                if sku:
                    return [{
                        "sku": sku,
                        "score": 95.0,
                        "method": "Synonym Learner (Substring)"
                    }]
                    
        # 3. Fuzzy match against synonym keys (to capture typos in synonym lookups)
        for key, sku_id in self.synonyms.items():
            ratio = fuzz.token_sort_ratio(clean_q, key)
            if ratio >= 80.0:
                sku = next((s for s in self.skus if s['sku_id'] == sku_id), None)
                if sku:
                    return [{
                        "sku": sku,
                        "score": 95.0,
                        "method": "Synonym Learner (Fuzzy)"
                    }]
        return []

    def match_fuzzy(self, query, threshold=80, limit=3):
        # First check synonyms database
        syn_match = self.check_synonyms(query)
        if syn_match:
            return syn_match
            
        q_norm = normalize_dimensions(query)
        
        results = []
        for sku in self.skus:
            name_norm = normalize_dimensions(sku['sku_name'])
            desc_norm = normalize_dimensions(sku['description'])
            
            score_name_sort = fuzz.token_sort_ratio(q_norm, name_norm)
            score_name_set = fuzz.token_set_ratio(q_norm, name_norm)
            score_desc = fuzz.token_set_ratio(q_norm, desc_norm)
            best_score = max(score_name_sort, score_name_set, score_desc)
            
            if best_score >= threshold:
                results.append({
                    "sku": sku,
                    "score": round(best_score, 1),
                    "method": "Fuzzy (RapidFuzz)"
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    def match_local_semantic(self, query, limit=3):
        # First check synonyms database
        syn_match = self.check_synonyms(query)
        if syn_match:
            return syn_match
            
        query_tokens = tokenize(query)
        query_vector = self.tfidf.get_tfidf_vector(query_tokens)
        
        results = []
        for idx, sku in enumerate(self.skus):
            similarity = self.tfidf.cosine_similarity(query_vector, self.sku_vectors[idx])
            score = round(similarity * 100, 1)
            if score > 5:
                results.append({
                    "sku": sku,
                    "score": score,
                    "method": "Local TF-IDF Semantic"
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    def match_gemini_embeddings(self, query, client, limit=3):
        # First check synonyms database
        syn_match = self.check_synonyms(query)
        if syn_match:
            return syn_match
            
        if not self.gemini_embeddings:
            print("[System] Generating Gemini Embeddings (simulated)...")
            sku_texts = [f"Name: {sku['sku_name']}. Description: {sku['description']}." for sku in self.skus]
            try:
                response = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=sku_texts
                )
                for idx, emb in enumerate(response.embeddings):
                    self.gemini_embeddings[self.skus[idx]['sku_id']] = emb.values
            except Exception as e:
                print(f"[Warning] Failed to generate Gemini Embeddings: {e}")
                return []

        try:
            query_resp = client.models.embed_content(
                model="gemini-embedding-001",
                contents=query
            )
            query_vector = query_resp.embeddings[0].values
        except Exception as e:
            print(f"[Warning] Failed to embed query: {e}")
            return []

        results = []
        for sku in self.skus:
            sku_vector = self.gemini_embeddings.get(sku['sku_id'])
            if not sku_vector:
                continue
            dot_product = sum(q * s for q, s in zip(query_vector, sku_vector))
            q_norm = math.sqrt(sum(q**2 for q in query_vector))
            s_norm = math.sqrt(sum(s**2 for s in sku_vector))
            similarity = dot_product / (q_norm * s_norm) if q_norm and s_norm else 0.0
            score = round(similarity * 100, 1)
            
            results.append({
                "sku": sku,
                "score": score,
                "method": "Gemini Embeddings"
            })
            
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    def build_vector_index(self, client=None):
        """
        Build or load cached vector embeddings for all SKUs using Gemini gemini-embedding-001.
        Embeddings are cached to disk and only rebuilt when the catalog CSV changes.
        Returns True if index is ready, False otherwise.
        """
        if np is None:
            print("[Vector Index] numpy not installed. Vector matching disabled.")
            return False
            
        cache_dir = os.path.dirname(self.csv_path)
        embeddings_path = os.path.join(cache_dir, "sku_embeddings.npy")
        ids_path = os.path.join(cache_dir, "sku_embedding_ids.json")
        catalog_hash_path = os.path.join(cache_dir, "sku_catalog_hash.txt")
        
        # Compute hash of current catalog to detect changes
        with open(self.csv_path, 'rb') as f:
            current_hash = hashlib.md5(f.read()).hexdigest()
        
        # Check if cache is valid
        cache_valid = False
        if (os.path.exists(embeddings_path) and os.path.exists(ids_path) 
                and os.path.exists(catalog_hash_path)):
            try:
                with open(catalog_hash_path, 'r') as f:
                    cached_hash = f.read().strip()
                if cached_hash == current_hash:
                    cache_valid = True
            except Exception:
                pass
        
        if cache_valid:
            try:
                print("[Vector Index] Loading cached embeddings from disk...")
                self.embedding_matrix = np.load(embeddings_path)
                with open(ids_path, 'r', encoding='utf-8') as f:
                    self.embedding_ids = json.load(f)
                print(f"[Vector Index] Loaded {len(self.embedding_ids)} SKU embeddings from cache.")
                return True
            except Exception as e:
                print(f"[Vector Index] Cache load failed: {e}. Rebuilding...")
                cache_valid = False
        
        # Build fresh embeddings — requires Gemini client
        if not client:
            print("[Vector Index] No Gemini client available. Vector matching disabled.")
            return False
        
        print(f"[Vector Index] Building embeddings for {len(self.skus)} SKUs...")
        sku_texts = [
            f"{sku['sku_name']} {sku.get('description', '')} {sku.get('category', '')}"
            for sku in self.skus
        ]
        sku_ids = [sku['sku_id'] for sku in self.skus]
        
        all_embeddings = []
        batch_size = 100
        
        for i in range(0, len(sku_texts), batch_size):
            batch = sku_texts[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(sku_texts) + batch_size - 1) // batch_size
            
            # Retry loop for rate-limiting
            max_retries = 3
            delay = 1.0
            response = None
            for attempt in range(max_retries + 1):
                try:
                    response = client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=batch
                    )
                    break
                except Exception as e:
                    if attempt < max_retries and ("429" in str(e) or "rate" in str(e).lower() or "exhausted" in str(e).lower() or "overloaded" in str(e).lower()):
                        sleep_time = delay * (0.8 + 0.4 * random.random())
                        print(f"[Vector Index] API rate limited. Retrying batch {batch_num} in {sleep_time:.2f}s...")
                        time.sleep(sleep_time)
                        delay *= 2.0
                    else:
                        print(f"[Vector Index] Embedding batch {batch_num} failed: {e}")
                        return False
            
            if response:
                for emb in response.embeddings:
                    all_embeddings.append(emb.values)
                print(f"[Vector Index] Embedded batch {batch_num}/{total_batches} ({len(batch)} SKUs)")
        
        self.embedding_matrix = np.array(all_embeddings, dtype=np.float32)
        self.embedding_ids = sku_ids
        
        # Pre-normalize for fast cosine similarity (dot product on normalized vectors)
        norms = np.linalg.norm(self.embedding_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.embedding_matrix = self.embedding_matrix / norms
        
        # Save cache to disk
        try:
            np.save(embeddings_path, self.embedding_matrix)
            with open(ids_path, 'w', encoding='utf-8') as f:
                json.dump(sku_ids, f)
            with open(catalog_hash_path, 'w') as f:
                f.write(current_hash)
            print(f"[Vector Index] Built and cached {len(sku_ids)} SKU embeddings to disk.")
        except Exception as e:
            print(f"[Vector Index] Warning: Failed to save cache: {e}")
        
        return True

    def match_vector(self, query_text, client, threshold=0.70, limit=3):
        """
        Match a product query against the vector index using cosine similarity.
        Returns list of matches in the same format as match_fuzzy/match_local_semantic.
        Falls back to empty list if vector index is not available.
        """
        if np is None:
            return []
        if self.embedding_matrix is None or len(self.embedding_ids) == 0:
            success = self.build_vector_index(client=client)
            if not success or self.embedding_matrix is None:
                return []
        
        # First check synonyms (instant exact match)
        syn_match = self.check_synonyms(query_text)
        if syn_match:
            return syn_match
        
        try:
            # Retry loop for single query embedding
            max_retries = 3
            delay = 1.0
            response = None
            for attempt in range(max_retries + 1):
                try:
                    response = client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=query_text
                    )
                    break
                except Exception as e:
                    if attempt < max_retries and ("429" in str(e) or "rate" in str(e).lower() or "exhausted" in str(e).lower() or "overloaded" in str(e).lower()):
                        sleep_time = delay * (0.8 + 0.4 * random.random())
                        print(f"[Vector Match] API rate limited. Retrying query in {sleep_time:.2f}s...")
                        time.sleep(sleep_time)
                        delay *= 2.0
                    else:
                        print(f"[Vector Match] Query embedding failed: {e}")
                        return []
            
            if response is None:
                return []
                
            query_vector = np.array(response.embeddings[0].values, dtype=np.float32)
            
            # Normalize query vector
            q_norm = np.linalg.norm(query_vector)
            if q_norm > 0:
                query_vector = query_vector / q_norm
            
            # Cosine similarity via dot product (both vectors are pre-normalized)
            similarities = self.embedding_matrix @ query_vector
            
            # Get top-K indices
            top_indices = np.argsort(similarities)[::-1][:limit]
            
            results = []
            for idx in top_indices:
                score = float(similarities[idx]) * 100  # Convert to 0-100 scale
                if score >= threshold * 100:
                    sku_id = self.embedding_ids[idx]
                    sku = next((s for s in self.skus if s['sku_id'] == sku_id), None)
                    if sku:
                        results.append({
                            "sku": sku,
                            "score": round(score, 1),
                            "method": "Vector Embedding"
                        })
            
            return results
            
        except Exception as e:
            print(f"[Vector Match] Query embedding failed: {e}")
            return []

    def match_vector_batch(self, queries, client, threshold=0.70, limit=3):
        """
        Match a list of product queries against the vector index in a single batched API call.
        Returns a list of match lists corresponding to each query.
        Falls back to individual match_vector or empty list if vector index is not available or fails.
        """
        if np is None or not queries:
            return [[] for _ in queries]
        if self.embedding_matrix is None or len(self.embedding_ids) == 0:
            success = self.build_vector_index(client=client)
            if not success or self.embedding_matrix is None:
                return [[] for _ in queries]
            
        # Check synonyms first for each query
        synonym_matches = [None] * len(queries)
        uncached_queries = []
        uncached_indices = []
        
        for idx, q in enumerate(queries):
            syn_match = self.check_synonyms(q)
            if syn_match:
                synonym_matches[idx] = syn_match
            else:
                uncached_queries.append(q)
                uncached_indices.append(idx)
                
        if not uncached_queries:
            return synonym_matches
            
        try:
            # Retry loop for batch query embeddings
            max_retries = 3
            delay = 1.0
            response = None
            for attempt in range(max_retries + 1):
                try:
                    response = client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=uncached_queries
                    )
                    break
                except Exception as e:
                    if attempt < max_retries and ("429" in str(e) or "rate" in str(e).lower() or "exhausted" in str(e).lower() or "overloaded" in str(e).lower()):
                        sleep_time = delay * (0.8 + 0.4 * random.random())
                        print(f"[Vector Match Batch] API rate limited. Retrying batch in {sleep_time:.2f}s...")
                        time.sleep(sleep_time)
                        delay *= 2.0
                    else:
                        raise e
            
            if response is None:
                raise RuntimeError("No response received from embedding API.")
                
            query_vectors = np.array([emb.values for emb in response.embeddings], dtype=np.float32)
            
            # Normalize query vectors
            q_norms = np.linalg.norm(query_vectors, axis=1, keepdims=True)
            q_norms[q_norms == 0] = 1.0
            query_vectors = query_vectors / q_norms
            
            # Cosine similarity via dot product (both vectors are pre-normalized)
            # Embedding matrix shape: [num_skus, 3072]
            # Query vectors shape: [num_queries, 3072]
            # Resulting similarities shape: [num_queries, num_skus]
            similarities_matrix = query_vectors @ self.embedding_matrix.T
            
            uncached_results = {}
            for i, idx in enumerate(uncached_indices):
                similarities = similarities_matrix[i]
                # Get top-K indices
                top_indices = np.argsort(similarities)[::-1][:limit]
                results = []
                for sku_idx in top_indices:
                    score = float(similarities[sku_idx]) * 100
                    if score >= threshold * 100:
                        sku_id = self.embedding_ids[sku_idx]
                        sku = next((s for s in self.skus if s['sku_id'] == sku_id), None)
                        if sku:
                            results.append({
                                "sku": sku,
                                "score": round(score, 1),
                                "method": "Vector Embedding"
                            })
                uncached_results[idx] = results
                
            final_results = []
            for idx in range(len(queries)):
                if synonym_matches[idx] is not None:
                    final_results.append(synonym_matches[idx])
                else:
                    final_results.append(uncached_results.get(idx, []))
            return final_results
            
        except Exception as e:
            print(f"[Vector Match Batch] Query embeddings batch failed: {e}. Falling back to individual matching...")
            # Fallback to individual match_vector for each uncached query
            final_results = []
            for idx in range(len(queries)):
                if synonym_matches[idx] is not None:
                    final_results.append(synonym_matches[idx])
                else:
                    final_results.append(self.match_vector(queries[idx], client, threshold, limit))
            return final_results

    def update_sku_properties(self, sku_id, new_stock=None, new_price=None):
        """
        Updates the stock and/or price of a specific SKU in both memory and the catalog CSV file on disk.
        """
        # 1. Update in memory
        found = False
        for sku in self.skus:
            if sku['sku_id'] == sku_id:
                if new_stock is not None:
                    sku['stock'] = int(new_stock)
                if new_price is not None:
                    sku['price'] = float(new_price)
                found = True
                break
        
        if not found:
            print(f"[Catalog] Warning: SKU {sku_id} not found in catalog for property update.")
            return False
            
        # 2. Write back to CSV file
        try:
            # Read the current file to get headers
            headers = []
            with open(self.csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader)
                
            # Read rows as dicts to preserve structure
            rows = []
            with open(self.csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('sku_id') == sku_id:
                        if new_stock is not None:
                            row['stock'] = str(new_stock)
                        if new_price is not None:
                            row['price'] = f"{float(new_price):.2f}"
                    rows.append(row)
                    
            # Write back to CSV
            with open(self.csv_path, mode='w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
                
            print(f"[Catalog] Successfully updated SKU {sku_id} properties (stock={new_stock}, price={new_price}) on disk.")
            return True
        except Exception as e:
            print(f"[Catalog] Error writing updated properties to CSV: {e}")
            return False

    def update_sku_stock(self, sku_id, new_stock):
        """
        Backward-compat method to update stock only.
        """
        return self.update_sku_properties(sku_id, new_stock=new_stock)
