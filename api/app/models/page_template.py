from sqlmodel import Field, SQLModel
from app.util import generate_ulid
from typing import Literal


class PageTemplate(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False)
    project_id: str = Field(nullable=False, foreign_key="project.id")
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False)
    output_page_template_id: str = Field(
        nullable=True, default=None, foreign_key="page_template.id"
    )


class PageTemplateUpdate(SQLModel):
    name: str = Field(nullable=False)
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False)
    output_page_template_id: str = Field(
        nullable=True, default=None, foreign_key="page_template.id"
    )


class PageTemplateExample(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False)
    project_id: str = Field(nullable=False, foreign_key="project.id")
    output_type: Literal["PAGE_SOURCE", "LEAF"] = Field(nullable=False)
    output_page_template_id: str = Field(
        nullable=True, default=None, foreign_key="page_template.id"
    )