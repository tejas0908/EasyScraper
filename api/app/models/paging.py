from sqlmodel import Field, SQLModel


class Paging(SQLModel):
    skip: int = Field(nullable=False)
    limit: int = Field(nullable=False)
