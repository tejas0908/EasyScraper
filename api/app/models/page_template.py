from sqlmodel import Field, SQLModel, String
from app.util import generate_ulid
from typing import Literal, Optional


class PageTemplate(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False, sa_type=String)
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(nullable=False, sa_type=String)
    )
    output_page_template_id: Optional[str] = Field(
        nullable=True, default=None, foreign_key="pagetemplate.id"
    )
    project_id: str = Field(nullable=False, foreign_key="project.id")


class PageTemplateUpdate(SQLModel):
    name: str = Field(default=None)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(default=None)
    scraper: Literal["XPATH_SELECTOR", "CSS_SELECTOR", "AUTO_SCRAPER", "AI_SCRAPER"] = (
        Field(default=None)
    )
    output_page_template_id: Optional[str] = Field(
        nullable=True, default=None, foreign_key="page_template.id"
    )
