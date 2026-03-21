# Order Service (Go / Gin)

Creates and lists orders. **Integration points:**

1. **User Service** — `POST /auth/validate` with `Authorization: Bearer <token>` to validate user before creating order.
2. **Product Catalog Service** — `POST /products/check-stock` to validate product IDs and stock.
3. **RabbitMQ** — Publishes `order.created` events for Notification Service.

## Endpoints

- `GET /health` — Health check
- `POST /orders` — Create order (requires `Authorization: Bearer <jwt>`)
- `GET /orders` — List orders
- `GET /orders/:id` — Get order by ID

## Environment

- `PORT` — Server port (default 3003)
- `USER_SERVICE_URL` — User Service base URL
- `PRODUCT_SERVICE_URL` — Product Catalog base URL
- `RABBITMQ_URL` — AMQP URL (e.g. `amqp://guest:guest@localhost:5672/`)

## Run locally

```bash
go mod tidy
go run .
```

Ensure User Service, Product Catalog, and RabbitMQ are running.

## Docker

```bash
docker build -t order-service .
docker run -p 3003:3003 \
  -e USER_SERVICE_URL=http://host.docker.internal:3001 \
  -e PRODUCT_SERVICE_URL=http://host.docker.internal:3002 \
  -e RABBITMQ_URL=amqp://guest:guest@host.docker.internal:5672/ \
  order-service
```

## API Contract

See [openapi.yaml](./openapi.yaml).
