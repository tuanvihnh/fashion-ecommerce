"""
Product, Category, and Variant schemas.
Các schema liên quan đến sản phẩm, danh mục và biến thể.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.product import GenderType


class CategoryBase(BaseModel):
    """Base schema for category."""
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    """Schema for creating a new category."""
    pass


class CategoryRead(CategoryBase):
    """Schema for reading category details."""
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductVariantBase(BaseModel):
    """Base schema for product variant."""
    sku: str
    size: str
    color: str
    color_hex: Optional[str] = None
    image_url: Optional[str] = Field(None, description="URL ảnh riêng của biến thể")
    stock_quantity: int = Field(..., ge=0, description="Số lượng tồn kho (>= 0)")
    price_override: Optional[Decimal] = Field(None, ge=0, description="Giá ghi đè nếu có")


class ProductVariantCreate(ProductVariantBase):
    """Schema for creating a new product variant."""
    pass


class ProductVariantRead(ProductVariantBase):
    """Schema for reading product variant details."""
    id: UUID
    product_id: UUID
    is_active: bool
    created_at: datetime
    effective_price: Optional[Decimal] = None  # Có thể tính toán ở mức DB/Model hoặc Service

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    """Base schema for product."""
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    base_price: Decimal = Field(..., gt=0, description="Giá gốc (> 0)")
    brand: Optional[str] = None
    material: Optional[str] = None
    gender: GenderType = GenderType.UNISEX
    image_url: Optional[str] = Field(None, description="URL ảnh chính của sản phẩm")


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    base_price: Optional[Decimal] = Field(None, gt=0, description="Giá gốc (> 0)")
    brand: Optional[str] = None
    material: Optional[str] = None
    gender: Optional[GenderType] = None
    is_active: Optional[bool] = None


class ProductRead(ProductBase):
    """Schema for reading product details (includes variants and category)."""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    variants: list[ProductVariantRead] = []
    category: Optional[CategoryRead] = None

    model_config = ConfigDict(from_attributes=True)


class ProductListRead(BaseModel):
    """Schema for listing products (simplified version)."""
    id: UUID
    title: str
    slug: str
    base_price: Decimal
    brand: Optional[str]
    gender: GenderType
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
