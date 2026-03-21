package com.ctse.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCreatedEvent {
    @JsonProperty("order_id")
    private String orderId;
    @JsonProperty("user_id")
    private String userId;
    @JsonProperty("items")
    private List<OrderItem> items;
    @JsonProperty("status")
    private String status;
    @JsonProperty("created_at")
    private String createdAt;
    @JsonProperty("updated_at")
    private String updatedAt;

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderItem {
        @JsonProperty("product_id")
        private String productId;
        @JsonProperty("quantity")
        private int quantity;
        @JsonProperty("price")
        private double price;
        @JsonProperty("name")
        private String name;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
