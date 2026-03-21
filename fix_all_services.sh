#!/bin/bash
# fix_all_services.sh
# ─────────────────────────────────────────────────────────────────────────────
# Quick-fix script for already-deployed services.
# Corrects environment variables so all services use short internal DNS names.
# Also ensures --min-replicas 1 so containers don't scale to zero.
#
# Run this if your services are already deployed and you don't want to
# redeploy everything from scratch.
# ─────────────────────────────────────────────────────────────────────────────
set -e

RG="e-commerce-rg"

echo "═══════════════════════════════════════════════════════════"
echo " Fixing all Azure Container App environment variables"
echo "═══════════════════════════════════════════════════════════"

# ── Order Service ─────────────────────────────────────────────────────────────
echo ""
echo "🛒 Fixing order-service..."
az containerapp update \
  --name order-service \
  --resource-group $RG \
  --min-replicas 1 \
  --set-env-vars \
    USER_SERVICE_URL="http://user-service" \
    PRODUCT_SERVICE_URL="http://product-catalog-service" \
    RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
echo "✅ order-service updated"

# ── Notification Service ───────────────────────────────────────────────────────
echo ""
echo "🔔 Fixing notification-service..."
az containerapp update \
  --name notification-service \
  --resource-group $RG \
  --min-replicas 1 \
  --set-env-vars \
    SERVER_PORT="3004" \
    USER_SERVICE_URL="http://user-service" \
    SPRING_RABBITMQ_HOST="rabbitmq" \
    SPRING_RABBITMQ_PORT="5672" \
    SPRING_RABBITMQ_USERNAME="guest" \
    SPRING_RABBITMQ_PASSWORD="guest"
echo "✅ notification-service updated"

# ── User Service ───────────────────────────────────────────────────────────────
echo ""
echo "👤 Fixing user-service (ensure min-replicas=1)..."
az containerapp update \
  --name user-service \
  --resource-group $RG \
  --min-replicas 1
echo "✅ user-service updated"

# ── Product Catalog Service ────────────────────────────────────────────────────
echo ""
echo "📦 Fixing product-catalog-service (ensure min-replicas=1)..."
az containerapp update \
  --name product-catalog-service \
  --resource-group $RG \
  --min-replicas 1
echo "✅ product-catalog-service updated"

# ── Payment Service ────────────────────────────────────────────────────────────
echo ""
echo "💳 Fixing payment-service (ensure min-replicas=1)..."
az containerapp update \
  --name payment-service \
  --resource-group $RG \
  --min-replicas 1
echo "✅ payment-service updated"

# ── Client ─────────────────────────────────────────────────────────────────────
echo ""
echo "🌐 Fixing client env vars..."
az containerapp update \
  --name client \
  --resource-group $RG \
  --min-replicas 1 \
  --set-env-vars \
    USER_SERVICE_URL="http://user-service" \
    PRODUCT_SERVICE_URL="http://product-catalog-service" \
    ORDER_SERVICE_URL="http://order-service" \
    PAYMENT_SERVICE_URL="http://payment-service" \
    NOTIFICATION_SERVICE_URL="http://notification-service"
echo "✅ client updated"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " ✅ All services fixed!"
echo ""
echo " All containers will restart automatically."
echo " Wait ~60 seconds then check your client URL."
echo "═══════════════════════════════════════════════════════════"
