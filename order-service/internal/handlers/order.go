package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"

	"order-service/internal/clients"
	"order-service/internal/database"
	"order-service/internal/models"
	"order-service/internal/publisher"
)

func CreateOrder(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
		return
	}

	userID, err := clients.ValidateUser(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user: " + err.Error()})
		return
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ok, err := clients.CheckStock(req.Items)
	if err != nil || !ok {
		errMsg := "stock check failed or insufficient stock"
		if err != nil {
			errMsg = errMsg + ": " + err.Error()
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	// Enrich items with product name and price, calculate total
	var totalPrice float64
	enrichedItems := make([]models.OrderItem, len(req.Items))
	for i, item := range req.Items {
		enrichedItems[i] = item
		product, err := clients.GetProduct(item.ProductID)
		if err == nil && product != nil {
			enrichedItems[i].Price = product.Price
			enrichedItems[i].Name = product.Name
			totalPrice += product.Price * float64(item.Quantity)
		} else {
			log.Printf("Warning: could not fetch product %s for pricing: %v", item.ProductID, err)
		}
	}

	orderID := uuid.New().String()
	now := time.Now()
	order := &models.Order{
		ID:         orderID,
		UserID:     userID,
		Items:      enrichedItems,
		Status:     "created",
		TotalPrice: totalPrice,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = database.OrdersCol.InsertOne(ctx, order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save order"})
		return
	}

	_ = publisher.PublishOrderCreated(order)

	c.JSON(http.StatusCreated, order)
}

func ListOrders(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user ID from header (set by middleware)
	userID := c.GetHeader("X-User-ID")
	
	var filter bson.M
	if userID != "" {
		// Filter by authenticated user
		filter = bson.M{"user_id": userID}
	} else {
		// No authentication, return all (for backward compatibility)
		filter = bson.M{}
	}

	cursor, err := database.OrdersCol.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
		return
	}
	defer cursor.Close(ctx)

	var orders []*models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode orders"})
		return
	}
	if orders == nil {
		orders = []*models.Order{}
	}
	c.JSON(http.StatusOK, orders)
}

func GetOrder(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var order models.Order
	err := database.OrdersCol.FindOne(ctx, bson.M{"id": id}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find order first
	var order models.Order
	err := database.OrdersCol.FindOne(ctx, bson.M{"id": id}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	// Check if user owns this order (if authenticated)
	if userID != "" && order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only update your own orders"})
		return
	}

	// Update the status
	update := bson.M{
		"$set": bson.M{
			"status":     req.Status,
			"updated_at": time.Now(),
		},
	}

	_, err = database.OrdersCol.UpdateOne(ctx, bson.M{"id": id}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order status"})
		return
	}

	// Publish event
	order.Status = req.Status
	_ = publisher.PublishOrderStatusChanged(&order)

	c.JSON(http.StatusOK, gin.H{"message": "order status updated", "status": req.Status})
}

func CancelOrder(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetHeader("X-User-ID")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find order first
	var order models.Order
	err := database.OrdersCol.FindOne(ctx, bson.M{"id": id}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	// Check if user owns this order (if authenticated)
	if userID != "" && order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only cancel your own orders"})
		return
	}

	// Check if order can be cancelled
	if order.Status == "cancelled" || order.Status == "completed" || order.Status == "shipped" {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("cannot cancel order with status: %s", order.Status)})
		return
	}

	// Update the status to cancelled
	update := bson.M{
		"$set": bson.M{
			"status":     "cancelled",
			"updated_at": time.Now(),
		},
	}

	_, err = database.OrdersCol.UpdateOne(ctx, bson.M{"id": id}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel order"})
		return
	}

	// Publish event
	order.Status = "cancelled"
	_ = publisher.PublishOrderStatusChanged(&order)

	c.JSON(http.StatusOK, gin.H{"message": "order cancelled successfully", "status": "cancelled"})
}

func GetOrderSummary(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := database.OrdersCol.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
		return
	}
	defer cursor.Close(ctx)

	var orders []*models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode orders"})
		return
	}

	summary := models.OrderSummary{
		TotalOrders:     len(orders),
		StatusBreakdown: make(map[string]int),
	}

	for _, o := range orders {
		summary.TotalSpent += o.TotalPrice
		summary.StatusBreakdown[o.Status]++
	}

	if summary.TotalOrders > 0 {
		summary.AverageValue = summary.TotalSpent / float64(summary.TotalOrders)
	}

	c.JSON(http.StatusOK, summary)
}
