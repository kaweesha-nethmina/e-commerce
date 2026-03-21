package com.ctse.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Represents a notification generated from an order event.
 * Stored in MongoDB and exposed via GET /notifications.
 */
@Document(collection = "notifications")
public class Notification {

    @Id
    private String mongoId;

    @JsonProperty("id")
    private String id;

    @JsonProperty("type")
    private String type;

    @JsonProperty("title")
    private String title;

    @JsonProperty("message")
    private String message;

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_email")
    private String userEmail;

    @JsonProperty("items")
    private List<OrderCreatedEvent.OrderItem> items;

    @JsonProperty("read")
    private boolean read;

    @JsonProperty("created_at")
    private String createdAt;

    public Notification() {}

    public Notification(String id, String type, String title, String message,
                        String orderId, String userId, String userName, String userEmail,
                        List<OrderCreatedEvent.OrderItem> items) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.orderId = orderId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.items = items;
        this.read = false;
        this.createdAt = Instant.now().toString();
    }

    public String getMongoId() { return mongoId; }
    public void setMongoId(String mongoId) { this.mongoId = mongoId; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public List<OrderCreatedEvent.OrderItem> getItems() { return items; }
    public void setItems(List<OrderCreatedEvent.OrderItem> items) { this.items = items; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
