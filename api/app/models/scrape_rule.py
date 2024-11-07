from sqlmodel import Field, SQLModel, String
from app.util import generate_ulid
from typing import Literal, Optional


class ScrapeRule(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    alias: str = Field(nullable=False)
    type: Literal["SINGLE", "MULTI"] = Field(nullable=False, sa_type=String)
    value: str = Field(nullable=True, default=None)
    page_template_id: str = Field(
        nullable=True, default=None, foreign_key="pagetemplate.id"
    )

class ScrapeRuleCreate(SQLModel):
    alias: str = Field(nullable=False)
    type: Literal["SINGLE", "MULTI"] = Field(nullable=False, sa_type=String)
    value: str = Field(nullable=True, default=None)

class ScrapeRuleUpdate(SQLModel):
    alias: Optional[str] = Field(default=None)
    type: Literal["SINGLE", "MULTI"] = Field(default=None)
    value: Optional[str] = Field(default=None)
