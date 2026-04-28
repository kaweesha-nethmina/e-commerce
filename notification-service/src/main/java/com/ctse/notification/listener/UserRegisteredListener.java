package com.ctse.notification.listener;

import com.ctse.notification.config.RabbitConfig;
import com.ctse.notification.dto.Notification;
import com.ctse.notification.dto.UserRegisteredEvent;
import com.ctse.notification.store.NotificationStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class UserRegisteredListener {

    private static final Logger log = LoggerFactory.getLogger(UserRegisteredListener.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final NotificationStore notificationStore;

    public UserRegisteredListener(NotificationStore notificationStore) {
        this.notificationStore = notificationStore;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATION_USER_REGISTERED_QUEUE)
    public void handleUserRegistered(org.springframework.amqp.core.Message rawMessage) {
        try {
            // Extract raw JSON bytes — works regardless of publisher content-type header
            String message = new String(rawMessage.getBody(), StandardCharsets.UTF_8);
            log.info("Raw user.registered message: {}", message);

            UserRegisteredEvent event = objectMapper.readValue(message, UserRegisteredEvent.class);
            log.info("Received user.registered: userId={}, name={}", event.getUserId(), event.getName());

            String title = "Welcome to OrderHub!";
            String msg = String.format("Hi %s, your account has been successfully created. Welcome aboard!", event.getName());

            Notification notification = new Notification(
                    UUID.randomUUID().toString(),
                    "user_registered",
                    title,
                    msg,
                    null, // No order ID
                    event.getUserId(),
                    event.getName(),
                    event.getEmail(),
                    null  // No items
            );

            notificationStore.add(notification);
            log.info("Notification stored: Welcome message for {}", event.getName());
        } catch (Exception e) {
            log.error("Failed to process user.registered: {}", e.getMessage(), e);
        }
    }
}
