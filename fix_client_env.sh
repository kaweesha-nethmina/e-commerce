#!/bin/bash
# fix_client_env.sh
# ─────────────────────────────────────────────────────────────────────────────
# Fixes the client Container App's environment variables so it uses short
# internal DNS names (http://<service-name>) instead of full .internal. FQDNs.
#
# Within a Container Apps Environment, every service is reachable from any
# other service using just: http://<container-app-name>
# The Next.js server-side rewrites run inside the environment, so this works.
# ─────────────────────────────────────────────────────────────────────────────
set -e

RG="e-commerce-rg"
ENV="e-commerce-env"
APP="client"

echo "🔧 Updating $APP environment variables to use internal short DNS names..."

az containerapp update \
  --name $APP \
  --resource-group $RG \
  --set-env-vars \
    USER_SERVICE_URL="http://user-service" \
    PRODUCT_SERVICE_URL="http://product-catalog-service" \
    ORDER_SERVICE_URL="http://order-service" \
    PAYMENT_SERVICE_URL="http://payment-service" \
    NOTIFICATION_SERVICE_URL="http://notification-service"

echo "✅ Environment variables updated!"
echo ""
echo "The client container will restart automatically."
echo "Next.js rewrites will now correctly route API calls to internal services."
