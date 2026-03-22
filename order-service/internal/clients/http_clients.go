package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"order-service/internal/models"
)


var (
	userServiceURL    = getEnv("USER_SERVICE_URL", "http://localhost:3001")
	productServiceURL = getEnv("PRODUCT_SERVICE_URL", "http://localhost:3002")
)

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func ValidateUser(authHeader string) (string, error) {
	req, _ := http.NewRequest(http.MethodPost, userServiceURL+"/auth/validate", nil)
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("validate returned %d: %s", resp.StatusCode, string(body))
	}
	var out struct {
		Valid  bool   `json:"valid"`
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal(body, &out); err != nil || !out.Valid {
		return "", fmt.Errorf("invalid token")
	}
	return out.UserID, nil
}

func CheckStock(items []models.OrderItem) (bool, error) {
	payload := map[string]interface{}{"items": items}
	b, _ := json.Marshal(payload)
	resp, err := http.Post(productServiceURL+"/products/check-stock", "application/json", bytes.NewReader(b))
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("check-stock returned %d", resp.StatusCode)
	}
	var out struct {
		AllAvailable bool `json:"all_available"`
	}
	_ = json.Unmarshal(body, &out)
	return out.AllAvailable, nil
}

// ProductInfo holds basic product details for enriching orders
type ProductInfo struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

// GetProduct fetches a single product's details from the Product Catalog
func GetProduct(productID string) (*ProductInfo, error) {
	resp, err := http.Get(productServiceURL + "/products/" + productID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get product returned %d", resp.StatusCode)
	}
	var p ProductInfo
	if err := json.Unmarshal(body, &p); err != nil {
		return nil, err
	}
	return &p, nil
}
