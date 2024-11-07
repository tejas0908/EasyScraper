from sqlmodel import Field, SQLModel
from app.util import generate_ulid


class Project(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    name: str = Field(nullable=False)
    sleep_seconds_between_page_scrape: int = Field(nullable=False, default=3)
    user_id: str = Field(nullable=False, foreign_key="user.id")


class ProjectUpdate(SQLModel):
    name: str = Field(default=None)
    sleep_seconds_between_page_scrape: int = Field(default=None)
