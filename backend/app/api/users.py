"""
Users Router.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """Lấy thông tin profile của user hiện tại / Get current user profile."""
    return current_user

@router.put("/me", response_model=UserRead)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Cập nhật thông tin user hiện tại / Update current user profile."""
    update_data = user_data.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
        
    for field, value in update_data.items():
        setattr(current_user, field, value)
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete user hiện tại / Soft delete current user."""
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False
    db.add(current_user)
    await db.commit()
    return None
