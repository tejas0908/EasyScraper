from sqlmodel import Field, SQLModel, AutoString
from app.util import generate_ulid
from pydantic import EmailStr, SecretStr
import sqlalchemy as sa


class SecretStrType(sa.types.TypeDecorator):
    impl = sa.types.TEXT

    def process_bind_param(self, value: SecretStr, dialect):
        return value.get_secret_value()

    def process_result_value(self, value: str, dialect):
        return SecretStr(value)


class User(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    email: EmailStr = Field(nullable=False, unique=True, index=True, sa_type=AutoString)
    password: SecretStr = Field(nullable=False, min_length=6, sa_type=SecretStrType)


class UserSignup(SQLModel):
    email: EmailStr = Field(nullable=False, sa_type=AutoString)
    password: SecretStr = Field(nullable=False, min_length=6, sa_type=SecretStrType)

class UserOut(SQLModel):
    id: str
    email: EmailStr = Field(nullable=False, sa_type=AutoString)
