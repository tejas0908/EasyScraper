import math
from typing import Annotated

from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from app.models.auth import CurrentUserDep
from app.models.common import (
    FastAPIError,
    IdResponse,
    PagingResponse,
    PagingWithSortRequest,
    paging_with_sort,
)
from app.models.seed_page import (
    SeedPage,
    SeedPageCreate,
    SeedPageListResponse,
    SeedPageUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import col, func, select

seed_page_router = APIRouter()


@seed_page_router.post(
    "/projects/{project_id}/seed_pages",
    response_model=SeedPage,
    tags=["seed pages"],
)
async def create_seed_page(
    project_id,
    seed_page_create: SeedPageCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> SeedPage:
    """
    Creates a seed page from where the scraping will start
    """
    check_if_project_belongs_to_user(project_id, current_user, session)
    seed_page_data = seed_page_create.model_dump(exclude_unset=True)
    seed_page_data["project_id"] = project_id
    seed_page = SeedPage.model_validate(seed_page_data)
    session.add(seed_page)
    session.commit()
    session.refresh(seed_page)
    return seed_page


@seed_page_router.get(
    "/projects/{project_id}/seed_pages/{seed_page_id}",
    response_model=SeedPage,
    tags=["seed pages"],
    responses={404: {"model": FastAPIError, "description": "SeedPage not found"}},
)
async def get_seed_page(
    project_id, seed_page_id, current_user: CurrentUserDep, session: SessionDep
) -> SeedPage:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(SeedPage)
        .where(SeedPage.id == seed_page_id)
        .where(SeedPage.project_id == project_id)
    )
    seed_page = session.exec(statement).one_or_none()
    if seed_page is None:
        raise HTTPException(
            detail="Invalid SeedPage ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return seed_page


@seed_page_router.put(
    "/projects/{project_id}/seed_pages/{seed_page_id}",
    response_model=SeedPage,
    tags=["seed pages"],
    responses={404: {"model": FastAPIError, "description": "SeedPage not found"}},
)
async def put_seed_page(
    project_id,
    seed_page_id,
    seed_page_update: SeedPageUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> SeedPage:
    check_if_project_belongs_to_user(project_id, current_user, session)
    seed_page_data = seed_page_update.model_dump(exclude_unset=True)
    statement = (
        select(SeedPage)
        .where(SeedPage.id == seed_page_id)
        .where(SeedPage.project_id == project_id)
    )
    db_seed_page = session.exec(statement).one_or_none()
    if db_seed_page is None:
        raise HTTPException(
            detail="Invalid SeedPage ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        db_seed_page.sqlmodel_update(seed_page_data)
        session.add(db_seed_page)
        session.commit()
        session.refresh(db_seed_page)
        return db_seed_page


@seed_page_router.get(
    "/projects/{project_id}/seed_pages",
    response_model=SeedPageListResponse,
    tags=["seed pages"],
)
async def list_seed_pages(
    project_id,
    current_user: CurrentUserDep,
    session: SessionDep,
    paging_with_sort: Annotated[PagingWithSortRequest, Depends(paging_with_sort)],
) -> SeedPageListResponse:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(SeedPage)
        .where(SeedPage.project_id == project_id)
        .order_by(
            getattr(
                getattr(SeedPage, paging_with_sort.sort_field),
                paging_with_sort.sort_direction,
            )()
        )
        .offset(paging_with_sort.page * paging_with_sort.limit)
        .limit(paging_with_sort.limit)
    )
    seed_pages = session.exec(statement).all()
    total_records = session.exec(
        select(func.count(col(SeedPage.id))).where(SeedPage.project_id == project_id)
    ).one()
    total_pages = math.ceil(total_records / paging_with_sort.limit)
    return SeedPageListResponse(
        seed_pages=seed_pages,
        paging=PagingResponse(
            page=paging_with_sort.page,
            limit=paging_with_sort.limit,
            next_page=paging_with_sort.page < total_pages - 1,
            total_pages=total_pages,
            total_records=total_records,
        ),
    )


@seed_page_router.delete(
    "/projects/{project_id}/seed_pages/{seed_page_id}",
    response_model=IdResponse,
    tags=["seed pages"],
    responses={404: {"model": FastAPIError, "description": "SeedPage not found"}},
)
async def delete_seed_page(
    project_id, seed_page_id, current_user: CurrentUserDep, session: SessionDep
) -> IdResponse:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(SeedPage)
        .where(SeedPage.id == seed_page_id)
        .where(SeedPage.project_id == project_id)
    )
    seed_page = session.exec(statement).one_or_none()
    if seed_page is None:
        raise HTTPException(
            detail="Invalid SeedPage ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        session.delete(seed_page)
        session.commit()
        return IdResponse(id=seed_page_id)
