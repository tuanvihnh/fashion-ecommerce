"""
Security module for password hashing and JWT management.
Module bảo mật: băm mật khẩu và quản lý JWT.
"""
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.core.config import settings

# Setup Passlib with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """
    Hash a plaintext password using bcrypt.
    Băm mật khẩu văn bản thô bằng bcrypt.
    """
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify a plaintext password against a hashed one.
    Kiểm tra mật khẩu văn bản thô so với mật khẩu đã băm.
    """
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a new JWT access token.
    Tạo token truy cập JWT mới.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({
        "exp": expire,           # Expiration time
        "iat": now,              # Issued at
        "jti": str(uuid.uuid4()) # JWT ID (can be used for blacklisting)
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    Kiểm tra và giải mã token JWT.
    
    Raises HTTPException 401 if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
