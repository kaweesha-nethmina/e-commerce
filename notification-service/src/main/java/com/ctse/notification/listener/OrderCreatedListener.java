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

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Consumes order.created events from RabbitMQ (published by Order Service).
 * Calls User Service to get user details for notification content.
 * Stores notifications in NotificationStore for frontend retrieval.
 *
 * NOTE: The Order Service is written in Go and publishes raw JSON bytes
 * with content_type "application/json". Spring AMQP's SimpleMessageConverter
 * does NOT convert "application/json" to String — it only does so for
 * "text/plain". To handle messages from non-Java publishers reliably,
 * we accept the raw org.springframework.amqp.core.Message and extract
 * the body bytes ourselves.
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
    public void handleOrderCreated(org.springframework.amqp.core.Message rawMessage) {
        try {
            // Extract raw JSON bytes — works regardless of publisher content-type header
            String message = new String(rawMessage.getBody(), StandardCharsets.UTF_8);
            log.info("Raw order.created message: {}", message);

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
            log.error("Failed to process order.created: {}", e.getMessage(), e);
        }
    }
}
