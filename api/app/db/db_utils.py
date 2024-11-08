from sqlmodel import select
from app.models.project import Project
from app.models.page_template import PageTemplate
from app.models.auth import User
from fastapi import HTTPException, status


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


def check_if_page_template_belongs_to_project(page_template_id, project_id, session):
    statement = (
        select(PageTemplate)
        .where(PageTemplate.id == page_template_id)
        .where(PageTemplate.project_id == project_id)
    )
    page_template = session.exec(statement).one_or_none()
    if page_template is None:
        raise HTTPException(
            detail="PageTemplate not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND,
        )


def check_if_user_exists(username, session):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).one_or_none()
    if user:
        raise HTTPException(
            detail="User already exists",
            status_code=status.HTTP_409_CONFLICT,
        )
