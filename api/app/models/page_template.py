from datetime import datetime
from typing import List, Literal, Optional

from app.models.common import PagingResponse
from app.util import generate_ulid
from pydantic import field_serializer
from sqlmodel import Field, SQLModel, String


class PageTemplate(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False, min_length=3, max_length=100)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False, sa_type=String)
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(nullable=False, sa_type=String)
    )
    example_url: str = Field(nullable=True, default=None, max_length=1000)
    ai_prompt: Optional[str] = Field(nullable=True, default=None, max_length=1000)
    ai_input: Optional[Literal["TEXT", "HTML"]] = Field(
        nullable=True, default=None, sa_type=String
    )
    output_page_template_id: Optional[str] = Field(
        nullable=True, default=None, foreign_key="pagetemplate.id"
    )
    project_id: str = Field(nullable=False, foreign_key="project.id")
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


class PageTemplateCreate(SQLModel):
    name: str = Field(nullable=False, min_length=3, max_length=100)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(
        nullable=False,
        sa_type=String,
        description="PAGE_SOURCE indicates that this page will generate urls of other page templates. LEAF indicates that actual data will be scraped",
    )
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(
            nullable=False,
            sa_type=String,
            description="XPATH_SELECTOR means that scrape rules will have xpath to scrape the field. CSS_SELECTOR means that scrape rules will have css selector to scrape the field. AUTO_SCRAPER means that the scrape rule will have the actual value to scrape from the example url. AI_SCRAPER will use LLMs to scrape the field only using the alias",
        )
    )
    example_url: str = Field(
        nullable=True,
        default=None,
        max_length=1000,
        description="applicable for AUTO_SCRAPER only. Will have the url against which the scrape rule values are to be set",
    )
    ai_prompt: str = Field(
        nullable=True,
        default=None,
        max_length=1000,
        description="applicable to AI_SCRAPER only. The system prompt to send to the LLM to give it special instructions",
    )
    ai_input: Literal["TEXT", "HTML"] = Field(
        nullable=True,
        default=None,
        sa_type=String,
        description="applicable to AI_SCRAPER only. TEXT means only the text will be sent to the LLM. HTML means the whole html of the page is sent to the LLM. Html will be costlier",
    )
    output_page_template_id: Optional[str] = Field(
        nullable=True,
        default=None,
        description="applicable for PAGE_SOURCE only. indicates which page template urls will be generated",
    )


class PageTemplateUpdate(SQLModel):
    name: str = Field(default=None, min_length=3, max_length=100)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(
        default=None,
        description="PAGE_SOURCE indicates that this page will generate urls of other page templates. LEAF indicates that actual data will be scraped",
    )
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(
            default=None,
            description="XPATH_SELECTOR means that scrape rules will have xpath to scrape the field. CSS_SELECTOR means that scrape rules will have css selector to scrape the field. AUTO_SCRAPER means that the scrape rule will have the actual value to scrape from the example url. AI_SCRAPER will use LLMs to scrape the field only using the alias",
        )
    )
    example_url: str = Field(
        nullable=True,
        default=None,
        max_length=1000,
        description="applicable for AUTO_SCRAPER only. Will have the url against which the scrape rule values are to be set",
    )
    ai_prompt: str = Field(
        nullable=True,
        default=None,
        max_length=1000,
        description="applicable to AI_SCRAPER only. The system prompt to send to the LLM to give it special instructions",
    )
    ai_input: Literal["TEXT", "HTML"] = Field(
        nullable=True,
        default=None,
        sa_type=String,
        description="applicable to AI_SCRAPER only. TEXT means only the text will be sent to the LLM. HTML means the whole html of the page is sent to the LLM. Html will be costlier",
    )
    output_page_template_id: Optional[str] = Field(
        nullable=True,
        default=None,
        foreign_key="page_template.id",
        description="applicable for PAGE_SOURCE only. indicates which page template urls will be generated",
    )


class PageTemplateListResponse(SQLModel):
    page_templates: List[PageTemplate]
    paging: PagingResponse
