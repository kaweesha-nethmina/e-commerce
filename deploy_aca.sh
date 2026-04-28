#!/bin/bash
# deploy_aca.sh
# ─────────────────────────────────────────────────────────────────────────────
# Deploys the full e-commerce microservices stack to Azure Container Apps.
#
# Internal DNS within the same Container Apps Environment:
#   http://<service-name>   →  ACA ingress routes to the container on --target-port
#
# Rules:
#   - All backend services use --ingress internal  (not reachable from browser)
#   - Only `client` uses --ingress external        (public-facing)
#   - Service-to-service calls use http://<name>   (short internal DNS, port 80)
#   - RabbitMQ is TCP so we use amqp://rabbitmq:5672 (direct TCP, bypasses HTTP ingress)
# ─────────────────────────────────────────────────────────────────────────────
set -e

RG="e-commerce-rg"
ENV="e-commerce-env"
REGISTRY="ghcr.io"
REGISTRY_USER="kaweesha-nethmina"

# ── RabbitMQ ─────────────────────────────────────────────────────────────────
echo "🐇 Deploying RabbitMQ..."
az containerapp create \
  --name rabbitmq \
  --resource-group $RG \
  --environment $ENV \
  --image rabbitmq:3-management \
  --target-port 5672 \
  --exposed-port 5672 \
  --ingress internal \
  --transport tcp \
  --min-replicas 1 \
  --max-replicas 1

# ── User Service (Node.js, port 3001) ─────────────────────────────────────────
echo "👤 Deploying User Service..."
az containerapp create \
  --name user-service \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/user-service:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3001 \
  --ingress internal \
  --min-replicas 1 \
  --env-vars \
    MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" \
    PORT="3001" \
    JWT_SECRET="your-jwt-secret" \
    RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
echo "✅ User Service deployed"

# ── Product Catalog Service (Python/FastAPI, port 3002) ───────────────────────
echo "📦 Deploying Product Catalog Service..."
az containerapp create \
  --name product-catalog-service \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/product-catalog-service:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3002 \
  --ingress internal \
  --min-replicas 1 \
  --env-vars \
    MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" \
    PORT="3002" \
    DB_NAME="ctse_products" \
    RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
echo "✅ Product Catalog Service deployed"

# ── Order Service (Go/Gin, port 3003) ─────────────────────────────────────────
# NOTE: USER_SERVICE_URL and PRODUCT_SERVICE_URL use short internal DNS + port 80
# (ACA HTTP ingress maps http://user-service → container port 3001 automatically)
echo "🛒 Deploying Order Service..."
az containerapp create \
  --name order-service \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/order-service:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3003 \
  --ingress internal \
  --min-replicas 1 \
  --env-vars \
    MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" \
    PORT="3003" \
    USER_SERVICE_URL="http://user-service" \
    PRODUCT_SERVICE_URL="http://product-catalog-service" \
    RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
echo "✅ Order Service deployed"

# ── Payment Service (Node.js, port 3005) ──────────────────────────────────────
echo "💳 Deploying Payment Service..."
az containerapp create \
  --name payment-service \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/payment-service:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3005 \
  --ingress internal \
  --min-replicas 1 \
  --env-vars \
    MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" \
    PORT="3005" \
    ORDER_SERVICE_URL="http://order-service" \
    RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
echo "✅ Payment Service deployed"

# ── Notification Service (Spring Boot, port 3004) ─────────────────────────────
# Spring Boot reads SERVER_PORT env var (application.properties: server.port=${SERVER_PORT:3004})
echo "🔔 Deploying Notification Service..."
az containerapp create \
  --name notification-service \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/notification-service:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3004 \
  --ingress internal \
  --min-replicas 1 \
  --env-vars \
    MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/ctse_notifications?retryWrites=true&w=majority" \
    SERVER_PORT="3004" \
    USER_SERVICE_URL="http://user-service" \
    SPRING_RABBITMQ_HOST="rabbitmq" \
    SPRING_RABBITMQ_PORT="5672" \
    SPRING_RABBITMQ_USERNAME="guest" \
    SPRING_RABBITMQ_PASSWORD="guest"
echo "✅ Notification Service deployed"

# ── API Gateway (Nginx, port 80) ───────────────────────────────────────────────
echo "🚪 Deploying API Gateway..."
az containerapp create \
  --name api-gateway \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/api-gateway:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 80 \
  --ingress internal \
  --min-replicas 1
echo "✅ API Gateway deployed"

# ── Client (Next.js, port 3000) ───────────────────────────────────────────────
# ONLY external-facing service.
# Next.js `next.config.ts` rewrites run SERVER-SIDE inside the ACA environment,
# so they can reach internal services via http://<name> (short internal DNS).
echo "🌐 Deploying Client..."
CLIENT_FQDN=$(az containerapp create \
  --name client \
  --resource-group $RG \
  --environment $ENV \
  --image $REGISTRY/$REGISTRY_USER/e-commerce/client:latest \
  --registry-server $REGISTRY \
  --registry-username $REGISTRY_USER \
  --registry-password $GITHUB_PAT \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --env-vars \
    API_GATEWAY_URL="http://api-gateway" \
  --query properties.configuration.ingress.fqdn -o tsv)

echo ""
echo "✅ All deployments completed!"
echo "🌍 Your web app is live at: https://$CLIENT_FQDN"
