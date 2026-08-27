"""
Orders Router.
"""
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderUpdateStatus
from app.services.order_service import OrderService
from app.services.ws_manager import manager as ws_manager

router = APIRouter()

@router.get("/admin/all", response_model=dict)
async def list_all_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Lấy danh sách toàn bộ đơn hàng trong hệ thống."""
    order_service = OrderService(db)
    orders, total = await order_service.get_all_orders(page, page_size)
    
    return {
        "items": [OrderRead.model_validate(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.patch("/admin/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: uuid.UUID,
    update_data: OrderUpdateStatus,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Cập nhật trạng thái và thanh toán của đơn hàng."""
    order_service = OrderService(db)
    order = await order_service.update_order_status(order_id, update_data.model_dump(exclude_unset=True))
    await ws_manager.broadcast({"type": "ORDER_UPDATED"}, group="admin")
    return order

@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Tạo đơn hàng mới / Create new order."""
    order_service = OrderService(db)
    order = await order_service.create_order(current_user, order_data)
    await ws_manager.broadcast({"type": "ORDER_CREATED"}, group="admin")
    return order

@router.get("/", response_model=dict)
async def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Lấy danh sách đơn hàng của tôi / List my orders."""
    order_service = OrderService(db)
    orders, total = await order_service.get_user_orders(current_user.id, page, page_size)
    
    return {
        "items": [OrderRead.model_validate(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{order_id}", response_model=OrderRead)
async def get_order_detail(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Lấy chi tiết đơn hàng / Get order detail."""
    order_service = OrderService(db)
    order = await order_service.get_order_by_id(order_id, current_user.id)
    return OrderRead.model_validate(order)

@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Hủy đơn hàng và hoàn trả tồn kho / Cancel order and release stock."""
    order_service = OrderService(db)
    return await order_service.cancel_order(order_id, current_user.id)

