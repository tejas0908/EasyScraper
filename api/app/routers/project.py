import math
from typing import Annotated

from app.celery.tasks import set_favicon_url
from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from app.models.auth import CurrentUserDep
from app.models.common import (
    IdResponse,
    PagingResponse,
    PagingWithSortRequest,
    paging_with_sort,
)
from app.models.project import (
    Project,
    ProjectCreate,
    ProjectListResponse,
    ProjectUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import col, func, select

project_router = APIRouter()


@project_router.post("/projects", response_model=Project, tags=["projects"])
async def create_project(
    project_create: ProjectCreate, current_user: CurrentUserDep, session: SessionDep
) -> Project:
    project_data = project_create.model_dump(exclude_unset=True)
    project_data["user_id"] = current_user.id
    project_data["website_favicon_url"] = None
    project = Project.model_validate(project_data)
    session.add(project)
    session.commit()
    session.refresh(project)
    set_favicon_url.delay(project.id, project.website_url)
    return project


@project_router.get("/projects/{project_id}", response_model=Project, tags=["projects"])
async def get_project(
    project_id, current_user: CurrentUserDep, session: SessionDep
) -> Project:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(Project)
        .where(Project.id == project_id)
        .where(Project.user_id == current_user.id)
    )
    project = session.exec(statement).one_or_none()
    if project is None:
        raise HTTPException(
            detail="Invalid Project ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        return project


@project_router.put("/projects/{project_id}", response_model=Project, tags=["projects"])
async def put_project(
    project_id,
    project: ProjectUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> Project:
    check_if_project_belongs_to_user(project_id, current_user, session)
    project_data = project.model_dump(exclude_unset=True)
    statement = (
        select(Project)
        .where(Project.id == project_id)
        .where(Project.user_id == current_user.id)
    )
    db_project = session.exec(statement).one_or_none()
    if db_project is None:
        raise HTTPException(
            detail="Invalid Project ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        db_project.sqlmodel_update(project_data)
        session.add(db_project)
        session.commit()
        session.refresh(db_project)
        set_favicon_url.delay(db_project.id, db_project.website_url)
        return db_project


@project_router.get("/projects", response_model=None, tags=["projects"])
async def list_projects(
    current_user: CurrentUserDep,
    session: SessionDep,
    paging_with_sort: Annotated[PagingWithSortRequest, Depends(paging_with_sort)],
) -> dict:
    statement = (
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(
            getattr(
                getattr(Project, paging_with_sort.sort_field),
                paging_with_sort.sort_direction,
            )()
        )
        .offset(paging_with_sort.page * paging_with_sort.limit)
        .limit(paging_with_sort.limit)
    )
    projects = session.exec(statement).all()
    total_records = session.exec(
        select(func.count(col(Project.id))).where(Project.user_id == current_user.id)
    ).one()
    total_pages = math.ceil(total_records / paging_with_sort.limit)
    return ProjectListResponse(
        projects=projects,
        paging=PagingResponse(
            page=paging_with_sort.page,
            limit=paging_with_sort.limit,
            next_page=paging_with_sort.page < total_pages - 1,
            total_pages=total_pages,
            total_records=total_records,
        ),
    )


@project_router.delete("/projects/{project_id}", response_model=None, tags=["projects"])
async def delete_project(
    project_id, current_user: CurrentUserDep, session: SessionDep
) -> Project:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(Project)
        .where(Project.id == project_id)
        .where(Project.user_id == current_user.id)
    )
    project = session.exec(statement).one_or_none()
    if project is None:
        raise HTTPException(
            detail="Invalid Project ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        session.delete(project)
        session.commit()
        return IdResponse(id=project_id)
