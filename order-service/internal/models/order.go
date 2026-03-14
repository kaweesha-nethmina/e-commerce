package models

import "time"

type OrderItem struct {
	ProductID string  `json:"product_id" bson:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" bson:"quantity" binding:"required,min=1"`
	Price     float64 `json:"price,omitempty" bson:"price,omitempty"`
	Name      string  `json:"name,omitempty" bson:"name,omitempty"`
}

type CreateOrderRequest struct {
	Items []OrderItem `json:"items" binding:"required,min=1"`
}

type Order struct {
	ID         string      `json:"id" bson:"id"`
	UserID     string      `json:"user_id" bson:"user_id"`
	Items      []OrderItem `json:"items" bson:"items"`
	Status     string      `json:"status" bson:"status"`
	TotalPrice float64     `json:"total_price" bson:"total_price"`
	CreatedAt  time.Time   `json:"created_at" bson:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

type OrderSummary struct {
	TotalOrders    int     `json:"total_orders"`
	TotalSpent     float64 `json:"total_spent"`
	AverageValue   float64 `json:"average_order_value"`
	StatusBreakdown map[string]int `json:"status_breakdown"`
}
