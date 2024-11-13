from sqlmodel import Field, SQLModel
from app.util import generate_ulid
from typing import Optional, List
from app.models.common import Paging


class Project(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: int = Field(nullable=False, default=3, ge=1, le=60)
    ignore_scrape_failures: bool = Field(nullable=False, default=True)
    user_id: str = Field(nullable=False, foreign_key="user.id")


class ProjectCreate(SQLModel):
    name: str = Field(nullable=False, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: int = Field(nullable=False, default=3, ge=1, le=60)
    ignore_scrape_failures: bool = Field(nullable=False, default=True)


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    sleep_seconds_between_page_scrape: Optional[int] = Field(default=None, ge=1, le=60)
    ignore_scrape_failures: Optional[bool] = Field(default=None)


class ProjectListResponse(SQLModel):
    projects: List[Project]
    paging: Paging
