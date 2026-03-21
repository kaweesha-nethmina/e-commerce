# Product Catalog Service (Python / FastAPI)

Products, categories, and stock. Used by **Order Service** to get product details and validate stock.

## Endpoints

- `GET /health` — Health check
- `GET /products` — List all products
- `GET /products/{id}` — Get product by ID
- `POST /products/check-stock` — Check stock for a list of items (Order Service)

## API Contract

See [openapi.yaml](./openapi.yaml). Swagger UI at `/docs` when running.

## Run locally

```bash
pip install -r requirements.txt
python main.py
```

Port: 3002 (or `PORT` env).

## Docker

```bash
docker build -t product-catalog-service .
docker run -p 3002:3002 product-catalog-service
```

## Integration

- **Order Service** calls `GET /products/{id}` and `POST /products/check-stock` before creating an order.
