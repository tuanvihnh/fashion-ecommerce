"""
Authentication Router.
Rate-limited để chống brute-force attack.
"""
from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import UserCreate, UserRead, Token, LoginRequest
from app.services.auth_service import AuthService
from app.core.rate_limit import limiter

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Đăng ký tài khoản mới / Register a new account. (Rate limited: 5/min)"""
    auth_service = AuthService(db)
    return await auth_service.register(user_data)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, credentials: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Đăng nhập để nhận JWT token / Login to get JWT token. (Rate limited: 10/min)"""
    auth_service = AuthService(db)
    login_req = LoginRequest(email=credentials.username, password=credentials.password)
    return await auth_service.login(login_req)
