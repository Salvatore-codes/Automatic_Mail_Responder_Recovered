import os
import re
import json
import urllib.request
from bs4 import BeautifulSoup
from google import genai
from google.genai import types

def fetch_url_text(url: str) -> str:
    """Fetches a URL and extracts clean visible text."""
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10.0) as response:
            html = response.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            # Remove scripts and styles
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase for line in lines for phrase in line.split("  "))
            text_clean = "\n".join(chunk for chunk in chunks if chunk)
            return text_clean[:5000] # Cap to first 5000 chars of site content
    except Exception as e:
        print(f"[Onboard Agent] Error fetching URL {url}: {e}")
        return ""

def extract_logo_from_url(url: str) -> str:
    """
    Attempts to extract the best company logo URL from a website.
    Checks in priority order:
      1. <link rel='apple-touch-icon'> (highest quality, often the brand mark)
      2. Open Graph image (og:image) — often the brand logo
      3. <link rel='icon'> with PNG/SVG extension
      4. Standard /favicon.ico fallback
    Returns an absolute URL string, or empty string if none found.
    """
    try:
        from urllib.parse import urljoin, urlparse
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10.0) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        soup = BeautifulSoup(html, 'html.parser')
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        candidates = []

        # 1. Apple touch icon (usually a clean square logo, high quality)
        for rel in ['apple-touch-icon', 'apple-touch-icon-precomposed']:
            tag = soup.find('link', rel=rel)
            if tag and tag.get('href'):
                candidates.append(('apple', urljoin(base_url, tag['href'])))

        # 2. Open Graph image
        og = soup.find('meta', property='og:image') or soup.find('meta', attrs={'name': 'og:image'})
        if og and og.get('content'):
            candidates.append(('og', urljoin(base_url, og['content'])))

        # 3. Twitter card image
        tw = soup.find('meta', attrs={'name': 'twitter:image'})
        if tw and tw.get('content'):
            candidates.append(('twitter', urljoin(base_url, tw['content'])))

        # 4. Link icons that are PNG/SVG (better than .ico)
        for tag in soup.find_all('link', rel=lambda r: r and ('icon' in r or 'shortcut' in r)):
            href = tag.get('href', '')
            if href and any(href.lower().endswith(ext) for ext in ['.png', '.svg', '.jpg', '.jpeg', '.webp']):
                candidates.append(('icon', urljoin(base_url, href)))

        # 5. Fallback: standard /favicon.ico
        candidates.append(('favicon', f"{base_url}/favicon.ico"))

        # Return the first valid candidate
        for source, logo_url in candidates:
            print(f"[Onboard Agent] Logo candidate ({source}): {logo_url}")
            return logo_url  # Return the best candidate found

        return ""
    except Exception as e:
        print(f"[Onboard Agent] Could not extract logo from {url}: {e}")
        return ""

def download_logo(logo_url: str, save_path: str) -> bool:
    """Downloads a logo from a URL and saves it to save_path. Returns True on success."""
    try:
        req = urllib.request.Request(
            logo_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10.0) as response:
            data = response.read()
            if len(data) < 100:  # Too small — probably not a real image
                return False
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(data)
            print(f"[Onboard Agent] Logo saved to {save_path} ({len(data)} bytes)")
            return True
    except Exception as e:
        print(f"[Onboard Agent] Failed to download logo from {logo_url}: {e}")
        return False


def classify_business_type_from_text(text: str) -> str:
    """
    Scans the given brochure/website text for strong service-oriented vs product/trading keywords
    to determine if the company belongs to the Services or Trading vertical.
    """
    if not text:
        return "Trading"
        
    text_lower = text.lower()
    
    # Define service-oriented keywords
    service_keywords = [
        "service", "services", "consulting", "consultancy", "compliance", "audit", 
        "advisory", "filing", "taxation", "bookkeeping", "accounting", "housekeeping", 
        "manpower", "cleaning", "facility", "maintenance", "security", "contract", 
        "retainer", "subscription", "agency", "outsourcing", "advisors", "advisor",
        "liaisoning", "statutory", "legal", "payroll", "esic", "epf", "gst", "tds"
    ]
    
    # Define trading/product/stock-oriented keywords
    trading_keywords = [
        "trading", "distributor", "supplier", "stock", "inventory", "warehouse", 
        "spare parts", "hardware", "bolts", "nuts", "elbows", "valves", "screws", 
        "manufacturer", "goods", "supplies", "materials", "material", "products", 
        "wholesale", "retail", "items", "catalog", "catalogue", "stockist", "merchandise",
        "appliances", "equipment", "utensils", "commodity"
    ]
    
    service_count = sum(text_lower.count(kw) for kw in service_keywords)
    trading_count = sum(text_lower.count(kw) for kw in trading_keywords)
    
    print(f"[Onboard Classifier] Service keywords count: {service_count}, Trading keywords count: {trading_count}")
    
    # Default to Services if service keywords dominate
    if service_count > trading_count:
        return "Services"
    else:
        return "Trading"


def onboard_business(description_text: str = None, url: str = None, tenant_id: str = None) -> dict:
    """
    Analyzes business details (text, brochure text, or website URL) and uses Gemini
    to automatically generate a vertical profile configuration and classification keywords.
    """
    combined_details = ""
    extracted_logo_url = ""
    if url:
        print(f"[Onboard Agent] Scraping website content from {url}...")
        url_text = fetch_url_text(url)
        if url_text:
            combined_details += f"Website Content from {url}:\n{url_text}\n\n"
        # Also extract logo from the website
        print(f"[Onboard Agent] Extracting logo from {url}...")
        extracted_logo_url = extract_logo_from_url(url)
            
    if description_text:
        combined_details += f"Business Description / Documentation:\n{description_text}"
        
    combined_details = combined_details.strip()
    if not combined_details:
        return {
            "error": "No business details or website URL provided."
        }
        
    # Classify business type from keyword densities in the input details
    detected_business_type = classify_business_type_from_text(combined_details)
        
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
        print("[Onboard Agent] Warning: GEMINI_API_KEY missing. Returning mock profile.")
        # Mock fallback for test/offline modes - override type dynamically
        return {
            "company_name": "Apex Dental Solutions" if detected_business_type == "Trading" else "Apex Compliance Services",
            "industry": "Dental Supplies & Equipment" if detected_business_type == "Trading" else "Statutory & Compliance Services",
            "business_type": detected_business_type,
            "tone": "Warm, reassuring, and highly professional",
            "guidelines": "1. Verify clinic details if dental anesthetic is ordered.\n2. Cross-reference surgical equipment with safety guides.\n3. Recommend sterile wipes as alternatives for basic cleaners." if detected_business_type == "Trading" else "1. Check client corporate filing status.\n2. Ensure ESIC/EPF returns are done before 15th.",
            "suggested_relevance_keywords": ["dental", "chair", "clinic", "syringe", "implant"] if detected_business_type == "Trading" else ["epf", "esic", "gst", "tds", "audit", "compliance"],
            "suggested_negotiation_keywords": ["bulk discount", "clinic pricing", "special offer", "reduce price"] if detected_business_type == "Trading" else ["fee discount", "annual contract", "monthly pricing"],
            "suggested_catalog": [
                {"sku_id": "DEN-SYN-01", "sku_name": "Dental Syringe 5ml", "category": "Syringes", "price": 45.0, "description": "High precision medical syringe", "stock": 100},
                {"sku_id": "DEN-CHR-02", "sku_name": "Orthodontic Patient Chair", "category": "Equipment", "price": 8500.0, "description": "Ergonomic motorized patient chair", "stock": 150}
            ] if detected_business_type == "Trading" else [
                {"sku_id": "SRV-EPF-01", "sku_name": "EPF Monthly Return Filing", "category": "EPF/ESIC", "price": 1500.0, "description": "Processing and upload of monthly EPF returns", "stock": 100},
                {"sku_id": "SRV-GST-02", "sku_name": "GSTR-3B Monthly Filing", "category": "GST", "price": 2500.0, "description": "Filing of GSTR-3B with reconciliation", "stock": 100}
            ],
            "suggested_crm": [
                {"name": "Dr. Sarah Jenkins", "email": "sarah.jenkins@dentalsmile.com", "phone": "+1-555-0192", "company": "Smile Dental Clinic"},
                {"name": "Dr. Robert Chen", "email": "rchen@apexortho.com", "phone": "+1-555-0143", "company": "Apex Orthodontics"}
            ]
        }


    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""You are an expert Business Analyst and AI Integrations Engineer.
Analyze the following company profile and website description, and synthesize the configuration parameters needed to adapt our AI Mail Responder to this specific business vertical.

Company details:
---
{combined_details}
---

Respond with ONLY a valid JSON object matching the following structure (do not include markdown ticks, fences, or explanation):
{{
  "company_name": "<Extract or determine company name>",
  "industry": "<Determine industry vertical name, e.g. Dental Supplies, Auto Spare Parts, Agro Chemicals>",
  "business_type": "<Classify as 'Trading' (if they sell tangible products, hardware, items out of physical stock) or 'Services' (if they provide tax filing, consultancy, security, bookkeeping, housekeeping, time-based contracts etc.)>",
  "tone": "<Describe the recommended email tone of voice, e.g. Professional & Formal, Helpful & Warm>",
  "guidelines": "<List 3-5 specific, bulleted business guidelines or matching rules for order parsing in this industry>",
  "suggested_relevance_keywords": [<List of 5-10 key product terms or categories indicating an enquiry is relevant to this business>],
  "suggested_negotiation_keywords": [<List of 3-5 terms indicating a pricing/discount negotiation request>],
  "suggested_catalog": [
    {{
      "sku_id": "<Generate a logical code, e.g. FM-AUD-01>",
      "sku_name": "<Name of product or service, e.g. Annual Compliance Audit>",
      "category": "<Category of item>",
      "price": <Logical float price, e.g. 1500.0>,
      "description": "<Short description of the product or service>",
      "stock": 100
    }}
  ],
  "suggested_crm": [
    {{
      "name": "<Mock customer name>",
      "email": "<Mock customer email>",
      "phone": "<Mock customer phone number>",
      "company": "<Mock customer company name>"
    }}
  ]
}}"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = re.sub(r'^```(?:json)?\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            
        data = json.loads(result_text)
        # Verify and assign business_type using keyword classification
        if "business_type" not in data or data["business_type"] not in ["Trading", "Services"]:
            data["business_type"] = detected_business_type
        # Attach auto-detected logo URL (from website scrape) to the result
        if extracted_logo_url:
            data["extracted_logo_url"] = extracted_logo_url
        print(f"[Onboard Agent] Successfully analyzed and onboarded vertical: {data.get('company_name')} ({data.get('business_type')})")
        return data
        
    except Exception as e:
        print(f"[Onboard Agent] Gemini onboarding generation failed: {e}")
        return {
            "error": f"Failed to analyze profile: {str(e)}"
        }
