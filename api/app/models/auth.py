from sqlmodel import Field, SQLModel
from app.util import generate_ulid
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
import jwt
import os

jwt_secret = os.environ["JWT_SECRET"]


class User(SQLModel, table=True):
    id: str = Field(
        default_factory=generate_ulid, primary_key=True, unique=True, nullable=False
    )
    username: str = Field(nullable=False, unique=True, index=True, min_length=6, max_length=20)
    password: str = Field(nullable=False, min_length=6, max_length=20)


class UserCreate(SQLModel):
    username: str = Field(nullable=False, min_length=6, max_length=20)
    password: str = Field(nullable=False, min_length=6, max_length=20)


class UserLogin(SQLModel):
    username: str = Field(nullable=False, min_length=6, max_length=20)
    password: str = Field(nullable=False, min_length=6, max_length=20)


class UserAccessToken(SQLModel):
    username: str = Field(nullable=False)
    token: str = Field(nullable=False)


class UserOut(SQLModel):
    id: str = Field(nullable=False)
    username: str = Field(nullable=False)


get_bearer_token = HTTPBearer(auto_error=False)


class CurrentUser(SQLModel):
    id: str = Field(nullable=False)
    username: str = Field(nullable=False)


def current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(get_bearer_token),
):
    if auth is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    else:
        try:
            payload = jwt.decode(auth.credentials, jwt_secret, algorithms="HS256")
            return CurrentUser(id=payload["id"], username=payload["username"])
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Expired Token",
            )


CurrentUserDep = Annotated[CurrentUser, Depends(current_user)]
