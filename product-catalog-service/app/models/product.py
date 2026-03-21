from pydantic import BaseModel, Field
from typing import List, Optional

class Product(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str
    price: float
    stock: int
    image_url: str = ""

class CreateProductRequest(BaseModel):
    name: str
    description: str = ""
    category: str
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image_url: str = ""

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None

class CheckStockItem(BaseModel):
    product_id: str
    quantity: int

class CheckStockRequest(BaseModel):
    items: List[CheckStockItem]

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""

class Review(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str = "Anonymous"
    rating: int
    comment: str = ""
    created_at: str = ""
