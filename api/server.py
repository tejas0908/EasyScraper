from fastapi import FastAPI
from app.routers.auth import auth_router

app = FastAPI()
app.include_router(auth_router)


@app.get("/health")
async def root():
    return {"status": True}
