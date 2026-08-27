"""
ProductVariant model - biến thể của sản phẩm để quản lý kho.
"""
import uuid
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import String, Boolean, Integer, Numeric, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class ProductVariant(Base, TimestampMixin):
    """
    Product Variant model for managing stock and variations.
    Bảng biến thể sản phẩm (quản lý tồn kho theo màu sắc và kích cỡ).
    """
    __tablename__ = "product_variants"
    __table_args__ = (
        Index("ix_product_variant_prod_size_color", "product_id", "size", "color"),
        CheckConstraint("stock_quantity >= 0", name="check_stock_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    size: Mapped[str] = mapped_column(String(20), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    color_hex: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price_override: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product_variant")
