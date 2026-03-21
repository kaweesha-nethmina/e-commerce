from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.models.product import (
    Product, CreateProductRequest, UpdateProductRequest,
    CheckStockRequest, Review, ReviewCreate
)
from app.db.database import products_col, reviews_col

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "service": "product-catalog-service"}

# ===== Product CRUD =====

@router.get("/products", response_model=List[Product])
def list_products(
    search: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    sort: Optional[str] = Query(None, description="Sort: price_asc, price_desc, name_asc, name_desc"),
):
    query = {}

    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    if category:
        query["category"] = category

    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        query["price"] = price_filter

    # Build sort order
    sort_order = None
    if sort == "price_asc":
        sort_order = [("price", 1)]
    elif sort == "price_desc":
        sort_order = [("price", -1)]
    elif sort == "name_asc":
        sort_order = [("name", 1)]
    elif sort == "name_desc":
        sort_order = [("name", -1)]

    cursor = products_col.find(query, {"_id": 0})
    if sort_order:
        cursor = cursor.sort(sort_order)

    return list(cursor)

@router.get("/products/categories")
def list_categories():
    """Get all unique categories."""
    categories = products_col.distinct("category")
    return {"categories": categories}

@router.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    p = products_col.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="product not found")
    return p

@router.post("/products", response_model=Product, status_code=201)
def create_product(body: CreateProductRequest):
    product_id = f"p{uuid.uuid4().hex[:8]}"
    product = {
        "id": product_id,
        "name": body.name,
        "description": body.description,
        "category": body.category,
        "price": body.price,
        "stock": body.stock,
        "image_url": body.image_url,
    }
    products_col.insert_one(product)
    return product

@router.put("/products/{product_id}", response_model=Product)
def update_product(product_id: str, body: UpdateProductRequest):
    existing = products_col.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="product not found")

    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="no fields to update")

    products_col.update_one({"id": product_id}, {"$set": updates})
    updated = products_col.find_one({"id": product_id}, {"_id": 0})
    return updated

@router.delete("/products/{product_id}")
def delete_product(product_id: str):
    result = products_col.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="product not found")
    # Also delete associated reviews
    reviews_col.delete_many({"product_id": product_id})
    return {"message": "product deleted", "id": product_id}

# ===== Stock Check =====

@router.post("/products/check-stock")
def check_stock(body: CheckStockRequest):
    result = []
    for item in body.items:
        product = products_col.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            result.append({
                "product_id": item.product_id,
                "available": False,
                "error": "product not found",
                "in_stock": 0,
            })
        elif product["stock"] < item.quantity:
            result.append({
                "product_id": item.product_id,
                "available": False,
                "error": "insufficient stock",
                "in_stock": product["stock"],
            })
        else:
            result.append({
                "product_id": item.product_id,
                "available": True,
                "in_stock": product["stock"],
            })
    return {"items": result, "all_available": all(r["available"] for r in result)}

# ===== Product Reviews =====

@router.get("/products/{product_id}/reviews")
def get_reviews(product_id: str):
    """Get all reviews for a product."""
    p = products_col.find_one({"id": product_id})
    if not p:
        raise HTTPException(status_code=404, detail="product not found")

    reviews = list(reviews_col.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1))
    # Calculate average rating
    avg_rating = 0.0
    if reviews:
        avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)

    return {
        "reviews": reviews,
        "count": len(reviews),
        "average_rating": avg_rating,
    }

@router.post("/products/{product_id}/reviews", status_code=201)
def create_review(product_id: str, body: ReviewCreate, user_id: str = Query(...), user_name: str = Query("Anonymous")):
    """Create a review for a product."""
    p = products_col.find_one({"id": product_id})
    if not p:
        raise HTTPException(status_code=404, detail="product not found")

    review = {
        "id": f"rev_{uuid.uuid4().hex[:8]}",
        "product_id": product_id,
        "user_id": user_id,
        "user_name": user_name,
        "rating": body.rating,
        "comment": body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    reviews_col.insert_one(review)
    review.pop("_id", None)
    return review
