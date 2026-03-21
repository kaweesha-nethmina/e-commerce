# User Service (Node.js / TypeScript)

Authentication and user profile microservice. Used by **Order Service** (validate JWT) and **Notification Service** (get user details).

## Endpoints

- `POST /auth/register` — Register user (email, password, name)
- `POST /auth/login` — Login, returns JWT
- `POST /auth/validate` — Validate JWT (for other services)
- `GET /users/:id` — Get user by ID (for Notification Service)
- `GET /health` — Health check

## API Contract

See [openapi.yaml](./openapi.yaml). View with Swagger Editor or Redoc.

## Run locally

```bash
npm install
npm run dev
```

Port: 3001 (or `PORT` env).

## Docker

```bash
docker build -t user-service .
docker run -p 3001:3001 -e JWT_SECRET=your-secret user-service
```

## Environment

- `PORT` — Server port (default 3001)
- `JWT_SECRET` — Secret for signing JWTs (required in production)

## Integration

- **Order Service** calls `POST /auth/validate` with `Authorization: Bearer <token>` before creating orders.
- **Notification Service** calls `GET /users/:id` to get name/email for notification content.
