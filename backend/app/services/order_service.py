"""
Order Service — xử lý tạo đơn hàng với transaction an toàn.

Đây là service phức tạp nhất, áp dụng:
- Database Transaction (commit/rollback)
- InventoryService để quản lý tồn kho (Pessimistic Locking)
- Price snapshot để bảo toàn lịch sử giá
- Stock deduction tại cấp ProductVariant
"""
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
from app.services.inventory_service import (
    InventoryService,
    InsufficientStockError,
    VariantNotFoundError,
)


class OrderService:
    """Service quản lý đơn hàng — đảm bảo tính toàn vẹn giao dịch."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.inventory = InventoryService(db)

    @staticmethod
    def _generate_order_number() -> str:
        """Tạo mã đơn hàng duy nhất: ORD-YYYYMMDD-XXXXX."""
        now = datetime.now(timezone.utc)
        random_part = uuid.uuid4().hex[:8].upper()
        return f"ORD-{now.strftime('%Y%m%d')}-{random_part}"

    async def create_order(
        self,
        user: User,
        order_data: OrderCreate,
    ) -> OrderRead:
        """Tạo đơn hàng mới với đảm bảo transaction.

        Flow:
        1. InventoryService.reserve_stock() — Lock + Validate + Trừ kho (atomic)
        2. Tạo Order và OrderItems từ reservation data
        3. Commit transaction hoặc rollback nếu có lỗi

        Raises:
            HTTPException 400: Nếu variant không tồn tại hoặc hết hàng
            HTTPException 500: Nếu có lỗi hệ thống khi tạo đơn
        """
        try:
            # === STEP 1: Reserve stock thông qua InventoryService ===
            # Service này sẽ:
            # - Sắp xếp variant IDs để tránh deadlock
            # - Lock các dòng bằng SELECT FOR UPDATE
            # - Validate stock đủ
            # - Trừ stock_quantity
            # - Trả về snapshot (giá, tên sản phẩm) tại thời điểm đặt hàng
            items_to_reserve = [
                {"variant_id": item.product_variant_id, "quantity": item.quantity}
                for item in order_data.items
            ]
            reservations = await self.inventory.reserve_stock(items_to_reserve)

            # === STEP 2: Tạo OrderItems từ reservation data ===
            order_items: list[OrderItem] = []
            subtotal = 0

            for reservation in reservations:
                order_item = OrderItem(
                    id=uuid.uuid4(),
                    product_variant_id=reservation.variant_id,
                    quantity=reservation.quantity,
                    unit_price=reservation.unit_price,           # 💰 Snapshot giá
                    subtotal=reservation.subtotal,
                    product_title_snapshot=reservation.product_title,  # 📸 Snapshot tên
                    variant_info_snapshot=reservation.variant_info,
                )
                order_items.append(order_item)
                subtotal += reservation.subtotal

            # === STEP 3: Tạo Order ===
            shipping_fee = 0  # Có thể tính toán dựa trên địa chỉ/trọng lượng
            discount_amount = 0  # Có thể áp dụng coupon ở đây
            total_amount = subtotal + shipping_fee - discount_amount

            order = Order(
                id=uuid.uuid4(),
                order_number=self._generate_order_number(),
                user_id=user.id,
                status=OrderStatus.PENDING,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                discount_amount=discount_amount,
                total_amount=total_amount,
                shipping_address_json=json.dumps(
                    order_data.shipping_address.model_dump(), ensure_ascii=False
                ),
                payment_method=order_data.payment_method,
                payment_status=PaymentStatus.PENDING,
                notes=order_data.notes,
            )

            # Gắn order_id cho từng item
            for item in order_items:
                item.order_id = order.id

            self.db.add(order)
            self.db.add_all(order_items)

            # === STEP 4: Commit transaction ===
            await self.db.commit()
            await self.db.refresh(order)

            return OrderRead.model_validate(order)

        except VariantNotFoundError as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        except InsufficientStockError as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        except HTTPException:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi hệ thống khi tạo đơn hàng / Internal error: {str(e)}",
            ) from e

    async def cancel_order(
        self,
        order_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrderRead:
        """Hủy đơn hàng và hoàn trả tồn kho.

        Chỉ cho phép hủy đơn ở trạng thái PENDING hoặc CONFIRMED.
        """
        stmt = select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn hàng không tồn tại / Order not found",
            )

        # Chỉ cho phép hủy đơn ở trạng thái chưa xử lý
        if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể hủy đơn ở trạng thái '{order.status.value}'",
            )

        try:
            # Hoàn trả tồn kho
            # Cần load order items để biết variant_id và quantity
            items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
            items_result = await self.db.execute(items_stmt)
            order_items = items_result.scalars().all()

            items_to_release = [
                {"variant_id": item.product_variant_id, "quantity": item.quantity}
                for item in order_items
            ]
            await self.inventory.release_stock(items_to_release)

            # Cập nhật trạng thái đơn hàng
            order.status = OrderStatus.CANCELLED
            order.payment_status = PaymentStatus.REFUNDED

            await self.db.commit()
            await self.db.refresh(order)

            return OrderRead.model_validate(order)

        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi khi hủy đơn hàng: {str(e)}",
            ) from e

    async def get_user_orders(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Order], int]:
        """Lấy danh sách đơn hàng của user với phân trang."""
        # Count total
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(Order).where(Order.user_id == user_id)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        # Fetch orders — N+1 FIX
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        orders = list(result.scalars().all())

        return orders, total

    async def get_order_by_id(
        self,
        order_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Order:
        """Lấy chi tiết đơn hàng — chỉ cho phép user xem đơn của mình."""
        stmt = select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn hàng không tồn tại / Order not found",
            )

        return order

    async def get_all_orders(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Order], int]:
        """Admin: Lấy danh sách tất cả đơn hàng với phân trang."""
        # Count total
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(Order)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        # Fetch orders — N+1 FIX
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        orders = list(result.scalars().all())

        return orders, total

    async def update_order_status(
        self,
        order_id: uuid.UUID,
        update_data: dict,
    ) -> OrderRead:
        """Admin: Cập nhật trạng thái đơn hàng."""
        stmt = select(Order).where(Order.id == order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn hàng không tồn tại / Order not found",
            )

        for key, value in update_data.items():
            if value is not None:
                setattr(order, key, value)

        await self.db.commit()
        await self.db.refresh(order)

        return OrderRead.model_validate(order)
