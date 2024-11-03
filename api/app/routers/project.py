from fastapi import APIRouter, status, HTTPException
from app.models.project import Project, ProjectUpdate
from app.db.engine import SessionDep
from sqlmodel import select
from app.models.auth import CurrentUserDep
from app.models.paging import Paging

project_router = APIRouter()


@project_router.post("/projects", response_model=Project)
async def create_project(
    project: Project, current_user: CurrentUserDep, session: SessionDep
) -> Project:
    project.user_id = current_user.id
    project = Project.model_validate(project)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@project_router.get("/projects/{project_id}", response_model=None)
async def get_project(
    project_id, current_user: CurrentUserDep, session: SessionDep
) -> Project:
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


@project_router.put("/projects/{project_id}", response_model=None)
async def put_project(
    project_id,
    project: ProjectUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> Project:
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


@project_router.get("/projects", response_model=None)
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
    return {"projects": projects, "paging": Paging(skip=skip, limit=limit)}


@project_router.delete("/projects/{project_id}", response_model=None)
async def delete_project(
    project_id, current_user: CurrentUserDep, session: SessionDep
) -> Project:
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
        return {"id": project_id}
