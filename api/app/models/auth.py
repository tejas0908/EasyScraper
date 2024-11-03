from sqlmodel import Field, SQLModel
from app.util import generate_ulid


class User(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    username: str = Field(nullable=False, unique=True, index=True)
    password: str = Field(nullable=False, min_length=6)


class UserSignup(SQLModel):
    username: str = Field(nullable=False)
    password: str = Field(nullable=False, min_length=6)


class UserLogin(SQLModel):
    username: str = Field(nullable=False)
    password: str = Field(nullable=False, min_length=6)


class UserAccessToken(SQLModel):
    username: str = Field(nullable=False)
    token: str = Field(nullable=False)


class UserOut(SQLModel):
    id: str
    username: str = Field(nullable=False)
