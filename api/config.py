from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    osv_api_url: str = "https://api.osv.dev/v1"
    depsdev_api_url: str = "https://public.deps.dev/api/v3"
    cache_ttl_seconds: int = 86400  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()