from app.db.db_utils import (
    check_if_page_template_belongs_to_project,
    check_if_project_belongs_to_user,
)
from app.db.engine import SessionDep
from app.models.ai_prompt import AIPrompt, AIPromptCreate, AIPromptUpdate
from app.models.auth import CurrentUserDep
from app.models.common import FastAPIError, IdResponse, Paging
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

ai_prompt_router = APIRouter()


@ai_prompt_router.post(
    "/projects/{project_id}/page_templates/{page_template_id}/ai_prompt",
    response_model=AIPrompt,
    tags=["ai prompt"],
)
async def create_ai_prompt(
    project_id,
    page_template_id,
    ai_prompt_create: AIPromptCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> AIPrompt:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    ai_prompt_data = ai_prompt_create.model_dump(exclude_unset=True)
    ai_prompt_data["page_template_id"] = page_template_id
    ai_prompt = AIPrompt.model_validate(ai_prompt_data)
    session.add(ai_prompt)
    session.commit()
    session.refresh(ai_prompt)
    return ai_prompt


@ai_prompt_router.put(
    "/projects/{project_id}/page_templates/{page_template_id}/ai_prompt",
    response_model=AIPrompt,
    tags=["ai prompt"],
    responses={404: {"model": FastAPIError, "description": "AI Prompt not found"}},
)
async def update_ai_prompt(
    project_id,
    page_template_id,
    ai_prompt_update: AIPromptUpdate,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> AIPrompt:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    ai_prompt_data = ai_prompt_update.model_dump(exclude_unset=True)
    statement = select(AIPrompt).where(AIPrompt.page_template_id == page_template_id)
    db_ai_prompt = session.exec(statement).one_or_none()
    if db_ai_prompt is None:
        raise HTTPException(
            detail="AI Prompt does not exist",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    db_ai_prompt.sqlmodel_update(ai_prompt_data)
    session.add(db_ai_prompt)
    session.commit()
    session.refresh(db_ai_prompt)
    return db_ai_prompt


@ai_prompt_router.get(
    "/projects/{project_id}/page_templates/{page_template_id}/ai_prompt",
    response_model=AIPrompt,
    tags=["ai prompt"],
    responses={404: {"model": FastAPIError, "description": "AI Prompt not found"}},
)
async def get_ai_prompt(
    project_id,
    page_template_id,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> AIPrompt:
    check_if_project_belongs_to_user(project_id, current_user, session)
    check_if_page_template_belongs_to_project(page_template_id, project_id, session)
    statement = select(AIPrompt).where(AIPrompt.page_template_id == page_template_id)
    ai_prompt = session.exec(statement).one_or_none()
    if ai_prompt is None:
        raise HTTPException(
            detail="AI Prompt does not exist",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return ai_prompt
