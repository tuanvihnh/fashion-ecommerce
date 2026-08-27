"""
Database connection configuration.
Kết nối PostgreSQL qua AsyncSession (SQLAlchemy 2.0 Async).
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

# Async engine — sử dụng asyncpg driver
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Kiểm tra kết nối trước khi sử dụng
)

# Session factory — mỗi request sẽ nhận một session riêng biệt
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Cho phép truy cập attributes sau commit
)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    """Dependency injection: cấp phát DB session cho mỗi request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
