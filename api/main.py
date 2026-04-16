from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import proxy
from config import settings

app = FastAPI(title="Vuln Explorer API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(proxy.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
