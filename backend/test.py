import asyncio
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis.asyncio import Redis
async def main():
    redis = Redis.from_url('redis://redis:6379/0')
    FastAPICache.init(RedisBackend(redis), prefix='fashion-cache')
    await FastAPICache.clear(namespace='products')
    print('Cleared')
    await redis.close()
asyncio.run(main())
