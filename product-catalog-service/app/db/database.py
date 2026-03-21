from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]
products_col = db["products"]
reviews_col = db["reviews"]

def seed_products():
    if products_col.count_documents({}) == 0:
        default_products = [
            {
                "id": "p1", "name": "Widget A", "category": "widgets",
                "description": "Premium quality widget with advanced features",
                "price": 10.99, "stock": 100, "image_url": ""
            },
            {
                "id": "p2", "name": "Widget B", "category": "widgets",
                "description": "Compact widget for everyday use",
                "price": 24.50, "stock": 50, "image_url": ""
            },
            {
                "id": "p3", "name": "Gadget X", "category": "gadgets",
                "description": "High-tech gadget with smart connectivity",
                "price": 99.00, "stock": 20, "image_url": ""
            },
            {
                "id": "p4", "name": "Smart Speaker Pro", "category": "electronics",
                "description": "Voice-controlled smart speaker with premium sound",
                "price": 149.99, "stock": 35, "image_url": ""
            },
            {
                "id": "p5", "name": "Wireless Earbuds", "category": "accessories",
                "description": "Noise-cancelling wireless earbuds with 24h battery",
                "price": 79.99, "stock": 60, "image_url": ""
            },
            {
                "id": "p6", "name": "USB-C Hub Pro", "category": "accessories",
                "description": "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader",
                "price": 45.00, "stock": 80, "image_url": ""
            },
            {
                "id": "p7", "name": "Mechanical Keyboard", "category": "electronics",
                "description": "RGB mechanical keyboard with hot-swappable switches",
                "price": 129.00, "stock": 25, "image_url": ""
            },
            {
                "id": "p8", "name": "Portable Charger", "category": "gadgets",
                "description": "20000mAh fast-charging portable power bank",
                "price": 39.99, "stock": 90, "image_url": ""
            },
        ]
        products_col.insert_many(default_products)
        print(f"Seeded {len(default_products)} products into MongoDB")
