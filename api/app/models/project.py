from datetime import datetime
from typing import List, Optional

from app.models.common import PagingResponse
from app.util import generate_ulid
from pydantic import field_serializer
from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: int = Field(
        nullable=False, default=3, ge=1, le=60
    )
    ignore_scrape_failures: bool = Field(nullable=False, default=True)
    website_url: str = Field(nullable=True)
    website_favicon_url: Optional[str] = Field(nullable=True)
    user_id: str = Field(nullable=False, foreign_key="user.id")
    created_on: datetime = Field(nullable=False, default_factory=datetime.now)
    modified_on: datetime = Field(nullable=False, default_factory=datetime.now)
    created_by: str = Field(nullable=False)
    modified_by: str = Field(nullable=False)

    @field_serializer("created_on")
    def serialize_created_on(self, created_on: datetime, _info):
        return str(created_on)

    @field_serializer("modified_on")
    def serialize_modified_on(self, modified_on: datetime, _info):
        return str(modified_on)


class ProjectCreate(SQLModel):
    name: str = Field(nullable=False, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: int = Field(
        nullable=False,
        default=3,
        ge=1,
        le=60,
        description="Seconds to wait after scraping each page",
    )
    ignore_scrape_failures: bool = Field(
        nullable=False,
        default=True,
        description="Whether to ignore failures while scraping pages or to stop the whole scrape run",
    )
    website_url: str = Field(
        nullable=True, description="Url of the website you wish to scrape"
    )


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: Optional[int] = Field(
        default=None,
        ge=1,
        le=60,
        description="Seconds to wait after scraping each page",
    )
    ignore_scrape_failures: Optional[bool] = Field(
        default=None,
        description="Whether to ignore failures while scraping pages or to stop the whole scrape run",
    )
    website_url: str = Field(
        nullable=True, description="Url of the website you wish to scrape"
    )


class ProjectListResponse(SQLModel):
    projects: List[Project]
    paging: PagingResponse
