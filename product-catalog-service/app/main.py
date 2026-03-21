from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.api.routes import router
from app.db.database import seed_products, settings
from app.rabbitmq.consumer import run_consumer_thread

# Initialize DB
seed_products()
print(f"Connected to MongoDB → {settings.DB_NAME}")

# Start RabbitMQ Consumer in background thread
run_consumer_thread()

app = FastAPI(title="Product Catalog Service", version="1.0.0")
app.include_router(router)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Product catalog and stock for Order Service",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
