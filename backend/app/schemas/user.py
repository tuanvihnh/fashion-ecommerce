"""
User schemas.
Các schema liên quan đến User.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Mật khẩu (ít nhất 8 ký tự)")
    full_name: str
    phone: Optional[str] = None


class UserRead(BaseModel):
    """Schema for reading user details."""
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Schema for updating user details."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


class Token(BaseModel):
    """Schema for returning access token."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: str
    exp: int


class LoginRequest(BaseModel):
    """Schema for login request (JSON body alternative to form-data)."""
    email: EmailStr
    password: str
