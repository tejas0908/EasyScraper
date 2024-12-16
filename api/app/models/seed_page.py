from datetime import datetime
from typing import List

from app.models.common import PagingResponse
from app.util import generate_ulid
from sqlmodel import Field, SQLModel


class SeedPage(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    url: str = Field(nullable=False)
    page_template_id: str = Field(nullable=False, foreign_key="pagetemplate.id")
    project_id: str = Field(nullable=False, foreign_key="project.id")
    created_on: datetime = Field(nullable=False, default_factory=datetime.now)
    modified_on: datetime = Field(nullable=False, default_factory=datetime.now)
    created_by: str = Field(nullable=False)
    modified_by: str = Field(nullable=False)


class SeedPageCreate(SQLModel):
    url: str = Field(
        nullable=False, description="url of the seed page to start the scraping from"
    )
    page_template_id: str = Field(
        nullable=False, description="page template of the url"
    )


class SeedPageUpdate(SQLModel):
    url: str = Field(
        nullable=False, description="url of the seed page to start the scraping from"
    )
    page_template_id: str = Field(
        nullable=False, description="page template of the url"
    )


class SeedPageListResponse(SQLModel):
    seed_pages: List[SeedPage]
    paging: PagingResponse
