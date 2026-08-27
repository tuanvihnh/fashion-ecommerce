"""
User model cho việc authentication và thông tin profile.
"""
import uuid
import enum
from typing import List, Optional

from sqlalchemy import String, Boolean, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class UserRole(enum.Enum):
    """Enum định nghĩa vai trò của người dùng."""
    CUSTOMER = "customer"
    ADMIN = "admin"


class User(Base, TimestampMixin, SoftDeleteMixin):
    """
    User model for authentication and profiles.
    Bảng người dùng lưu thông tin xác thực và hồ sơ.
    """
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
