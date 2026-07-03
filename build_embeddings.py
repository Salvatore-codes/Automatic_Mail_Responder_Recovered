"""
Standalone script to pre-build the vector embedding index for the SKU catalog.
Run this after any catalog update to rebuild the cached embeddings.

Usage:
    python build_embeddings.py

The script will:
1. Load the SKU catalog from data/sku_catalog.csv
2. Generate embeddings using Gemini text-embedding-004
3. Save the index to data/sku_embeddings.npy + data/sku_embedding_ids.json
4. Cache a hash of the catalog for change detection
"""
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from src.database import Catalog


def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    catalog_path = os.path.join(project_root, "data", "sku_catalog.csv")
    
    print("=" * 70)
    print("  TROFEO SKU VECTOR EMBEDDING BUILDER")
    print("=" * 70)
    
    # Load catalog
    print(f"\n[1/3] Loading catalog from: {catalog_path}")
    catalog = Catalog(catalog_path)
    print(f"      Loaded {len(catalog.skus)} SKUs")
    
    # Initialize Gemini client
    print("\n[2/3] Initializing Gemini client...")
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key.startswith("your_"):
        print("ERROR: GEMINI_API_KEY not configured in .env file.")
        print("Please set a valid Gemini API key and try again.")
        sys.exit(1)
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        print("      Gemini client initialized successfully")
    except Exception as e:
        print(f"ERROR: Failed to initialize Gemini client: {e}")
        sys.exit(1)
    
    # Build embeddings
    print(f"\n[3/3] Building vector embeddings for {len(catalog.skus)} SKUs...")
    success = catalog.build_vector_index(client=client)
    
    if success:
        data_dir = os.path.join(project_root, "data")
        print(f"\n{'=' * 70}")
        print(f"  SUCCESS! Vector index built and cached.")
        print(f"  Files:")
        print(f"    - {os.path.join(data_dir, 'sku_embeddings.npy')}")
        print(f"    - {os.path.join(data_dir, 'sku_embedding_ids.json')}")
        print(f"    - {os.path.join(data_dir, 'sku_catalog_hash.txt')}")
        print(f"  Matrix shape: {catalog.embedding_matrix.shape}")
        print(f"{'=' * 70}")
    else:
        print("\nFAILED: Could not build vector embeddings.")
        sys.exit(1)


if __name__ == "__main__":
    main()
