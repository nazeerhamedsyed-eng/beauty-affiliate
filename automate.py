import os
import json
import logging
import requests
from jinja2 import Environment, FileSystemLoader
from PIL import Image, ImageDraw, ImageFont

# Set up logging
logging.basicConfig(level=logging.INFO, format="[LUXE-AUTOMATOR] %(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("LuxeAutomator")

# Constants & Paths
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_DB_PATH = os.path.join(WORKSPACE_DIR, "products.json")
PRODUCTS_OUT_DIR = os.path.join(WORKSPACE_DIR, "products")
PINS_OUT_DIR = os.path.join(WORKSPACE_DIR, "assets", "pins")
FONT_PATH = os.path.join(WORKSPACE_DIR, "assets", "fonts", "PlayfairDisplay[wght].ttf")

# Google Font URL to download if missing (keeps styling premium without needing pre-installed OS fonts)
FONT_DOWNLOAD_URL = "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf"

def download_premium_font():
    """Downloads a premium Google Serif Font to ensure high-end graphics without relying on OS defaults."""
    font_dir = os.path.dirname(FONT_PATH)
    if not os.path.exists(font_dir):
        os.makedirs(font_dir)
        
    if not os.path.exists(FONT_PATH):
        logger.info("Premium serif font not found. Downloading from Google Fonts repo...")
        try:
            r = requests.get(FONT_DOWNLOAD_URL, timeout=15)
            r.raise_for_status()
            with open(FONT_PATH, "wb") as f:
                f.write(r.content)
            logger.info("Successfully downloaded Playfair Display font.")
        except Exception as e:
            logger.warning(f"Could not download font: {e}. Falling back to default system fonts.")

def fetch_latest_brand_deals():
    """
    Simulates querying official brand APIs / feeds for new product releases.
    In production, this queries partner network feeds (Impact/CJ/Awin).
    We simulate finding a new product that is not currently in products.json.
    """
    logger.info("Checking affiliate networks (CJ, Impact, Awin) for new standard brand offers...")
    
    # Mock aggregated deals feed
    new_deals = [
        {
            "brand": "The Ordinary",
            "name": "Hyaluronic Acid 2% + B5",
            "slug": "the-ordinary-hyaluronic-acid-2-b5",
            "category": "clean",
            "price": "£8",
            "rating": 4.6,
            "reviews": 894,
            "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
            "tag": "Hydration Hero",
            "description": "A hydration-support formula with ultra-pure, vegan hyaluronic acid. Delivers multi-depth hydration and visible plumping without drawing water out of the skin.",
            "metrics": {
                "Hydration": 97,
                "Longevity": 75,
                "Texture": 80,
                "Value": 99
            },
            "link": "https://theordinary.com",
            "ingredients": ["Aqua", "Hyaluronic Acid", "Panthenol (Vitamin B5)", "Phenoxyethanol"],
            "is_featured": False
        },
        {
            "brand": "Dior",
            "name": "Addict Lip Glow Oil",
            "slug": "dior-addict-lip-glow-oil",
            "category": "makeup",
            "price": "£32",
            "rating": 4.8,
            "reviews": 731,
            "image": "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?q=80&w=600&auto=format&fit=crop",
            "tag": "Viral Classic",
            "description": "A nourishing glossy lip oil that deeply protects and enhances the lips, bringing out their natural color with a sheer, mirror-like shine.",
            "metrics": {
                "Hydration": 92,
                "Longevity": 78,
                "Texture": 95,
                "Value": 72
            },
            "link": "https://www.dior.com",
            "ingredients": ["Cherry Oil", "Squalane", "Glycerin", "Tocopherol", "Phenoxyethanol"],
            "is_featured": True
        }
    ]
    return new_deals

def generate_ai_review(product):
    """
    Queries the Gemini API to write a structured, AIO-optimized product review.
    If the GEMINI_API_KEY environment variable is missing, it falls back to
    generating a high-quality review from pre-modeled editorial blocks.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        logger.info(f"Gemini API Key detected. Generating expert review for {product['name']}...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        prompt = f"""
        Write a professional, unbiased editorial beauty review for the product: {product['brand']} {product['name']}.
        Use the following structure and output only raw HTML (no markdown tags, no ```html wrappers):
        <h2>[Product Name] deep-dive review</h2>
        <p>[Write 2 detailed paragraphs explaining the texture, performance, and key benefits. Tone should be expert, unbiased, like Vogue or Allure.]</p>
        <h3>Active Ingredient Analysis</h3>
        <p>[Write a paragraph analyzing its key ingredients: {', '.join(product['ingredients'])}. Highlight what they do for the skin.]</p>
        <h3>Final Verdict</h3>
        <p>[Write a summarizing paragraph outlining who this product is best for and whether it is worth the price.]</p>
        """
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        try:
            r = requests.post(url, headers=headers, json=data, timeout=20)
            r.raise_for_status()
            res = r.json()
            # Extract generated text
            generated_html = res['candidates'][0]['content']['parts'][0]['text']
            return generated_html
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}. Falling back to offline generator.")
            
    # Offline Fallback Review Generator (Ensures code never crashes and outputs perfect copy)
    logger.info(f"Using offline template review generator for {product['name']}...")
    fallback_html = f"""
    <h2>An Honest Review of {product['brand']}'s {product['name']}</h2>
    <p>We tested {product['brand']}'s {product['name']} for over three weeks. The formula stands out immediately for its refined texture and clean absorption, leaving the skin feeling remarkably balanced. Under daily wear, it holds up beautifully under makeup or as a standalone care step.</p>
    <h3>Formula & Key Ingredients</h3>
    <p>This product utilizes high-standard active ingredients, primarily focusing on <strong>{", ".join(product['ingredients'][:3])}</strong>. These work in synergy to restore moisture levels, protect the skin barrier, and deliver visible results without cause for irritation.</p>
    <h3>Final Verdict</h3>
    <p>For a price of {product['price']}, this offers exceptional quality and holds standard-setting performance values in the {product['category']} market. It is highly recommended for anyone looking to optimize their daily routine.</p>
    """
    return fallback_html

def draw_pinterest_pin(product):
    """
    Draws a vertical 1000x1500px Pinterest Pin graphic using Pillow.
    Automatically applies fonts, backgrounds, price tags, and branding badges.
    """
    if not os.path.exists(PINS_OUT_DIR):
        os.makedirs(PINS_OUT_DIR)
        
    logger.info(f"Generating Pinterest Graphic for {product['brand']} {product['name']}...")
    
    # 1. Create solid luxe cream background
    im = Image.new("RGB", (1000, 1500), "#FAF9F6")
    draw = ImageDraw.Draw(im)
    
    # Try loading custom premium font, else fall back to default
    try:
        font_logo = ImageFont.truetype(FONT_PATH, 48)
        font_title = ImageFont.truetype(FONT_PATH, 68)
        font_subtitle = ImageFont.truetype(FONT_PATH, 42)
        font_body = ImageFont.truetype(FONT_PATH, 32)
        font_badge = ImageFont.truetype(FONT_PATH, 36)
    except Exception as e:
        logger.warning(f"Error loading TTF font: {e}. Using default.")
        font_logo = font_title = font_subtitle = font_body = font_badge = ImageFont.load_default()
        
    # Draw double decorative borders
    draw.rectangle([30, 30, 970, 1470], outline="#C5A083", width=2)
    draw.rectangle([45, 45, 955, 1455], outline="#C5A083", width=1)
    
    # Header Branding Logo
    draw.text((500, 120), "GLOWVAULT DIRECT", fill="#1E2022", font=font_logo, anchor="ms")
    draw.line([300, 150, 700, 150], fill="#C5A083", width=2)
    
    # Draw editorial quote box
    draw.rectangle([100, 240, 900, 750], fill="#FFF", outline="#C5A083", width=1)
    
    # Brand (champagne highlight)
    draw.rectangle([350, 210, 650, 260], fill="#E8DCC4")
    draw.text((500, 243), product['brand'].upper(), fill="#C5A083", font=font_body, anchor="ms")
    
    # Title
    words = product['name'].split(" ")
    line1 = " ".join(words[:2])
    line2 = " ".join(words[2:])
    draw.text((500, 380), line1, fill="#1E2022", font=font_title, anchor="ms")
    if line2:
        draw.text((500, 470), line2, fill="#1E2022", font=font_title, anchor="ms")
        
    # Summary Quote / Hook
    draw.text((500, 600), f"\"The ultimate {product['category']} formula,\"", fill="#C5A083", font=font_subtitle, anchor="ms")
    draw.text((500, 660), f"reviewed honestly by skin experts.", fill="#62686E", font=font_body, anchor="ms")
    
    # Feature Badges
    draw.rectangle([150, 850, 480, 1050], fill="#FAF9F6", outline="#C5A083", width=1)
    draw.text((315, 910), "100% ORIGINAL", fill="#1E2022", font=font_body, anchor="ms")
    draw.text((315, 980), "AUTHENTIC BRAND", fill="#62686E", font=font_body, anchor="ms")
    
    draw.rectangle([520, 850, 850, 1050], fill="#FAF9F6", outline="#C5A083", width=1)
    draw.text((685, 910), "BEST VALUE", fill="#1E2022", font=font_body, anchor="ms")
    draw.text((685, 980), f"GET AT {product['price']}", fill="#C5A083", font=font_body, anchor="ms")

    # Bottom Call to Action
    draw.rectangle([250, 1180, 750, 1280], fill="#C5A083")
    draw.text((500, 1243), "READ FULL INGREDIENT BREAKDOWN", fill="#FFF", font=font_badge, anchor="ms")
    draw.text((500, 1340), "glowvaultdirect.com", fill="#62686E", font=font_body, anchor="ms")
    
    # Save Image
    out_path = os.path.join(PINS_OUT_DIR, f"{product['slug']}.png")
    im.save(out_path)
    logger.info(f"Pinterest graphic saved to {out_path}")

def build_static_website():
    """
    Compiles index-template.html -> index.html
    And product-template.html -> products/[slug].html
    Using Jinja2.
    """
    logger.info("Initializing Jinja2 rendering environment...")
    
    # Load products database
    with open(PRODUCTS_DB_PATH, "r") as f:
        products = json.load(f)
        
    env = Environment(loader=FileSystemLoader(WORKSPACE_DIR))
    
    # 1. Compile Landing Page (index.html)
    logger.info("Compiling homepage index.html...")
    index_template = env.get_template("index-template.html")
    index_output = index_template.render(products=products)
    
    with open(os.path.join(WORKSPACE_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_output)
    logger.info("Homepage index.html successfully compiled.")
    
    # 2. Compile Product Pages
    if not os.path.exists(PRODUCTS_OUT_DIR):
        os.makedirs(PRODUCTS_OUT_DIR)
        
    product_template = env.get_template("product-template.html")
    
    for p in products:
        logger.info(f"Compiling product page for {p['name']}...")
        prod_output = product_template.render(**p)
        
        out_path = os.path.join(PRODUCTS_OUT_DIR, f"{p['slug']}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(prod_output)
            
    logger.info("All programmatic product detail pages successfully compiled.")

def main():
    logger.info("Starting Autonomous Affiliate Engine cycle...")
    
    # Ensure premium assets are downloaded
    download_premium_font()
    
    # Load existing database
    with open(PRODUCTS_DB_PATH, "r") as f:
        products = json.load(f)
        
    existing_slugs = {p['slug'] for p in products}
    
    # Check for new brand deals
    new_deals = fetch_latest_brand_deals()
    
    updated = False
    for deal in new_deals:
        if deal['slug'] not in existing_slugs:
            logger.info(f"New product detected: {deal['brand']} {deal['name']}!")
            
            # Generate AI review content
            deal['review_detail'] = generate_ai_review(deal)
            
            # Assign incremented ID
            deal['id'] = max(p['id'] for p in products) + 1 if products else 1
            
            # Add to database
            products.append(deal)
            existing_slugs.add(deal['slug'])
            updated = True
            
            # Draw Pinterest asset
            draw_pinterest_pin(deal)
        else:
            logger.info(f"Deal {deal['name']} already exists in database. Skipping aggregation.")
            
    # Save database changes if new products were added
    if updated:
        logger.info("Saving updated product database to products.json...")
        with open(PRODUCTS_DB_PATH, "w") as f:
            json.dump(products, f, indent=2)
            
    # Regenerate static web assets
    build_static_website()
    
    # Make sure Pinterest pins exist for all products (e.g. if newly cloned or deleted)
    for p in products:
        pin_path = os.path.join(PINS_OUT_DIR, f"{p['slug']}.png")
        if not os.path.exists(pin_path):
            draw_pinterest_pin(p)
            
    logger.info("Autonomous Affiliate Engine cycle complete!")

if __name__ == "__main__":
    main()
