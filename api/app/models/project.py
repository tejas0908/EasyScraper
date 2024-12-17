from datetime import datetime
from typing import List, Literal, Optional

from app.models.common import PagingResponse
from app.util import generate_ulid
from pydantic import field_serializer
from sqlmodel import Field, SQLModel, String


class Project(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False, min_length=3, max_length=100)
    website_url: str = Field(nullable=True)
    website_favicon_url: Optional[str] = Field(nullable=True)
    rate_count: int = Field(nullable=False, default=1)
    rate_time_unit: Literal["SECOND", "MINUTE"] = Field(
        nullable=False, default="SECOND", sa_type=String
    )
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
    website_url: str = Field(
        nullable=True, description="Url of the website you wish to scrape"
    )
    rate_count: int = Field(nullable=False, default=1)
    rate_time_unit: Literal["SECOND", "MINUTE"] = Field(
        nullable=False, default="SECOND", sa_type=String
    )


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    website_url: str = Field(
        nullable=True, description="Url of the website you wish to scrape"
    )
    rate_count: int = Field(nullable=False, default=1)
    rate_time_unit: Literal["SECOND", "MINUTE"] = Field(
        nullable=False, default="SECOND", sa_type=String
    )


class ProjectListResponse(SQLModel):
    projects: List[Project]
    paging: PagingResponse
