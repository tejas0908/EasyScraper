from sqlmodel import Field, SQLModel
from app.util import generate_ulid


class AIPrompt(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    prompt: str = Field(nullable=False)
    page_template_id: str = Field(nullable=False, foreign_key="pagetemplate.id")


class AIPromptCreate(SQLModel):
    prompt: str = Field(nullable=False)


class AIPromptUpdate(SQLModel):
    prompt: str = Field(nullable=False)
