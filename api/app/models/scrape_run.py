from sqlmodel import Field, SQLModel, String
from sqlalchemy import JSON, Column
from app.util import generate_ulid
from typing import Literal, Optional, List
from app.models.common import Paging
from datetime import datetime


class ScrapeRun(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    started_on: datetime = Field(nullable=False, default_factory=datetime.now)
    ended_on: Optional[datetime] = Field(nullable=True, default=None)
    status: Literal["STARTED", "COMPLETED", "FAILED"] = Field(
        nullable=False, sa_type=String
    )
    project_id: str = Field(nullable=False, foreign_key="project.id")


class ScrapeRunOutput(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    format: Literal["JSONL", "CSV", "XLSX"] = Field(nullable=False, sa_type=String)
    file_url: str = Field(nullable=False)
    scrape_run_id: str = Field(nullable=False, foreign_key="scraperun.id")


class ScrapeRunOutputView(SQLModel):
    id: str
    format: Literal["JSONL", "CSV", "XLSX"]


class ScrapeRunPage(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    url: str = Field(nullable=False, sa_type=String)
    scrape_output: dict = Field(sa_column=Column(JSON), default={})
    status: Literal["STARTED", "COMPLETED", "FAILED"] = Field(
        nullable=False, sa_type=String
    )
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False, sa_type=String)
    page_template_id: str = Field(nullable=False, foreign_key="pagetemplate.id")
    scrape_run_id: str = Field(nullable=False, foreign_key="scraperun.id")


class ScrapeRunView(SQLModel):
    id: str
    started_on: datetime
    ended_on: Optional[datetime]
    status: Literal["STARTED", "COMPLETED", "FAILED"] = Field(sa_type=String)
    outputs: List[ScrapeRunOutputView] = Field(default=[])
    total_discovered_pages: int = Field(default=0)
    total_successful_scraped_pages: int = Field(default=0)
    total_failed_scraped_pages: int = Field(default=0)
    project_id: str


class ScrapeRunMiniView(SQLModel):
    id: str
    started_on: datetime
    ended_on: Optional[datetime]
    status: Literal["STARTED", "COMPLETED", "FAILED"] = Field(sa_type=String)
    project_id: str


class ScrapeTestRequest(SQLModel):
    page_template_id: str
    url: str


class ScrapeTestResponse(SQLModel):
    output: dict


class ScrapeRunListResponse(SQLModel):
    scrape_runs: List[ScrapeRunView]
    paging: Paging
