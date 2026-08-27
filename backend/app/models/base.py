"""
Base model và các Mixins dùng chung cho tất cả models.
- TimestampMixin: tự động quản lý created_at, updated_at.
- SoftDeleteMixin: hỗ trợ xóa mềm (soft delete) qua cột deleted_at.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class cho tất cả SQLAlchemy models."""
    pass


class TimestampMixin:
    """Mixin tự động thêm created_at và updated_at vào model."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Mixin hỗ trợ Soft Delete — đánh dấu xóa thay vì xóa vật lý.
    
    Khi deleted_at != NULL → record đã bị xóa mềm.
    Query mặc định nên lọc WHERE deleted_at IS NULL.
    """
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        index=True,  # Index để tối ưu query lọc soft-deleted records
    )

    @property
    def is_deleted(self) -> bool:
        """Kiểm tra record đã bị xóa mềm chưa."""
        return self.deleted_at is not None
