from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    osv_api_url: str = "https://api.osv.dev/v1"
    depsdev_api_url: str = "https://api.deps.dev/v3"
    cache_ttl_seconds: int = 86400
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"


settings = Settings()
