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
    alias: str = Field(
        nullable=False, min_length=3, max_length=100, description="Field name to scrape"
    )
    type: Literal["SINGLE", "MULTI"] = Field(
        nullable=False,
        sa_type=String,
        description="MULTI means its a list of values to be scraped",
    )
    value: str = Field(
        nullable=True,
        default=None,
        max_length=1000,
        description="can contain xpath, css selector, example value or null if its AI_SCRAPER",
    )
    href: bool = Field(
        nullable=True,
        default=None,
        description="applicable to Xpath and Css selector only. indicates that value will resolve to a anchor tag with a href attribute",
    )


class ScrapeRuleUpdate(SQLModel):
    alias: Optional[str] = Field(
        default=None, min_length=3, max_length=100, description="Field name to scrape"
    )
    type: Literal["SINGLE", "MULTI"] = Field(
        default=None,
        description="MULTI means its a list of values to be scraped",
    )
    value: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="can contain xpath, css selector, example value or null if its AI_SCRAPER",
    )
    href: bool = Field(
        nullable=True,
        default=None,
        description="applicable to Xpath and Css selector only. indicates that value will resolve to a anchor tag with a href attribute",
    )


class ScrapeRuleListResponse(SQLModel):
    scrape_rules: List[ScrapeRule]
    paging: PagingResponse
