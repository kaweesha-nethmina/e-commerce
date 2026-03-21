import os

class Settings:
    MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = "ctse_products"
    PORT: int = int(os.environ.get("PORT", 3002))
    RABBITMQ_URL: str = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

settings = Settings()
