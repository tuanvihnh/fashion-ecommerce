"""
Category model cho phân loại sản phẩm.
"""
import uuid
from typing import List, Optional

from sqlalchemy import String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    """
    Category model for products.
    Bảng danh mục sản phẩm (hỗ trợ phân cấp qua parent_id).
    """
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    children: Mapped[List["Category"]] = relationship("Category", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["Category"]] = relationship("Category", back_populates="children", remote_side=[id])
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")
