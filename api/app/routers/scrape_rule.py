import math
from typing import Annotated

from app.db.db_utils import (
    check_if_page_template_belongs_to_project,
    check_if_project_belongs_to_user,
)
from app.db.engine import SessionDep
from app.models.auth import CurrentUserDep
from app.models.common import (
    FastAPIError,
    IdResponse,
    PagingResponse,
    PagingWithSortRequest,
    paging_with_sort,
)
from app.models.scrape_rule import (
    ScrapeRule,
    ScrapeRuleCreate,
    ScrapeRuleListResponse,
    ScrapeRuleUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import col, func, select
from datetime import datetime

scrape_rule_router = APIRouter()


@scrape_rule_router.post(
    "/projects/{project_id}/page_templates/{page_template_id}/scrape_rules",
    response_model=ScrapeRule,
    tags=["scrape rules"],
)
async def create_scrape_rule(
    project_id,
    page_template_id,
    scrape_rule_create: ScrapeRuleCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRule:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    scrape_rule_data = scrape_rule_create.model_dump(exclude_unset=True)
    scrape_rule_data["page_template_id"] = page_template_id
    scrape_rule_data["created_by"] = current_user.id
    scrape_rule_data["modified_by"] = current_user.id
    scrape_rule = ScrapeRule.model_validate(scrape_rule_data)
    session.add(scrape_rule)
    session.commit()
    session.refresh(scrape_rule)
    return scrape_rule


@scrape_rule_router.get(
    "/projects/{project_id}/page_templates/{page_template_id}/scrape_rules/{scrape_rule_id}",
    response_model=ScrapeRule,
    tags=["scrape rules"],
    responses={404: {"model": FastAPIError, "description": "ScrapeRule not found"}},
)
async def get_scrape_rule(
    project_id,
    page_template_id,
    scrape_rule_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRule:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    statement = (
        select(ScrapeRule)
        .where(ScrapeRule.id == scrape_rule_id)
        .where(ScrapeRule.page_template_id == page_template_id)
    )
    scrape_rule = session.exec(statement).one_or_none()
    if scrape_rule is None:
        raise HTTPException(
            detail="Invalid ScrapeRule ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return scrape_rule


@scrape_rule_router.put(
    "/projects/{project_id}/page_templates/{page_template_id}/scrape_rules/{scrape_rule_id}",
    response_model=ScrapeRule,
    tags=["scrape rules"],
    responses={404: {"model": FastAPIError, "description": "ScrapeRule not found"}},
)
async def update_scrape_rule(
    project_id,
    page_template_id,
    scrape_rule_id,
    scrape_rule: ScrapeRuleUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> ScrapeRule:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    scrape_rule_data = scrape_rule.model_dump(exclude_unset=True)
    scrape_rule_data["modified_by"] = current_user.id
    scrape_rule_data["modified_on"] = datetime.now()
    statement = (
        select(ScrapeRule)
        .where(ScrapeRule.id == scrape_rule_id)
        .where(ScrapeRule.page_template_id == page_template_id)
    )
    db_scrape_rule = session.exec(statement).one_or_none()
    if db_scrape_rule is None:
        raise HTTPException(
            detail="Invalid ScrapeRule ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    db_scrape_rule.sqlmodel_update(scrape_rule_data)
    session.add(db_scrape_rule)
    session.commit()
    session.refresh(db_scrape_rule)
    return db_scrape_rule


@scrape_rule_router.get(
    "/projects/{project_id}/page_templates/{page_template_id}/scrape_rules",
    response_model=ScrapeRuleListResponse,
    tags=["scrape rules"],
)
async def list_scrape_rules(
    project_id,
    page_template_id,
    current_user: CurrentUserDep,
    session: SessionDep,
    paging_with_sort: Annotated[PagingWithSortRequest, Depends(paging_with_sort)],
) -> dict:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    statement = (
        select(ScrapeRule)
        .where(ScrapeRule.page_template_id == page_template_id)
        .order_by(
            getattr(
                getattr(ScrapeRule, paging_with_sort.sort_field),
                paging_with_sort.sort_direction,
            )()
        )
        .offset(paging_with_sort.page * paging_with_sort.limit)
        .limit(paging_with_sort.limit)
    )
    scrape_rules = session.exec(statement).all()
    total_records = session.exec(
        select(func.count(col(ScrapeRule.id))).where(
            ScrapeRule.page_template_id == page_template_id
        )
    ).one()
    total_pages = math.ceil(total_records / paging_with_sort.limit)
    return ScrapeRuleListResponse(
        scrape_rules=scrape_rules,
        paging=PagingResponse(
            page=paging_with_sort.page,
            limit=paging_with_sort.limit,
            next_page=paging_with_sort.page < total_pages - 1,
            total_pages=total_pages,
            total_records=total_records,
        ),
    )


@scrape_rule_router.delete(
    "/projects/{project_id}/page_templates/{page_template_id}/scrape_rules/{scrape_rule_id}",
    response_model=IdResponse,
    tags=["scrape rules"],
    responses={404: {"model": FastAPIError, "description": "ScrapeRule not found"}},
)
async def delete_scrape_rule(
    project_id,
    page_template_id,
    scrape_rule_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> dict:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    statement = (
        select(ScrapeRule)
        .where(ScrapeRule.id == scrape_rule_id)
        .where(ScrapeRule.page_template_id == page_template_id)
    )
    scrape_rule = session.exec(statement).one_or_none()
    if scrape_rule is None:
        raise HTTPException(
            detail="Invalid ScrapeRule ID",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    session.delete(scrape_rule)
    session.commit()
    return IdResponse(id=scrape_rule_id)
