"""
Inventory Router — API quản lý tồn kho.

Cung cấp các endpoint:
- POST /restock:          Admin nhập thêm hàng vào kho
- POST /check:            Kiểm tra tồn kho (public)
- POST /orders/{id}/cancel: Hủy đơn hàng và hoàn trả tồn kho
"""
import uuid
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.dependencies import require_admin, get_current_active_user
from app.models.user import User
from app.services.inventory_service import InventoryService

router = APIRouter()


class RestockRequest(BaseModel):
    """Schema nhập thêm hàng."""
    variant_id: uuid.UUID
    quantity: int = Field(..., gt=0, description="Số lượng nhập thêm (phải > 0)")


class RestockResponse(BaseModel):
    """Schema phản hồi sau khi nhập hàng."""
    variant_id: str
    sku: str
    old_stock: int
    added: int
    new_stock: int


class StockCheckRequest(BaseModel):
    """Schema yêu cầu kiểm tra tồn kho."""
    variant_ids: list[uuid.UUID] = Field(..., min_length=1, description="Danh sách variant IDs cần kiểm tra")


@router.post(
    "/restock",
    response_model=RestockResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhập thêm hàng vào kho (Admin only)",
)
async def restock_variant(
    data: RestockRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin nhập thêm hàng vào kho cho một variant cụ thể.

    Sử dụng SELECT FOR UPDATE để đảm bảo an toàn khi nhiều
    admin cùng nhập hàng cho cùng một variant.
    """
    inventory = InventoryService(db)

    # Lưu lại stock cũ để trả về cho admin xem
    old_stock_data = await inventory.check_stock([data.variant_id])
    old_stock = old_stock_data[0]["stock_quantity"] if old_stock_data else 0

    variant = await inventory.restock(data.variant_id, data.quantity)
    await db.commit()

    return RestockResponse(
        variant_id=str(variant.id),
        sku=variant.sku,
        old_stock=old_stock,
        added=data.quantity,
        new_stock=variant.stock_quantity,
    )


@router.post(
    "/check",
    response_model=list[dict],
    status_code=status.HTTP_200_OK,
    summary="Kiểm tra tồn kho (Public)",
)
async def check_stock(
    data: StockCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Kiểm tra tồn kho cho danh sách variants.

    Endpoint này KHÔNG lock dữ liệu, chỉ đọc thông tin hiện tại.
    Thích hợp để hiển thị "Còn hàng" / "Hết hàng" trên giao diện.
    """
    inventory = InventoryService(db)
    return await inventory.check_stock(data.variant_ids)
