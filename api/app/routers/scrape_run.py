from fastapi import APIRouter, status, HTTPException
from app.models.scrape_run import (
    ScrapeRun,
    ScrapeRunView,
    ScrapeRunListResponse,
    ScrapeRunOutput,
    ScrapeRunPage,
    ScrapeRunMiniView,
)
from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from sqlmodel import select, func, col
from app.models.auth import CurrentUserDep
from app.models.common import Paging, FastAPIError
from time import time

scrape_run_router = APIRouter()


@scrape_run_router.post(
    "/projects/{project_id}/scrape_runs",
    response_model=ScrapeRunMiniView,
    tags=["scrape runs"],
)
async def create_scrape_run(
    project_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRunView:
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_run_data = {
        "started_on": int(time()),
        "status": "STARTED",
        "project_id": project_id,
    }
    scrape_run = ScrapeRun.model_validate(scrape_run_data)
    session.add(scrape_run)
    session.commit()
    session.refresh(scrape_run)

    # start scraping task

    scrape_run_view = ScrapeRunMiniView.model_validate(scrape_run.model_dump())
    return scrape_run_view


@scrape_run_router.post(
    "/projects/{project_id}/scrape_runs/{scrape_run_id}/resume",
    response_model=ScrapeRunMiniView,
    tags=["scrape runs"],
)
async def resume_scrape_run(
    project_id,
    scrape_run_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRunView:
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_run = session.exec(
        select(ScrapeRun)
        .where(ScrapeRun.id == scrape_run_id)
        .where(ScrapeRun.project_id == project_id)
    ).first()
    if not scrape_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scrape run not found"
        )
    scrape_run.status = "STARTED"
    scrape_run.ended_on = None
    session.add(scrape_run)
    session.commit()
    session.refresh(scrape_run)

    # start scraping task

    scrape_run_view = ScrapeRunMiniView.model_validate(scrape_run.model_dump())
    return scrape_run_view


@scrape_run_router.get(
    "/projects/{project_id}/scrape_runs/{scrape_run_id}",
    response_model=ScrapeRunView,
    tags=["scrape runs"],
    responses={404: {"model": FastAPIError, "description": "Scrape run not found"}},
)
async def get_scrape_run(
    project_id,
    scrape_run_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRunView:
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_run = session.exec(
        select(ScrapeRun)
        .where(ScrapeRun.id == scrape_run_id)
        .where(ScrapeRun.project_id == project_id)
    ).first()
    if not scrape_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scrape run not found"
        )
    scrape_run_view = ScrapeRunView.model_validate(scrape_run.model_dump())
    scrape_run_view.outputs = session.exec(
        select(ScrapeRunOutput).where(ScrapeRunOutput.scrape_run_id == scrape_run_id)
    ).all()
    scrape_run_view.total_discovered_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id))).where(
            ScrapeRunPage.scrape_run_id == scrape_run_id
        )
    ).one()
    scrape_run_view.total_successful_scraped_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id)))
        .where(ScrapeRunPage.scrape_run_id == scrape_run_id)
        .where(ScrapeRunPage.status == "COMPLETED")
    ).one()
    scrape_run_view.total_failed_scraped_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id)))
        .where(ScrapeRunPage.scrape_run_id == scrape_run_id)
        .where(ScrapeRunPage.status == "FAILED")
    ).one()
    return scrape_run_view


@scrape_run_router.get(
    "/projects/{project_id}/scrape_runs",
    response_model=ScrapeRunListResponse,
    tags=["scrape runs"],
)
async def list_scrape_runs(
    project_id: int,
    current_user: CurrentUserDep,
    session: SessionDep,
    skip: int = 0,
    limit: int = 10,
) -> ScrapeRunListResponse:
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_runs_query = (
        select(ScrapeRun)
        .where(ScrapeRun.project_id == project_id)
        .offset(skip)
        .limit(limit)
    )
    scrape_runs = session.exec(scrape_runs_query).all()
    return ScrapeRunListResponse(
        scrape_runs == scrape_runs, paing=Paging(skip=skip, limit=limit)
    )
