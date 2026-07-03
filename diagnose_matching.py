"""
Diagnose why 'Brass Thread Elbow - 15 unit' and 'Bolt - Hex-m 8+50' didn't match.
Shows exact fuzzy scores against every candidate.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from src.database import Catalog
from src.scenario_free import normalize_dimensions, parse_order_text_rules, run_scenario_free

catalog = Catalog(os.path.join(os.path.dirname(__file__), 'data', 'sku_catalog.csv'))

# Exactly what Gemini returned from the image
attachment_output = """1. Brass Thread Elbow - 15 unit
2. Bolt - Hex-m 8+50, 2 unit
3. Standard Flat washer for M8 - 10 units"""

print("=" * 70)
print("RAW ATTACHMENT TEXT FROM GEMINI:")
print(attachment_output)
print()

# What parse_order_text_rules extracts
parsed = parse_order_text_rules(attachment_output)
print("=" * 70)
print("PARSED ITEMS (after normalize_dimensions):")
for p in parsed:
    print(f"  original_line : {p['original_line']}")
    print(f"  parsed_query  : {p['parsed_query']}")
    print(f"  quantity      : {p['quantity']}")
    print()

print("=" * 70)
print("FUZZY MATCH SCORES (all candidates, threshold 80):")
print()

for item in parsed:
    query = item['parsed_query']
    print(f"Query: '{query}'")
    print("-" * 50)

    # Fuzzy
    fuzzy = catalog.match_fuzzy(query, threshold=0, limit=5)
    print("  Fuzzy candidates:")
    for c in fuzzy:
        marker = " *** MATCH" if c['score'] >= 80 else ""
        print(f"    [{c['score']:.1f}] {c['sku']['sku_id']:25} | {c['sku']['sku_name']}{marker}")

    # TF-IDF
    tfidf = catalog.match_local_semantic(query, limit=5)
    print("  TF-IDF candidates:")
    for c in tfidf:
        marker = " *** MATCH" if c['score'] >= 80 else ""
        print(f"    [{c['score']:.1f}] {c['sku']['sku_id']:25} | {c['sku']['sku_name']}{marker}")

    print()

print("=" * 70)
print("FULL SCENARIO_FREE RESULT (final matched_lines):")
result = run_scenario_free(attachment_output, catalog)
for r in result:
    print(f"  {r['original_line']}")
    print(f"    => sku_id   : {r['matched_sku_id']}")
    print(f"    => sku_name : {r['matched_sku_name']}")
    print(f"    => conf     : {r['confidence']:.1f}%")
    print(f"    => method   : {r['match_method']}")
    print()
