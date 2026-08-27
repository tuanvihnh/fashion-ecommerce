"""
Categories Router — Quản lý danh mục sản phẩm.
Có Redis Cache cho endpoint GET (5 phút TTL).
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache

from app.db.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("", response_model=List[CategoryRead])
@cache(expire=300, namespace="categories")
async def get_categories(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Lấy danh sách tất cả danh mục / Get all categories."""
    stmt = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    if not include_inactive:
        stmt = stmt.where(Category.is_active.is_(True))
        
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Tạo danh mục mới / Create new category."""
    new_category = Category(**category_in.model_dump())
    db.add(new_category)
    try:
        await db.commit()
        await db.refresh(new_category)
        # Xóa cache danh mục khi có thay đổi
        await FastAPICache.clear(namespace="categories")
        return new_category
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên danh mục hoặc slug đã tồn tại (Category name or slug already exists)"
        )


@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Cập nhật danh mục / Update a category."""
    stmt = select(Category).where(Category.id == category_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
        
    try:
        await db.commit()
        await db.refresh(category)
        return category
    except exc.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên danh mục hoặc slug đã tồn tại (Category name or slug already exists)"
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Xóa danh mục / Delete a category."""
    stmt = select(Category).where(Category.id == category_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        
    await db.delete(category)
    await db.commit()
