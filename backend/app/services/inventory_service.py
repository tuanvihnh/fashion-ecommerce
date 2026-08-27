"""
Inventory Service — Quản lý tồn kho an toàn.

Áp dụng:
- Pessimistic Locking (SELECT FOR UPDATE) chống overselling
- Deadlock Prevention: sắp xếp variant IDs trước khi lock
- Database-level CHECK constraint (stock_quantity >= 0) là tầng bảo vệ cuối
- Atomic stock operations (deduct / restock)
"""
import uuid
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.product_variant import ProductVariant


class InsufficientStockError(Exception):
    """Lỗi khi không đủ tồn kho."""
    def __init__(self, sku: str, requested: int, available: int):
        self.sku = sku
        self.requested = requested
        self.available = available
        super().__init__(
            f"SKU '{sku}': yêu cầu {requested}, chỉ còn {available}"
        )


class VariantNotFoundError(Exception):
    """Lỗi khi variant không tồn tại hoặc đã ngưng bán."""
    def __init__(self, variant_id: uuid.UUID):
        self.variant_id = variant_id
        super().__init__(f"Variant {variant_id} không tồn tại hoặc đã ngưng bán")


class StockReservation:
    """Kết quả của việc giữ chỗ tồn kho cho 1 item.

    Chứa thông tin snapshot sản phẩm tại thời điểm đặt hàng,
    dùng để tạo OrderItem mà không cần query lại.
    """
    def __init__(
        self,
        variant_id: uuid.UUID,
        product_id: uuid.UUID,
        quantity: int,
        unit_price: Decimal,
        subtotal: Decimal,
        product_title: str,
        variant_info: str,
        sku: str,
    ):
        self.variant_id = variant_id
        self.product_id = product_id
        self.quantity = quantity
        self.unit_price = unit_price
        self.subtotal = subtotal
        self.product_title = product_title
        self.variant_info = variant_info
        self.sku = sku


class InventoryService:
    """Service quản lý tồn kho — tách riêng theo nguyên tắc Single Responsibility.

    Tất cả thao tác thay đổi stock_quantity đều đi qua service này
    để đảm bảo tính nhất quán và an toàn.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def reserve_stock(
        self,
        items: list[dict],
    ) -> list[StockReservation]:
        """Giữ chỗ (reserve) tồn kho cho danh sách items.

        ⚡ QUAN TRỌNG — Deadlock Prevention:
        Sắp xếp variant_ids theo thứ tự TĂNG DẦN trước khi lock.
        Nếu 2 transaction cùng lock các dòng theo cùng thứ tự,
        chúng sẽ KHÔNG BAO GIỜ deadlock nhau.

        Args:
            items: List of dicts with keys 'variant_id' (UUID) and 'quantity' (int)

        Returns:
            List[StockReservation] — thông tin snapshot của từng item

        Raises:
            VariantNotFoundError: variant không tồn tại
            InsufficientStockError: không đủ tồn kho
        """
        # === BƯỚC 1: Sắp xếp variant IDs — CHỐNG DEADLOCK ===
        # Khi 2 đơn hàng đồng thời mua sản phẩm A và B:
        #   - Đơn 1 lock A rồi lock B
        #   - Đơn 2 lock A rồi lock B  (cùng thứ tự → an toàn!)
        # Nếu KHÔNG sắp xếp:
        #   - Đơn 1 lock A, chờ B
        #   - Đơn 2 lock B, chờ A  → DEADLOCK! 💀
        sorted_items = sorted(items, key=lambda x: str(x["variant_id"]))
        variant_ids = [item["variant_id"] for item in sorted_items]
        quantity_map = {item["variant_id"]: item["quantity"] for item in sorted_items}

        # === BƯỚC 2: SELECT FOR UPDATE — Pessimistic Lock ===
        # Lock các dòng variant trong Database.
        # Bất kỳ transaction nào khác cố gắng đọc/ghi các dòng này
        # sẽ phải CHỜ cho đến khi transaction hiện tại COMMIT hoặc ROLLBACK.
        stmt = (
            select(ProductVariant)
            .where(
                ProductVariant.id.in_(variant_ids),
                ProductVariant.is_active.is_(True),
            )
            .order_by(ProductVariant.id)  # Đảm bảo lock theo thứ tự
            .with_for_update()  # 🔒 PESSIMISTIC LOCK
        )
        result = await self.db.execute(stmt)
        locked_variants = {v.id: v for v in result.scalars().all()}

        # === BƯỚC 3: Validate và trừ stock ===
        reservations: list[StockReservation] = []

        for variant_id in variant_ids:
            quantity = quantity_map[variant_id]
            variant = locked_variants.get(variant_id)

            # Kiểm tra variant có tồn tại không
            if variant is None:
                raise VariantNotFoundError(variant_id)

            # Kiểm tra stock đủ không
            if variant.stock_quantity < quantity:
                raise InsufficientStockError(
                    sku=variant.sku,
                    requested=quantity,
                    available=variant.stock_quantity,
                )

            # Load thông tin Product để snapshot
            product_stmt = select(Product).where(Product.id == variant.product_id)
            product_result = await self.db.execute(product_stmt)
            product = product_result.scalar_one()

            # Tính giá: ưu tiên price_override, fallback base_price
            effective_price = variant.price_override or product.base_price
            item_subtotal = effective_price * quantity

            # === TRỪ STOCK ===
            # Dòng này an toàn vì ta đã lock row bằng FOR UPDATE
            variant.stock_quantity -= quantity

            # Tạo reservation với snapshot data
            reservations.append(StockReservation(
                variant_id=variant.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=effective_price,
                subtotal=item_subtotal,
                product_title=product.title,
                variant_info=f"Size: {variant.size}, Color: {variant.color}",
                sku=variant.sku,
            ))

        return reservations

    async def release_stock(
        self,
        items: list[dict],
    ) -> None:
        """Hoàn trả tồn kho khi đơn hàng bị hủy.

        Args:
            items: List of dicts with keys 'variant_id' (UUID) and 'quantity' (int)
        """
        for item in items:
            stmt = (
                select(ProductVariant)
                .where(ProductVariant.id == item["variant_id"])
                .with_for_update()
            )
            result = await self.db.execute(stmt)
            variant = result.scalar_one_or_none()

            if variant:
                variant.stock_quantity += item["quantity"]

    async def restock(
        self,
        variant_id: uuid.UUID,
        quantity: int,
    ) -> ProductVariant:
        """Nhập thêm hàng vào kho (Admin).

        Args:
            variant_id: ID của variant cần nhập thêm
            quantity: Số lượng nhập thêm (phải > 0)

        Returns:
            ProductVariant sau khi cập nhật
        """
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        variant = result.scalar_one_or_none()

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variant {variant_id} không tồn tại",
            )

        variant.stock_quantity += quantity
        await self.db.flush()

        return variant

    async def check_stock(
        self,
        variant_ids: list[uuid.UUID],
    ) -> list[dict]:
        """Kiểm tra tồn kho mà KHÔNG lock (dùng cho hiển thị).

        Args:
            variant_ids: Danh sách variant IDs cần kiểm tra

        Returns:
            List of dicts chứa thông tin tồn kho
        """
        stmt = (
            select(ProductVariant)
            .where(
                ProductVariant.id.in_(variant_ids),
                ProductVariant.is_active.is_(True),
            )
        )
        result = await self.db.execute(stmt)
        variants = result.scalars().all()

        return [
            {
                "variant_id": str(v.id),
                "sku": v.sku,
                "size": v.size,
                "color": v.color,
                "stock_quantity": v.stock_quantity,
                "in_stock": v.stock_quantity > 0,
            }
            for v in variants
        ]
