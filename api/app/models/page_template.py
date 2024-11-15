from sqlmodel import Field, SQLModel, String
from app.util import generate_ulid
from typing import Literal, Optional, List
from app.models.common import Paging


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
    ai_prompt: str = Field(nullable=True, default=None, max_length=1000)
    ai_input: Literal["TEXT", "HTML"] = Field(nullable=True, default=None, sa_type=String)
    output_page_template_id: Optional[str] = Field(
        nullable=True, default=None, foreign_key="pagetemplate.id"
    )
    project_id: str = Field(nullable=False, foreign_key="project.id")


class PageTemplateCreate(SQLModel):
    name: str = Field(nullable=False, min_length=3, max_length=100)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False, sa_type=String)
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(nullable=False, sa_type=String)
    )
    example_url: str = Field(nullable=True, default=None, max_length=1000)
    ai_prompt: str = Field(nullable=True, default=None, max_length=1000)
    ai_input: Literal["TEXT", "HTML"] = Field(nullable=True, default=None, sa_type=String)
    output_page_template_id: Optional[str] = Field(nullable=True, default=None)


class PageTemplateUpdate(SQLModel):
    name: str = Field(default=None, min_length=3, max_length=100)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(default=None)
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(default=None)
    )
    example_url: str = Field(nullable=True, default=None, max_length=1000)
    ai_prompt: str = Field(nullable=True, default=None, max_length=1000)
    ai_input: Literal["TEXT", "HTML"] = Field(nullable=True, default=None, sa_type=String)
    output_page_template_id: Optional[str] = Field(
        nullable=True, default=None, foreign_key="page_template.id"
    )


class PageTemplateListResponse(SQLModel):
    page_templates: List[PageTemplate]
    paging: Paging
