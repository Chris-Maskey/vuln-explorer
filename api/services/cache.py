import json
import redis.asyncio as redis
from typing import Optional
from config import settings


class CacheService:
    def __init__(self):
        self.redis_url = settings.redis_url
        self.ttl = settings.cache_ttl_seconds
    
    async def _get_client(self):
        return redis.from_url(self.redis_url, decode_responses=True)
    
    async def get(self, key: str) -> Optional[dict]:
        client = await self._get_client()
        try:
            value = await client.get(key)
            if value:
                return json.loads(value)
            return None
        finally:
            await client.aclose()
    
    async def set(self, key: str, value: dict) -> None:
        client = await self._get_client()
        try:
            await client.setex(key, self.ttl, json.dumps(value))
        finally:
            await client.aclose()