"""
Authentication Service — xử lý đăng ký và đăng nhập.
Tách biệt business logic khỏi router (Separation of Concerns).
"""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, Token, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """Service xử lý authentication logic."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, user_data: UserCreate) -> UserRead:
        """Đăng ký tài khoản mới.

        - Kiểm tra email đã tồn tại chưa
        - Hash password trước khi lưu
        - Trả về UserRead (không có password)
        """
        # Check duplicate email
        stmt = select(User).where(User.email == user_data.email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email đã được sử dụng / Email already registered",
            )

        # Create new user
        new_user = User(
            id=uuid.uuid4(),
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name,
            phone=user_data.phone,
            role=UserRole.CUSTOMER,
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)

        return UserRead.model_validate(new_user)

    async def login(self, credentials: LoginRequest) -> Token:
        """Đăng nhập và trả về JWT access token.

        - Verify email tồn tại và chưa bị soft-delete
        - Verify password đúng
        - Generate JWT token với user_id là subject
        """
        stmt = select(User).where(
            User.email == credentials.email,
            User.deleted_at.is_(None),  # Không cho phép user đã xóa đăng nhập
        )
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email hoặc mật khẩu không đúng / Invalid credentials",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản đã bị vô hiệu hóa / Account is deactivated",
            )

        # Generate JWT token
        access_token = create_access_token(data={"sub": str(user.id)})
        return Token(access_token=access_token, token_type="bearer")
