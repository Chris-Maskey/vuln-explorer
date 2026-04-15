import hashlib
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from services.cache import CacheService
from services.upstream import UpstreamService

router = APIRouter(prefix="/api/v1", tags=["proxy"])
cache = CacheService()
upstream = UpstreamService()


class QueryRequest(BaseModel):
    query: Dict[str, Any]


class BatchQueryRequest(BaseModel):
    queries: List[Dict[str, Any]]


@router.get("/health")
async def health():
    return {"status": "ok", "redis": "connected"}


@router.get("/vulns/{cve_id}")
async def get_vuln(cve_id: str):
    """Get vulnerability by CVE/ID - checks cache first."""
    cache_key = f"osv:vuln:{cve_id}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    result = await upstream.query_vuln(cve_id)
    if result:
        await cache.set(cache_key, result)
        return result
    raise HTTPException(status_code=404, detail="Vulnerability not found")


@router.post("/querybatch")
async def query_batch(request: BatchQueryRequest):
    """Batch query OSV - checks cache first."""
    cache_key = f"osv:querybatch:{hashlib.sha256(str(request.queries).encode()).hexdigest()[:16]}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    result = await upstream.querybatch(request.queries)
    if result:
        await cache.set(cache_key, result)
        return result
    return {"results": []}


@router.get("/advisories/{advisory_id}")
async def get_advisory(advisory_id: str):
    """Get deps.dev advisory - checks cache first."""
    cache_key = f"depsdev:advisory:{advisory_id}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    result = await upstream.get_advisory(advisory_id)
    if result:
        await cache.set(cache_key, result)
        return result
    raise HTTPException(status_code=404, detail="Advisory not found")