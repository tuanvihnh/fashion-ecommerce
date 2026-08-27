"""
Product model cho hệ thống thương mại điện tử.
"""
import uuid
import enum
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import String, Text, Boolean, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class GenderType(enum.Enum):
    """Enum giới tính."""
    MEN = "men"
    WOMEN = "women"
    UNISEX = "unisex"


class Product(Base, TimestampMixin, SoftDeleteMixin):
    """
    Product model.
    Bảng sản phẩm chính.
    """
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    slug: Mapped[str] = mapped_column(String(250), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), index=True, nullable=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    material: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    gender: Mapped[GenderType] = mapped_column(SQLEnum(GenderType), default=GenderType.UNISEX, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
