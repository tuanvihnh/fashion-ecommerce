"""
Fashion E-commerce API — Entry Point.

Khởi tạo FastAPI app, cấu hình middleware, Redis cache, Rate Limiter và đăng ký routers.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os

from redis import asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from app.core.config import settings
from app.core.rate_limit import limiter
from app.api import auth, users, products, orders, inventory, uploads, categories, payments

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fashion_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup & shutdown events."""
    # --- Startup ---
    os.makedirs("uploads", exist_ok=True)

    # Kết nối Redis cho cache
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
        FastAPICache.init(RedisBackend(redis_client), prefix="fashion-cache")
        logger.info("✅ Redis cache connected successfully")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available, caching disabled: {e}")

    yield

    # --- Shutdown ---
    logger.info("🔌 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API Backend cho hệ thống E-commerce thời trang cao cấp",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- Rate Limiter ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Mount Static Files ---
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{API_V1_PREFIX}/users", tags=["Users"])
app.include_router(categories.router, prefix=f"{API_V1_PREFIX}/categories", tags=["Categories"])
app.include_router(products.router, prefix=f"{API_V1_PREFIX}/products", tags=["Products"])
app.include_router(orders.router, prefix=f"{API_V1_PREFIX}/orders", tags=["Orders"])
app.include_router(inventory.router, prefix=f"{API_V1_PREFIX}/inventory", tags=["Inventory"])
app.include_router(uploads.router, prefix=f"{API_V1_PREFIX}/uploads", tags=["Uploads"])
app.include_router(payments.router, prefix=f"{API_V1_PREFIX}/payments", tags=["Payments"])


# --- Health Check mở rộng ---
from app.services.ws_manager import manager as ws_manager
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/admin")
async def websocket_admin_endpoint(websocket: WebSocket):
    # Lý tưởng nhất là auth token qua query param hoặc header (cần custom middleware cho ws)
    # Tạm thời chấp nhận kết nối cho Dashboard realtime
    await ws_manager.connect(websocket, group="admin")
    try:
        while True:
            # Chờ nhận tin nhắn (ping/pong giữ kết nối)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, group="admin")

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — kiểm tra DB + Redis."""
    health = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "database": "unknown",
        "redis": "unknown",
    }

    # Check DB
    try:
        from app.db.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception:
        health["database"] = "disconnected"
        health["status"] = "degraded"

    # Check Redis
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL)
        pong = await redis_client.ping()
        health["redis"] = "connected" if pong else "disconnected"
        await redis_client.close()
    except Exception:
        health["redis"] = "disconnected"
        health["status"] = "degraded"

    return health
