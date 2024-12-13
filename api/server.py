import app.celery.celery
from app.routers.auth import auth_router
from app.routers.page_template import page_template_router
from app.routers.project import project_router
from app.routers.scrape_rule import scrape_rule_router
from app.routers.scrape_run import scrape_run_router
from app.routers.seed_page import seed_page_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    {"name": "seed pages", "description": "Endpoints for managing seed pages"},
    {"name": "scrape runs", "description": "Endpoints for managing scrape runs"},
]

app = FastAPI(
    title="EasyScraper API",
    description="",
    summary="API for EasyScraper",
    version="1.2.0",
    redoc_url="/docs",
    docs_url=None,
    openapi_tags=tags_metadata,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(page_template_router)
app.include_router(scrape_rule_router)
app.include_router(seed_page_router)
app.include_router(scrape_run_router)


@app.get("/health", tags=["miscellaneous"])
async def health():
    return {"status": True}
