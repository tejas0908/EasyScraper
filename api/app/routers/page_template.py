from fastapi import APIRouter, status, HTTPException, Depends
from app.models.page_template import (
    PageTemplate,
    PageTemplateUpdate,
    PageTemplateCreate,
    PageTemplateListResponse,
)
from app.db.db_utils import check_if_project_belongs_to_user
from app.db.engine import SessionDep
from sqlmodel import select
from app.models.auth import CurrentUserDep
from app.models.common import (
    PagingResponse,
    FastAPIError,
    IdResponse,
    PagingWithSortRequest,
    paging_with_sort,
)
from sqlmodel import select, func, col
import math
from typing import Annotated

page_template_router = APIRouter()


@page_template_router.post(
    "/projects/{project_id}/page_templates",
    response_model=PageTemplate,
    tags=["page templates"],
)
async def create_page_template(
    project_id,
    page_template_create: PageTemplateCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> PageTemplate:
    check_if_project_belongs_to_user(project_id, current_user, session)
    page_template_data = page_template_create.model_dump(exclude_unset=True)
    page_template_data["project_id"] = project_id
    page_template = PageTemplate.model_validate(page_template_data)
    session.add(page_template)
    session.commit()
    session.refresh(page_template)
    return page_template


@page_template_router.get(
    "/projects/{project_id}/page_templates/{page_template_id}",
    response_model=PageTemplate,
    tags=["page templates"],
    responses={404: {"model": FastAPIError, "description": "PageTemplate not found"}},
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
    "/projects/{project_id}/page_templates/{page_template_id}",
    response_model=PageTemplate,
    tags=["page templates"],
    responses={404: {"model": FastAPIError, "description": "PageTemplate not found"}},
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


@page_template_router.get(
    "/projects/{project_id}/page_templates",
    response_model=PageTemplateListResponse,
    tags=["page templates"],
)
async def list_page_templates(
    project_id,
    current_user: CurrentUserDep,
    session: SessionDep,
    paging_with_sort: Annotated[PagingWithSortRequest, Depends(paging_with_sort)],
) -> dict:
    check_if_project_belongs_to_user(project_id, current_user, session)
    statement = (
        select(PageTemplate)
        .where(PageTemplate.project_id == project_id)
        .order_by(
            getattr(
                getattr(PageTemplate, paging_with_sort.sort_field),
                paging_with_sort.sort_direction,
            )()
        )
        .offset(paging_with_sort.page * paging_with_sort.limit)
        .limit(paging_with_sort.limit)
    )
    total_records = session.exec(
        select(func.count(col(PageTemplate.id))).where(
            PageTemplate.project_id == project_id
        )
    ).one()
    total_pages = math.ceil(total_records / paging_with_sort.limit)
    page_templates = session.exec(statement).all()
    return PageTemplateListResponse(
        page_templates=page_templates,
        paging=PagingResponse(
            page=paging_with_sort.page,
            limit=paging_with_sort.limit,
            next_page=paging_with_sort.page < total_pages - 1,
            total_pages=total_pages,
            total_records=total_records,
        ),
    )


@page_template_router.delete(
    "/projects/{project_id}/page_templates/{page_template_id}",
    response_model=IdResponse,
    tags=["page templates"],
    responses={404: {"model": FastAPIError, "description": "PageTemplate not found"}},
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
        return IdResponse(id=page_template_id)
