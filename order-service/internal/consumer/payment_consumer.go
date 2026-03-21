package consumer

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson"

	"order-service/internal/database"
	"order-service/internal/models"
	"order-service/internal/publisher"
)

var rabbitMQURL = getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func InitPaymentConsumer() {
	conn, err := amqp.Dial(rabbitMQURL)
	if err != nil {
		log.Printf("Consumer failed to connect to RabbitMQ: %v", err)
		return
	}

	channel, err := conn.Channel()
	if err != nil {
		log.Printf("Consumer failed to open channel: %v", err)
		return
	}

	// Ensure exchange exists
	err = channel.ExchangeDeclare(
		"payment_events_exchange", // name
		"fanout",                  // type
		true,                      // durable
		false,                     // auto-deleted
		false,                     // internal
		false,                     // no-wait
		nil,                       // arguments
	)
	if err != nil {
		log.Printf("Failed to declare payment exchange: %v", err)
		return
	}

	// Declare queue
	q, err := channel.QueueDeclare(
		"order_service_payment_queue", // name
		true,                          // durable
		false,                         // delete when unused
		false,                         // exclusive
		false,                         // no-wait
		nil,                           // arguments
	)
	if err != nil {
		log.Printf("Failed to declare payment queue: %v", err)
		return
	}

	err = channel.QueueBind(
		q.Name,
		"", // routing key
		"payment_events_exchange",
		false,
		nil,
	)
	if err != nil {
		log.Printf("Failed to bind queue: %v", err)
		return
	}

	msgs, err := channel.Consume(
		q.Name,
		"",    // consumer
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		log.Printf("Failed to register a consumer: %v", err)
		return
	}

	go func() {
		for d := range msgs {
			var paymentEvent struct {
				Event         string `json:"event"`
				OrderID       string `json:"order_id"`
				UserID        string `json:"user_id"`
				Amount        float64`json:"amount"`
				Status        string `json:"status"`
				TransactionID string `json:"transaction_id"`
			}
			err := json.Unmarshal(d.Body, &paymentEvent)
			if err != nil {
				log.Printf("Error decoding payment event: %v", err)
				d.Nack(false, false)
				continue
			}

			if paymentEvent.Event == "payment.completed" && paymentEvent.Status == "completed" {
				log.Printf("Payment completed for order: %s, updating status to paid", paymentEvent.OrderID)

				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				
				// Find order
				var order models.Order
				err = database.OrdersCol.FindOne(ctx, bson.M{"id": paymentEvent.OrderID}).Decode(&order)
				
				if err == nil && order.Status != "paid" {
					update := bson.M{
						"$set": bson.M{
							"status":     "paid",
							"updated_at": time.Now(),
						},
					}
					_, err = database.OrdersCol.UpdateOne(ctx, bson.M{"id": paymentEvent.OrderID}, update)
					if err != nil {
						log.Printf("Failed to update order %s: %v", paymentEvent.OrderID, err)
					} else {
						// Publish event
						order.Status = "paid"
						publisher.PublishOrderStatusChanged(&order)
					}
				}
				cancel()
			}
			d.Ack(false)
		}
	}()
	log.Println("Payment Consumer listening on payment_events_exchange...")
}
