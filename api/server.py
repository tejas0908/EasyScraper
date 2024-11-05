from fastapi import FastAPI
from app.routers.auth import auth_router
from app.routers.project import project_router
from app.routers.page_template import page_template_router
import app.celery.celery
from app.celery.tasks import update_project_name

app = FastAPI()
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(page_template_router)


@app.get("/health")
async def root():
    return {"status": True}


@app.get("/celery-test/{project_id}")
async def celery_test(project_id):
    response = update_project_name.delay(project_id).get(timeout=5)
    return response
