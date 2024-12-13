from typing import List, Literal, Optional

from app.models.common import PagingResponse
from app.util import generate_ulid
from sqlmodel import Field, SQLModel, String


class ScrapeRule(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    alias: str = Field(nullable=False, min_length=3, max_length=100)
    type: Literal["SINGLE", "MULTI"] = Field(nullable=False, sa_type=String)
    value: str = Field(nullable=True, default=None, max_length=1000)
    href: bool = Field(nullable=True, default=None)
    page_template_id: str = Field(
        nullable=True, default=None, foreign_key="pagetemplate.id"
    )


class ScrapeRuleCreate(SQLModel):
    alias: str = Field(nullable=False, min_length=3, max_length=100)
    type: Literal["SINGLE", "MULTI"] = Field(nullable=False, sa_type=String)
    value: str = Field(nullable=True, default=None, max_length=1000)
    href: bool = Field(nullable=True, default=None)


class ScrapeRuleUpdate(SQLModel):
    alias: Optional[str] = Field(default=None, min_length=3, max_length=100)
    type: Literal["SINGLE", "MULTI"] = Field(default=None)
    value: Optional[str] = Field(default=None, max_length=1000)
    href: bool = Field(nullable=True, default=None)


class ScrapeRuleListResponse(SQLModel):
    scrape_rules: List[ScrapeRule]
    paging: PagingResponse
