"""
Quick test to verify the Gemini API key in .env is valid and can call the API.
"""
import os
import sys

# Manually load .env without dotenv module
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, val = line.partition('=')
                os.environ.setdefault(key.strip(), val.strip())

api_key = os.environ.get("GEMINI_API_KEY", "")

print("=" * 60)
print("GEMINI API KEY DIAGNOSIS")
print("=" * 60)
print(f"Key found:    {'YES' if api_key else 'NO'}")
print(f"Key length:   {len(api_key)}")
print(f"Key prefix:   {api_key[:10]}..." if len(api_key) >= 10 else f"Key: {api_key}")
print(f"Starts AIza:  {api_key.startswith('AIza')}")
print()

if not api_key:
    print("[ERROR] GEMINI_API_KEY is not set in .env")
    sys.exit(1)

if not api_key.startswith("AIza"):
    print("[WARNING] Key does NOT start with 'AIza'.")
    print("  => Real Gemini API keys look like: AIzaSy...")
    print("  => The provided key looks like an OAuth access token, NOT a Gemini API key.")
    print()
    print("  To get a valid Gemini API key:")
    print("  1. Go to: https://aistudio.google.com/app/apikey")
    print("  2. Click 'Create API Key'")
    print("  3. Copy the key (starts with AIzaSy...)")
    print("  4. Update GEMINI_API_KEY in your .env file")
    print()

print("Testing API call...")
try:
    from google import genai
    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Reply with just the word: WORKING'
    )
    print(f"[SUCCESS] API call worked! Response: {resp.text.strip()}")
except Exception as e:
    print(f"[FAILED] API call failed: {e}")
    print()
    print("This confirms the API key is not valid.")
    print("Please get a fresh API key from: https://aistudio.google.com/app/apikey")
