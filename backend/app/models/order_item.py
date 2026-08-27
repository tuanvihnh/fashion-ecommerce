"""
OrderItem model - Chi tiết đơn hàng.
"""
import uuid
from decimal import Decimal
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, ForeignKey, CheckConstraint, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class OrderItem(Base):
    """
    OrderItem model.
    Bảng chi tiết đơn hàng (lưu trữ giá tại thời điểm mua để giữ lịch sử).
    """
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_variant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Snapshot of unit price at order time for price history preservation
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    
    # Snapshot of product information
    product_title_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)
    variant_info_snapshot: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Created at only, no updated at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product_variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="order_items")
