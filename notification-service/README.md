# Notification Service (Java / Spring Boot)

Consumes **order.created** events from **RabbitMQ** (published by Order Service). **Integration:** calls **User Service** `GET /users/:id` to get user name/email for notification content.

## Endpoints

- `GET /health` — Health check

## Run locally

```bash
./mvnw spring-boot:run
```

Or with Maven: `mvn spring-boot:run`. Port: 3004 (or `SERVER_PORT`).

## Environment

- `SERVER_PORT` — HTTP port (default 3004)
- `USER_SERVICE_URL` — User Service base URL (for integration)
- `SPRING_RABBITMQ_HOST`, `SPRING_RABBITMQ_PORT`, `SPRING_RABBITMQ_USERNAME`, `SPRING_RABBITMQ_PASSWORD` — RabbitMQ connection

## Docker

```bash
docker build -t notification-service .
docker run -p 3004:3004 \
  -e USER_SERVICE_URL=http://host.docker.internal:3001 \
  -e SPRING_RABBITMQ_HOST=host.docker.internal \
  -e SPRING_RABBITMQ_PORT=5672 \
  notification-service
```

## Integration

- **RabbitMQ:** Listens to queue `order.created`. When Order Service publishes an order, this service receives it.
- **User Service:** For each order event, calls `GET /users/{userId}` to get user name/email and logs a “notification” (in production you would send email/push).

## API Contract

See [openapi.yaml](./openapi.yaml). Service is mainly event-driven; REST is health only.
