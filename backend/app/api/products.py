"""
Products Router.
Có Redis Cache + Eager Loading (N+1 fix).
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache
from app.services.ws_manager import manager as ws_manager

from app.db.database import get_db
from app.core.dependencies import require_admin
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate, ProductVariantCreate, ProductVariantRead

router = APIRouter()

@router.get("", response_model=dict)
@cache(expire=120, namespace="products")
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: uuid.UUID | None = None,
    gender: str | None = None,
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Lấy danh sách sản phẩm (cached 2 phút) / List products with pagination and filters."""
    conditions = [Product.deleted_at.is_(None), Product.is_active.is_(True)]
    
    if category_id:
        conditions.append(Product.category_id == category_id)
    if gender:
        conditions.append(Product.gender == gender)
    if search:
        conditions.append(Product.title.ilike(f"%{search}%"))
    if min_price is not None:
        conditions.append(Product.base_price >= min_price)
    if max_price is not None:
        conditions.append(Product.base_price <= max_price)
        
    # Count
    count_stmt = select(func.count()).select_from(Product).where(and_(*conditions))
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Fetch — N+1 FIX: Eager load variants và category trong 1 query
    stmt = (
        select(Product)
        .options(
            selectinload(Product.variants),   # Load tất cả variants trong 1 query phụ
            joinedload(Product.category),     # JOIN category trong cùng query
        )
        .where(and_(*conditions))
        .order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    products = result.unique().scalars().all()
    
    return {
        "items": [ProductRead.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/{product_id_or_slug}", response_model=ProductRead)
async def get_product(product_id_or_slug: str, db: AsyncSession = Depends(get_db)):
    """Lấy chi tiết sản phẩm và variants (bằng UUID hoặc slug) / Get product detail with variants by UUID or slug."""
    is_uuid = False
    try:
        val_uuid = uuid.UUID(product_id_or_slug)
        is_uuid = True
    except ValueError:
        is_uuid = False

    if is_uuid:
        condition = (Product.id == val_uuid)
    else:
        condition = (Product.slug == product_id_or_slug)

    stmt = (
        select(Product)
        .options(selectinload(Product.variants), joinedload(Product.category))
        .where(
            condition,
            Product.deleted_at.is_(None),
            Product.is_active.is_(True)
        )
    )
    result = await db.execute(stmt)
    product = result.unique().scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return product

@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Tạo sản phẩm mới (Admin only) / Create product (Admin only)."""
    new_product = Product(
        id=uuid.uuid4(),
        **product_data.model_dump()
    )
    db.add(new_product)
    try:
        from sqlalchemy import exc
        await db.commit()
        # Fetch lại product với đầy đủ relationships (tránh lỗi MissingGreenlet)
        stmt = select(Product).options(
            selectinload(Product.variants),
            joinedload(Product.category)
        ).where(Product.id == new_product.id)
        result = await db.execute(stmt)
        complete_product = result.scalar_one()
        
        # Xóa cache sản phẩm
        await FastAPICache.clear(namespace="products")
        # Broadcast real-time event
        await ws_manager.broadcast({"type": "PRODUCT_CREATED"}, group="admin")
        return complete_product
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên sản phẩm hoặc Slug đã tồn tại. Vui lòng chọn tên khác."
        )

@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Cập nhật sản phẩm (Admin only) / Update product (Admin only)."""
    stmt = select(Product).options(
        selectinload(Product.variants),
        joinedload(Product.category)
    ).where(Product.id == product_id, Product.deleted_at.is_(None))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_dict = product_data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(product, k, v)
        
    db.add(product)
    try:
        from sqlalchemy import exc
        await db.commit()
        await db.refresh(product)
        await FastAPICache.clear(namespace="products")
        return product
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Tên sản phẩm hoặc Slug đã tồn tại."
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Xóa mềm sản phẩm (Admin only) / Soft delete product (Admin only)."""
    stmt = select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.deleted_at = datetime.now(timezone.utc)
    product.is_active = False
    db.add(product)
    await db.commit()
    await FastAPICache.clear(namespace="products")
    return None

@router.post("/{product_id}/variants", response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
async def add_product_variant(
    product_id: uuid.UUID,
    variant_data: ProductVariantCreate,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Thêm variant cho sản phẩm (Admin only) / Add variant to product (Admin only)."""
    # Verify product exists
    stmt = select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_variant = ProductVariant(
        id=uuid.uuid4(),
        product_id=product_id,
        **variant_data.model_dump()
    )
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    return new_variant
