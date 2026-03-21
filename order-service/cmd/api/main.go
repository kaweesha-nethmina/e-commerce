package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"order-service/internal/consumer"
	"order-service/internal/database"
	"order-service/internal/handlers"
	"order-service/internal/publisher"
)

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	database.ConnectMongo()
	
	publisher.InitRabbitMQ()
	defer publisher.CloseRabbitMQ()
	consumer.InitPaymentConsumer()

	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "order-service"})
	})

	// Order routes
	r.POST("/orders", handlers.CreateOrder)
	r.GET("/orders", handlers.ListOrders)
	r.GET("/orders/summary", handlers.GetOrderSummary)
	r.GET("/orders/:id", handlers.GetOrder)
	r.PUT("/orders/:id/status", handlers.UpdateOrderStatus)
	r.POST("/orders/:id/cancel", handlers.CancelOrder)
	r.DELETE("/orders/:id", handlers.DeleteOrder)

	port := getEnv("PORT", "3003")
	r.Run(":" + port)
}
