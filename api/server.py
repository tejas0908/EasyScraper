from fastapi import FastAPI
from app.routers.auth import auth_router
from app.routers.project import project_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(project_router)


@app.get("/health")
async def root():
    return {"status": True}
