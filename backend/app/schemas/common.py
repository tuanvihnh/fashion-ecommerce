"""
Common Pydantic schemas.
Các schema Pydantic dùng chung.
"""
from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar('T')

class MessageResponse(BaseModel):
    """
    Response schema for simple messages.
    Schema trả về cho tin nhắn đơn giản.
    """
    message: str


class HealthCheckResponse(BaseModel):
    """
    Health check response schema.
    Schema trả về cho API kiểm tra trạng thái.
    """
    status: str
    version: str


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response.
    Schema trả về có phân trang tổng quát.
    """
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)
