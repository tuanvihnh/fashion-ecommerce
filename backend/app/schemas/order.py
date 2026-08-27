"""
Order and Order Item schemas.
Các schema liên quan đến đơn hàng.
"""
from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    """Schema for adding an item to a new order."""
    product_variant_id: UUID
    quantity: int = Field(..., gt=0, description="Số lượng (phải > 0)")


class OrderItemRead(BaseModel):
    """Schema for reading order item details."""
    id: UUID
    order_id: UUID
    product_variant_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product_title_snapshot: str
    variant_info_snapshot: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShippingAddress(BaseModel):
    """Schema for shipping address details (stored as JSON in DB)."""
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: str
    country: str = "VN"


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    items: list[OrderItemCreate] = Field(..., min_length=1, description="Danh sách sản phẩm (ít nhất 1)")
    shipping_address: ShippingAddress
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class OrderRead(BaseModel):
    """Schema for reading full order details."""
    id: UUID
    order_number: str
    user_id: UUID
    status: OrderStatus
    subtotal: Decimal
    shipping_fee: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    shipping_address_json: dict[str, Any]
    payment_method: Optional[str]
    payment_status: PaymentStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    items: list[OrderItemRead] = []

    model_config = ConfigDict(from_attributes=True)


class OrderListRead(BaseModel):
    """Schema for listing orders (simplified view)."""
    id: UUID
    order_number: str
    status: OrderStatus
    total_amount: Decimal
    payment_status: PaymentStatus
    created_at: datetime
    item_count: int

    model_config = ConfigDict(from_attributes=True)


class OrderUpdateStatus(BaseModel):
    """Schema for admin to update order status."""
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
