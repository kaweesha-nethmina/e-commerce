#!/bin/bash
set -e
RABBITMQ_FQDN=$(az containerapp show -n rabbitmq -g e-commerce-rg --query 'properties.configuration.ingress.fqdn' -o tsv)
RABBITMQ_URL="amqp://guest:guest@$RABBITMQ_FQDN:5672"
echo "RabbitMQ URL: $RABBITMQ_URL"

az containerapp update -n user-service -g e-commerce-rg --set-env-vars RABBITMQ_URL="$RABBITMQ_URL" FORCE_RESTART=$(date +%s)
az containerapp update -n product-catalog-service -g e-commerce-rg --set-env-vars RABBITMQ_URL="$RABBITMQ_URL" FORCE_RESTART=$(date +%s)
az containerapp update -n order-service -g e-commerce-rg --set-env-vars RABBITMQ_URL="$RABBITMQ_URL" FORCE_RESTART=$(date +%s)
az containerapp update -n payment-service -g e-commerce-rg --set-env-vars RABBITMQ_URL="$RABBITMQ_URL" FORCE_RESTART=$(date +%s)

# Spring Boot connects via individual pieces:
az containerapp update -n notification-service -g e-commerce-rg --set-env-vars \
  SPRING_RABBITMQ_HOST="$RABBITMQ_FQDN" \
  SPRING_RABBITMQ_PORT="5672" \
  FORCE_RESTART=$(date +%s)

echo "Done"
