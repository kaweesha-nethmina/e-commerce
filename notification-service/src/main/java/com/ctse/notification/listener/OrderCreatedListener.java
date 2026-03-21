package com.ctse.notification.listener;

import com.ctse.notification.client.UserServiceClient;
import com.ctse.notification.config.RabbitConfig;
import com.ctse.notification.dto.Notification;
import com.ctse.notification.dto.OrderCreatedEvent;
import com.ctse.notification.store.NotificationStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Consumes order.created events from RabbitMQ (published by Order Service).
 * Calls User Service to get user details for notification content.
 * Stores notifications in NotificationStore for frontend retrieval.
 */
@Component
public class OrderCreatedListener {

    private static final Logger log = LoggerFactory.getLogger(OrderCreatedListener.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserServiceClient userServiceClient;
    private final NotificationStore notificationStore;

    public OrderCreatedListener(UserServiceClient userServiceClient, NotificationStore notificationStore) {
        this.userServiceClient = userServiceClient;
        this.notificationStore = notificationStore;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_ORDER_CREATED_QUEUE)
    public void handleOrderCreated(String message) {
        try {
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);
            log.info("Received order.created: orderId={}, userId={}", event.getOrderId(), event.getUserId());

            // Integration: call User Service for user details
            var user = userServiceClient.getUser(event.getUserId());
            String userName = user != null ? user.getName() : "Customer";
            String email = user != null ? user.getEmail() : null;

            // Build notification
            int itemCount = event.getItems() != null ? event.getItems().size() : 0;
            String title = "New Order Created";
            String msg = String.format("Order %s placed by %s (%s) with %d item(s).",
                    event.getOrderId().substring(0, Math.min(8, event.getOrderId().length())),
                    userName, email != null ? email : "unknown", itemCount);

            Notification notification = new Notification(
                    UUID.randomUUID().toString(),
                    "order_created",
                    title,
                    msg,
                    event.getOrderId(),
                    event.getUserId(),
                    userName,
                    email,
                    event.getItems()
            );

            notificationStore.add(notification);

            log.info("Notification stored: Order {} created for {} (email: {}). Items: {}",
                    event.getOrderId(), userName, email, event.getItems());
        } catch (Exception e) {
            log.error("Failed to process order.created: {}", e.getMessage());
        }
    }
}
