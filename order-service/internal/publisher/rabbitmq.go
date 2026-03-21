package publisher

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"order-service/internal/models"
)

var (
	conn    *amqp.Connection
	channel *amqp.Channel
)

var rabbitMQURL = getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func InitRabbitMQ() {
	var err error
	for i := 0; i < 5; i++ {
		conn, err = amqp.Dial(rabbitMQURL)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ, retrying in 5s... (%v)", err)
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		log.Fatalf("Fatal error connecting to RabbitMQ: %v", err)
	}

	channel, err = conn.Channel()
	if err != nil {
		log.Fatalf("Fatal error opening channel: %v", err)
	}

	err = channel.ExchangeDeclare(
		"order_events_exchange", // name
		"fanout",                // type
		true,                    // durable
		false,                   // auto-deleted
		false,                   // internal
		false,                   // no-wait
		nil,                     // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare an exchange: %v", err)
	}
	log.Println("Successfully connected to RabbitMQ and declared exchange")
}

func CloseRabbitMQ() {
	if channel != nil {
		channel.Close()
	}
	if conn != nil {
		conn.Close()
	}
}

func PublishOrderCreated(order *models.Order) error {
	if channel == nil {
		log.Println("RabbitMQ channel is not initialized")
		return nil
	}
	body, _ := json.Marshal(map[string]interface{}{
		"order_id":   order.ID,
		"user_id":    order.UserID,
		"items":      order.Items,
		"status":     order.Status,
		"created_at": order.CreatedAt.Format(time.RFC3339),
	})
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return channel.PublishWithContext(ctx,
		"order_events_exchange", // exchange
		"",                      // routing key
		false,                   // mandatory
		false,                   // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
}

func PublishOrderStatusChanged(order *models.Order) error {
	if channel == nil {
		log.Println("RabbitMQ channel is not initialized")
		return nil
	}
	body, _ := json.Marshal(map[string]interface{}{
		"order_id":   order.ID,
		"user_id":    order.UserID,
		"status":     order.Status,
		"updated_at": time.Now().Format(time.RFC3339),
	})
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return channel.PublishWithContext(ctx,
		"order_events_exchange", // exchange
		"",                      // routing key
		false,                   // mandatory
		false,                   // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
}
