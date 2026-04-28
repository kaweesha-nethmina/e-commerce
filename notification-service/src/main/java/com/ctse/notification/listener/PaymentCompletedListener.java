package com.ctse.notification.listener;

import com.ctse.notification.client.UserServiceClient;
import com.ctse.notification.config.RabbitConfig;
import com.ctse.notification.dto.Notification;
import com.ctse.notification.dto.PaymentCompletedEvent;
import com.ctse.notification.store.NotificationStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Consumes payment.completed events from RabbitMQ (published by Payment Service).
 * Creates a "Payment Successful" notification instead of an "Order Created" one.
 *
 * NOTE: The Payment Service publishes raw JSON bytes via Node.js amqplib
 * without setting content_type headers. We accept the raw AMQP Message
 * and extract body bytes manually to avoid Spring's SimpleMessageConverter
 * type mismatch issues.
 */
@Component
public class PaymentCompletedListener {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedListener.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserServiceClient userServiceClient;
    private final NotificationStore notificationStore;

    public PaymentCompletedListener(UserServiceClient userServiceClient, NotificationStore notificationStore) {
        this.userServiceClient = userServiceClient;
        this.notificationStore = notificationStore;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_PAYMENT_COMPLETED_QUEUE)
    public void handlePaymentCompleted(org.springframework.amqp.core.Message rawMessage) {
        try {
            // Extract raw JSON bytes — works regardless of publisher content-type header
            String message = new String(rawMessage.getBody(), StandardCharsets.UTF_8);
            log.info("Raw payment.completed message: {}", message);

            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            log.info("Received payment.completed: orderId={}, userId={}, amount={}",
                    event.getOrderId(), event.getUserId(), event.getAmount());

            // Integration: call User Service for user details
            var user = userServiceClient.getUser(event.getUserId());
            String userName = user != null ? user.getName() : "Customer";
            String email = user != null ? user.getEmail() : null;

            // Build payment notification
            String title = "Payment Successful";
            String msg = String.format("Payment of $%.2f completed for order %s. Transaction: %s",
                    event.getAmount(),
                    event.getOrderId().substring(0, Math.min(8, event.getOrderId().length())),
                    event.getTransactionId());

            Notification notification = new Notification(
                    UUID.randomUUID().toString(),
                    "payment_completed",
                    title,
                    msg,
                    event.getOrderId(),
                    event.getUserId(),
                    userName,
                    email,
                    null  // no items for payment notifications
            );

            notificationStore.add(notification);

            log.info("Notification stored: Payment completed for order {} by {} (email: {})",
                    event.getOrderId(), userName, email);
        } catch (Exception e) {
            log.error("Failed to process payment.completed: {}", e.getMessage(), e);
        }
    }
}
