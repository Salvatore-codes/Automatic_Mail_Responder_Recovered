import csv
import os
import re
import math
import json
from rapidfuzz import process, fuzz

# A lightweight pure-Python TF-IDF system for local semantic-like matching
def tokenize(text):
    return re.findall(r'\b\w+\b', text.lower())

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
    def __init__(self, csv_path):
        self.csv_path = csv_path
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
            db_synonyms = get_synonyms_from_db()
            for k, v in db_synonyms.items():
                self.synonyms[k] = v
        except Exception as e:
            print(f"[Warning] Failed to sync synonyms from SQLite: {e}")
                
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
            log_synonym(clean_q, sku_id)
        except Exception as e:
            print(f"[Warning] Failed to save synonym to SQLite: {e}")

    def check_synonyms(self, query):
        clean_q = query.lower().strip()
        
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
            
        results = []
        for sku in self.skus:
            q_lower = query.lower()
            name_lower = sku['sku_name'].lower()
            desc_lower = sku['description'].lower()
            
            score_name_sort = fuzz.token_sort_ratio(q_lower, name_lower)
            score_name_set = fuzz.token_set_ratio(q_lower, name_lower)
            score_desc = fuzz.token_set_ratio(q_lower, desc_lower)
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
                    model="text-embedding-004",
                    contents=sku_texts
                )
                for idx, emb in enumerate(response.embeddings):
                    self.gemini_embeddings[self.skus[idx]['sku_id']] = emb.values
            except Exception as e:
                print(f"[Warning] Failed to generate Gemini Embeddings: {e}")
                return []

        try:
            query_resp = client.models.embed_content(
                model="text-embedding-004",
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
