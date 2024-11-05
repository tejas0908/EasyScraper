from fastapi import APIRouter, status, HTTPException
from app.models.page_template import PageTemplate, PageTemplateUpdate
from app.models.project import Project
from app.db.engine import SessionDep
from sqlmodel import select
from app.models.auth import CurrentUserDep
from app.models.paging import Paging

page_template_router = APIRouter()


def check_if_project_belongs_to_user(project_id, current_user, session):
    project_statement = (
        select(Project)
        .where(Project.id == project_id)
        .where(Project.user_id == current_user.id)
    )
    project = session.exec(project_statement).one_or_none()
    if project is None:
        raise HTTPException(
            detail="Project not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND,
        )


@page_template_router.post(
    "/projects/{project_id}/page_templates", response_model=PageTemplate
)
async def create_page_template(
    project_id,
    page_template: PageTemplate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> PageTemplate:
    check_if_project_belongs_to_user(project_id, current_user, session)
    page_template.project_id = project_id
    page_template = PageTemplate.model_validate(page_template)
    session.add(page_template)
    session.commit()
    session.refresh(page_template)
    return page_template


@page_template_router.get(
    "/projects/{project_id}/page_templates/{page_template_id}", response_model=None
)
async def get_page_template(
    project_id, page_template_id, current_user: CurrentUserDep, session: SessionDep
) -> PageTemplate:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(PageTemplate)
        .where(PageTemplate.id == page_template_id)
        .where(PageTemplate.project_id == project_id)
    )
    page_template = session.exec(statement).one_or_none()
    if page_template is None:
        raise HTTPException(
            detail="Invalid PageTemplate ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return page_template


@page_template_router.put(
    "/projects/{project_id}/page_templates/{page_template_id}", response_model=None
)
async def put_page_template(
    project_id,
    page_template_id,
    page_template: PageTemplateUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> PageTemplate:
    check_if_project_belongs_to_user(project_id, current_user, session)
    page_template_data = page_template.model_dump(exclude_unset=True)
    statement = (
        select(PageTemplate)
        .where(PageTemplate.id == page_template_id)
        .where(PageTemplate.project_id == project_id)
    )
    db_page_template = session.exec(statement).one_or_none()
    if db_page_template is None:
        raise HTTPException(
            detail="Invalid PageTemplate ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        db_page_template.sqlmodel_update(page_template_data)
        session.add(db_page_template)
        session.commit()
        session.refresh(db_page_template)
        return db_page_template


@page_template_router.get("/projects/{project_id}/page_templates", response_model=None)
async def list_page_templates(
    project_id,
    current_user: CurrentUserDep,
    session: SessionDep,
    skip: int = 0,
    limit: int = 10,
) -> dict:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(PageTemplate)
        .where(PageTemplate.project_id == project_id)
        .offset(skip)
        .limit(limit)
    )
    page_templates = session.exec(statement).all()
    return {"page_templates": page_templates, "paging": Paging(skip=skip, limit=limit)}


@page_template_router.delete(
    "/projects/{project_id}/page_templates/{page_template_id}", response_model=None
)
async def delete_page_template(
    project_id, page_template_id, current_user: CurrentUserDep, session: SessionDep
) -> PageTemplate:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(PageTemplate)
        .where(PageTemplate.id == page_template_id)
        .where(PageTemplate.project_id == project_id)
    )
    page_template = session.exec(statement).one_or_none()
    if page_template is None:
        raise HTTPException(
            detail="Invalid PageTemplate ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    else:
        session.delete(page_template)
        session.commit()
        return {"id": page_template_id}
