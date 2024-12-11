from sqlmodel import Field, SQLModel
from app.util import generate_ulid
from typing import List
from app.models.common import PagingResponse


class SeedPage(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    url: str = Field(nullable=False)
    page_template_id: str = Field(nullable=False, foreign_key="pagetemplate.id")
    project_id: str = Field(nullable=False, foreign_key="project.id")


class SeedPageCreate(SQLModel):
    url: str = Field(nullable=False)
    page_template_id: str = Field(nullable=False)


class SeedPageUpdate(SQLModel):
    url: str = Field(nullable=False)
    page_template_id: str = Field(nullable=False)


class SeedPageListResponse(SQLModel):
    seed_pages: List[SeedPage]
    paging: PagingResponse
