from fastapi import FastAPI
from app.routers.auth import auth_router
from app.routers.project import project_router
from app.routers.page_template import page_template_router
from app.routers.scrape_rule import scrape_rule_router
import app.celery.celery
from app.celery.tasks import update_project_name

tags_metadata = [
    {
        "name": "auth",
        "description": "Authentication endpoints for user login and registration",
    },
    {
        "name": "projects",
        "description": "Endpoints for managing scraping projects and their configurations",
    },
    {"name": "page templates", "description": "Endpoints for managing page templates"},
    {"name": "scrape rules", "description": "Endpoints for managing scrape rules"},
    {
        "name": "miscellaneous",
        "description": "Endpoints for managing scraping projects and their configurations",
    },
]

app = FastAPI(
    title="EasyScraper API",
    description="",
    summary="API for EasyScraper",
    version="1.0.0",
    redoc_url="/docs",
    docs_url=None,
    openapi_tags=tags_metadata,
)
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(page_template_router)
app.include_router(scrape_rule_router)


@app.get("/health", tags=["miscellaneous"])
async def health():
    return {"status": True}


@app.get("/celery-test/{project_id}", tags=["miscellaneous"])
async def celery_test(project_id):
    response = update_project_name.delay(project_id).get(timeout=5)
    return response
