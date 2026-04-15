from fastapi import FastAPI
from routers import proxy

app = FastAPI(title="Vuln Explorer API", version="1.0.0")
app.include_router(proxy.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)