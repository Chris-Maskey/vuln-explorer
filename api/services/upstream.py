import httpx
from typing import Optional, Dict, Any
from config import settings


class UpstreamService:
    def __init__(self):
        self.osv_url = settings.osv_api_url
        self.depsdev_url = settings.depsdev_api_url
    
    async def query_vuln(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """Query OSV for vulnerability details by CVE ID."""
        url = f"{self.osv_url}/vulns/{cve_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()
            return None
    
    async def query(self, query: dict) -> Optional[Dict[str, Any]]:
        """Query OSV with custom query."""
        url = f"{self.osv_url}/query"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=query)
            if response.status_code == 200:
                return response.json()
            return None
    
    async def querybatch(self, queries: list) -> Optional[Dict[str, Any]]:
        """Batch query OSV."""
        url = f"{self.osv_url}/querybatch"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"queries": queries})
            if response.status_code == 200:
                return response.json()
            return None
    
    async def get_advisory(self, advisory_id: str) -> Optional[Dict[str, Any]]:
        """Query deps.dev for advisory info."""
        url = f"{self.depsdev_url}/advisories/{advisory_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()
            return None