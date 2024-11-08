from fastapi import APIRouter, status, HTTPException
from app.models.project import (
    Project,
    ProjectUpdate,
    ProjectCreate,
    ProjectListResponse,
)
from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from sqlmodel import select
from app.models.auth import CurrentUserDep
from app.models.common import IdResponse, Paging

project_router = APIRouter()


@project_router.post("/projects", response_model=Project, tags=["projects"])
async def create_project(
    project_create: ProjectCreate, current_user: CurrentUserDep, session: SessionDep
) -> Project:
    project_data = project_create.model_dump(exclude_unset=True)
    project_data["user_id"] = current_user.id
    project = Project.model_validate(project_data)
    session.add(project)
    session.commit()
    session.refresh(project)
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
        return db_project


@project_router.get("/projects", response_model=None, tags=["projects"])
async def list_projects(
    current_user: CurrentUserDep, session: SessionDep, skip: int = 0, limit: int = 10
) -> dict:
    statement = (
        select(Project)
        .where(Project.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    projects = session.exec(statement).all()
    return ProjectListResponse(projects=projects, paging=Paging(skip=skip, limit=limit))


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
