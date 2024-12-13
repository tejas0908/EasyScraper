import math
from time import time
from typing import Annotated

from app.celery.tasks import scrape_master, scrape_page_for_test
from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from app.models.auth import CurrentUserDep
from app.models.common import (
    FastAPIError,
    PagingResponse,
    PagingWithSortRequest,
    paging_with_sort,
)
from app.models.scrape_run import (
    ScrapeRun,
    ScrapeRunListResponse,
    ScrapeRunMiniView,
    ScrapeRunOutput,
    ScrapeRunOutputView,
    ScrapeRunPage,
    ScrapeRunView,
    ScrapeTestRequest,
    ScrapeTestResponse,
)
from app.util import get_file_from_minio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlmodel import col, func, select

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
    """
    Trigger a scrape run to start scraping
    """
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_run_data = {
        "started_on": int(time()),
        "status": "STARTED",
        "project_id": project_id,
        "stage": "CREATED",
    }
    scrape_run = ScrapeRun.model_validate(scrape_run_data)
    session.add(scrape_run)
    session.commit()
    session.refresh(scrape_run)
    scrape_master.delay(project_id, scrape_run.id, resume=False)
    scrape_run_view = ScrapeRunMiniView.model_validate(scrape_run.model_dump())
    return scrape_run_view


def populate_scrape_run(scrape_run_view: ScrapeRunView, session):
    scrape_run_view.outputs = session.exec(
        select(ScrapeRunOutput).where(
            ScrapeRunOutput.scrape_run_id == scrape_run_view.id
        )
    ).all()
    scrape_run_view.total_discovered_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id))).where(
            ScrapeRunPage.scrape_run_id == scrape_run_view.id
        )
    ).one()
    scrape_run_view.total_successful_scraped_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id)))
        .where(ScrapeRunPage.scrape_run_id == scrape_run_view.id)
        .where(ScrapeRunPage.status == "COMPLETED")
    ).one()
    scrape_run_view.total_failed_scraped_pages = session.exec(
        select(func.count(col(ScrapeRunPage.id)))
        .where(ScrapeRunPage.scrape_run_id == scrape_run_view.id)
        .where(ScrapeRunPage.status == "FAILED")
    ).one()
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
    scrape_run_view = populate_scrape_run(scrape_run_view, session)
    return scrape_run_view


@scrape_run_router.get(
    "/projects/{project_id}/scrape_runs",
    response_model=ScrapeRunListResponse,
    tags=["scrape runs"],
)
async def list_scrape_runs(
    project_id,
    current_user: CurrentUserDep,
    session: SessionDep,
    paging_with_sort: Annotated[PagingWithSortRequest, Depends(paging_with_sort)],
) -> ScrapeRunListResponse:
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_runs_query = (
        select(ScrapeRun)
        .where(ScrapeRun.project_id == project_id)
        .order_by(
            getattr(
                getattr(ScrapeRun, paging_with_sort.sort_field),
                paging_with_sort.sort_direction,
            )()
        )
        .offset(paging_with_sort.page * paging_with_sort.limit)
        .limit(paging_with_sort.limit)
    )
    scrape_runs = session.exec(scrape_runs_query).all()
    total_records = session.exec(
        select(func.count(col(ScrapeRun.id))).where(ScrapeRun.project_id == project_id)
    ).one()
    total_pages = math.ceil(total_records / paging_with_sort.limit)
    scrape_run_views = []
    for scrape_run in scrape_runs:
        scrape_run_view = ScrapeRunView.model_validate(scrape_run.model_dump())
        scrape_run_view = populate_scrape_run(scrape_run_view, session)
        scrape_run_views.append(scrape_run_view)
    return ScrapeRunListResponse(
        scrape_runs=scrape_run_views,
        paging=PagingResponse(
            page=paging_with_sort.page,
            limit=paging_with_sort.limit,
            next_page=paging_with_sort.page < total_pages - 1,
            total_pages=total_pages,
            total_records=total_records,
        ),
    )


@scrape_run_router.post(
    "/projects/{project_id}/scrape_test",
    response_model=ScrapeTestResponse,
    tags=["scrape runs"],
)
async def scrape_test(
    project_id,
    scrape_test_request: ScrapeTestRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeTestResponse:
    """
    Test the scraping for a specific url given the page template
    """
    check_if_project_belongs_to_user(project_id, current_user, session)

    scrape_result = scrape_page_for_test.delay(
        project_id, scrape_test_request.page_template_id, scrape_test_request.url
    ).get()

    return ScrapeTestResponse(output=scrape_result)


@scrape_run_router.get(
    "/projects/{project_id}/scrape_runs/{scrape_run_id}/outputs/{scrape_run_output_id}/download",
    tags=["scrape runs"],
    responses={
        404: {"model": FastAPIError, "description": "Scrape run output not found"}
    },
    response_class=FileResponse,
)
async def download_scrape_run_output(
    project_id,
    scrape_run_id,
    scrape_run_output_id,
    current_user: CurrentUserDep,
    session: SessionDep,
):
    """
    Download the scrape output file
    """
    check_if_project_belongs_to_user(project_id, current_user, session)
    scrape_run_output = session.exec(
        select(ScrapeRunOutput)
        .where(ScrapeRunOutput.id == scrape_run_output_id)
        .where(ScrapeRunOutput.scrape_run_id == scrape_run_id)
    ).first()
    if not scrape_run_output:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scrape run output not found"
        )

    file_name = scrape_run_output.file_url.split("/")[-1]
    file_path = get_file_from_minio(scrape_run_output.file_url)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found in MinIO"
        )

    return FileResponse(
        file_path, media_type="application/octet-stream", filename=file_name
    )
