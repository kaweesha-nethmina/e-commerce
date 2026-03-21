#!/bin/bash
set -e

echo "Deploying RabbitMQ..."
az containerapp create \
  --name rabbitmq \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image rabbitmq:3-management \
  --target-port 5672 \
  --exposed-port 5672 \
  --ingress internal \
  --transport tcp

echo "Deploying User Service..."
USER_FQDN=$(az containerapp create \
  --name user-service \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/user-service:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3001 \
  --ingress internal \
  --env-vars MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" PORT="3001" JWT_SECRET="your-jwt-secret" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "User Service deployed at $USER_FQDN"

echo "Deploying Product Catalog Service..."
PRODUCT_FQDN=$(az containerapp create \
  --name product-catalog-service \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/product-catalog-service:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3002 \
  --ingress internal \
  --env-vars MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" PORT="3002" DB_NAME="ctse_products" RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Product Catalog deployed at $PRODUCT_FQDN"

echo "Deploying Order Service..."
ORDER_FQDN=$(az containerapp create \
  --name order-service \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/order-service:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3003 \
  --ingress internal \
  --env-vars MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" PORT="3003" USER_SERVICE_URL="http://$USER_FQDN" PRODUCT_SERVICE_URL="http://$PRODUCT_FQDN" RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Order Service deployed at $ORDER_FQDN"

echo "Deploying Payment Service..."
PAYMENT_FQDN=$(az containerapp create \
  --name payment-service \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/payment-service:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3005 \
  --ingress internal \
  --env-vars MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" PORT="3005" RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Payment Service deployed at $PAYMENT_FQDN"

echo "Deploying Notification Service..."
NOTIFICATION_FQDN=$(az containerapp create \
  --name notification-service \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/notification-service:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3004 \
  --ingress internal \
  --env-vars MONGO_URI="mongodb+srv://kaweesha:17420@myatlasclusteredu.dubkafb.mongodb.net/" PORT="3004" SPRING_RABBITMQ_HOST="rabbitmq" SPRING_RABBITMQ_PORT="5672" SPRING_RABBITMQ_USERNAME="guest" SPRING_RABBITMQ_PASSWORD="guest" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "Notification Service deployed at $NOTIFICATION_FQDN"

echo "Deploying Client..."
CLIENT_FQDN=$(az containerapp create \
  --name client \
  --resource-group e-commerce-rg \
  --environment e-commerce-env \
  --image ghcr.io/kaweesha-nethmina/e-commerce/client:latest \
  --registry-server ghcr.io \
  --registry-username kaweesha-nethmina \
  --registry-password $GITHUB_PAT \
  --target-port 3000 \
  --ingress external \
  --env-vars USER_SERVICE_URL="http://$USER_FQDN" PRODUCT_SERVICE_URL="http://$PRODUCT_FQDN" ORDER_SERVICE_URL="http://$ORDER_FQDN" PAYMENT_SERVICE_URL="http://$PAYMENT_FQDN" NOTIFICATION_SERVICE_URL="http://$NOTIFICATION_FQDN" \
  --query properties.configuration.ingress.fqdn -o tsv)

echo "✅ All deployments completed! Your web app is live at:"
echo "https://$CLIENT_FQDN"
