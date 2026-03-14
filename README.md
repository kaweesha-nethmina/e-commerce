# E-Commerce Order & Notification Platform — Microservices Assignment

**Module:** Current Trends in Software Engineering (SE4010) | 2026 Semester 1  
**Cloud Computing Assignment** — Secure, microservice-based application with DevOps & DevSecOps practices.

## Application Overview

A cohesive **order and notification platform** built from **four microservices**, each implemented in a **different language**. Services communicate via **HTTP APIs** and **RabbitMQ** for event-driven workflows.

| Microservice        | Language        | Framework     | Responsibility                    | Integration Points                    |
|---------------------|-----------------|---------------|-----------------------------------|--------------------------------------|
| **User Service**    | TypeScript      | Node.js/Express | Auth, JWT, user registration, profile | Order Service, Notification Service   |
| **Product Catalog** | Python          | FastAPI       | Products, categories, inventory   | Order Service                        |
| **Order Service**   | Go              | Gin           | Create/list orders, order status  | User Service, Product Catalog, RabbitMQ |
| **Notification**    | Java            | Spring Boot   | Consume events, send notifications| RabbitMQ, User Service               |

## Architecture (High-Level)

```
                    ┌─────────────────┐
                    │   API Gateway   │  (optional; can use direct LB)
                    │  / Load Balancer│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  User Service  │  │ Product Catalog│  │  Order Service │
│  (Node.js)     │  │  (Python)      │  │  (Go)          │
│  :3001         │  │  :3002         │  │  :3003         │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        │    validate user  │  get products     │
        │◄──────────────────┼───────────────────┤
        │                   │                   │
        │                   │                   │ publish OrderCreated
        │                   │                   │ OrderStatusChanged
        │                   │                   ▼
        │                   │            ┌──────────────┐
        │                   │            │  RabbitMQ    │
        │                   │            │  (message    │
        │                   │            │   broker)    │
        │                   │            └──────┬───────┘
        │                   │                   │ consume
        │  get user details │                   ▼
        │◄──────────────────┼─────────── ┌────────────────┐
        │                   │            │  Notification  │
        │                   │            │  Service (Java)│
        │                   │            │  :3004         │
        └───────────────────┴────────────└────────────────┘
```

- **User Service**: Exposes `/auth/validate`, `/users/:id`. Used by Order Service (validate JWT/user) and Notification Service (get user details).
- **Product Catalog**: Exposes `/products/:id`, `/products/check-stock`. Used by Order Service to validate products and get details.
- **Order Service**: Calls User + Product over HTTP; publishes `OrderCreated`, `OrderStatusChanged` to RabbitMQ.
- **Notification Service**: Consumes from RabbitMQ queues; calls User Service to resolve user info for notifications.

## Repository Structure

```
Assignment/
├── README.md                    # This file
├── ARCHITECTURE.md              # Shared architecture diagram & rationale
├── docker-compose.yml           # Local run: all 4 services + RabbitMQ
├── sonar-project.properties    # SonarCloud SAST (DevSecOps)
├── docs/
│   ├── DEPLOYMENT.md            # Container registry + cloud deployment (ECS, Azure, etc.)
│   └── SECURITY.md              # IAM, security groups, SAST, least privilege
├── deploy/aws-ecs/             # Example ECS Fargate task definition
├── user-service/                # Node.js/TypeScript
├── product-catalog-service/     # Python/FastAPI
├── order-service/               # Go/Gin
└── notification-service/        # Java/Spring Boot
```

## Quick Start (Local with Docker Compose)

1. **Prerequisites:** Docker, Docker Compose.
2. From repo root:
   ```bash
   docker-compose up -d
   ```
3. Services:
   - User: http://localhost:3001
   - Product Catalog: http://localhost:3002
   - Order: http://localhost:3003
   - Notification: http://localhost:3004
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

Each service has its own README with API docs (OpenAPI/Swagger), Dockerfile, and CI/CD notes.

## Setup: CI/CD, Registry, SAST, Deployment

1. **Public repository**  
   Push this repo to GitHub (or another host) and make it **public**.

2. **Container registry (Docker Hub)**  
   In GitHub → Settings → Secrets and variables → Actions, add:
   - `DOCKERHUB_USERNAME` — your Docker Hub username  
   - `DOCKERHUB_TOKEN` — Docker Hub Access Token (Account → Security → New Access Token)  
   On push to `main`/`master`, the workflow builds and pushes all four images to Docker Hub.

3. **SAST / DevSecOps (SonarCloud, free)**  
   - Sign in at [sonarcloud.io](https://sonarcloud.io) with GitHub and add this repo.  
   - Create a project and copy the **project key** and **organization**.  
   - In the repo, set `sonar.organization` and `sonar.projectKey` in `sonar-project.properties`.  
   - In GitHub Actions secrets, add `SONAR_TOKEN` (from SonarCloud).  
   The **SAST (SonarCloud)** job will run on PRs and pushes to main.

4. **Deploy to cloud**  
   Use images from the registry and deploy with **managed orchestration** (ECS, Azure Container Apps, Cloud Run, or managed Kubernetes). See ** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** and ** [docs/SECURITY.md](docs/SECURITY.md)** for registry, deployment options, IAM, and security groups.

## DevOps & Security (Per Service)

- **Version control:** Public Git repository.
- **CI/CD:** GitHub Actions (or similar) for build, test, container push, deploy.
- **Containers:** Dockerfile per service; images in a container registry.
- **Deployment:** Managed container orchestration (e.g. ECS, Azure Container Apps, EKS/AKS).
- **Security:** IAM roles for tasks/pods (no hardcoded credentials), security groups/NSGs, least privilege, secrets via env or secret manager. Integrate **SAST** (SonarCloud or Snyk free tier) in the CI pipeline for DevSecOps.

## Inter-Service Communication (Demonstration)

- **Order → User:** Validate token / user before creating order.
- **Order → Product Catalog:** Get product details and check stock.
- **Order → RabbitMQ:** Publish `OrderCreated` / `OrderStatusChanged`.
- **Notification ← RabbitMQ:** Consume events.
- **Notification → User:** Get user details for notification content.

Each student can demonstrate **at least one** integration (e.g. Order calling User + Product, or Notification consuming from RabbitMQ and calling User).

## License

For academic use — SLIIT CTSE Assignment 2026.
