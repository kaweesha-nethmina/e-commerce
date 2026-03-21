"""Basic tests for Product Catalog Service."""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["service"] == "product-catalog-service"


def test_list_products():
    r = client.get("/products")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_product():
    r = client.get("/products/p1")
    assert r.status_code == 200
    assert r.json()["id"] == "p1"


def test_get_product_not_found():
    r = client.get("/products/nonexistent")
    assert r.status_code == 404


def test_check_stock():
    r = client.post("/products/check-stock", json={"items": [{"product_id": "p1", "quantity": 1}]})
    assert r.status_code == 200
    assert r.json()["all_available"] is True
