"""
Application configuration — load từ biến môi trường (.env).
Sử dụng pydantic-settings để type-safe config.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cấu hình ứng dụng, tự động đọc từ file .env."""

    # --- App ---
    APP_NAME: str = "Fashion E-commerce API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fashion_ecommerce"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/fashion_ecommerce"

    # --- JWT ---
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # --- VNPay ---
    VNPAY_TMN_CODE: str = "MOCK_TMN_CODE"
    VNPAY_HASH_SECRET: str = "MOCK_HASH_SECRET"
    VNPAY_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_RETURN_URL: str = "http://localhost:8000/api/v1/payments/vnpay_return"

    # --- Redis ---
    REDIS_URL: str = "redis://redis:6379"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Singleton pattern — tránh đọc .env mỗi lần gọi."""
    return Settings()


settings = get_settings()
