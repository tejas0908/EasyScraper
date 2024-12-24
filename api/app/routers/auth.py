from app.db.db_utils import check_if_user_exists
from app.db.engine import SessionDep
from app.models.auth import (
    User,
    UserAccessToken,
    UserCreate,
    UserLogin,
    UserOut,
    UserLoginGithub,
)
from app.models.common import FastAPIError
from app.util import generate_access_token, hash_password, verify_password
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
import requests
import os

auth_router = APIRouter()


@auth_router.post(
    "/user/signup",
    response_model=UserAccessToken,
    tags=["auth"],
    responses={
        409: {
            "model": FastAPIError,
            "description": "user already exists",
        }
    },
)
async def sign_up(user_signup: UserCreate, session: SessionDep) -> UserOut:
    """
    Signup for a new user account
    """
    check_if_user_exists(user_signup.username, session)
    user = User.model_validate(user_signup)
    user.password = hash_password(user.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserAccessToken(
        username=user.username,
        token=generate_access_token(user.id, user.username, user.full_name),
    )


@auth_router.post(
    "/user/login",
    response_model=UserAccessToken,
    tags=["auth"],
    responses={
        401: {
            "model": FastAPIError,
            "description": "wrong username or password",
        }
    },
)
async def login(user_login: UserLogin, session: SessionDep) -> UserAccessToken:
    """
    Login to an existing user account to get an access token
    """
    statement = select(User).where(User.username == user_login.username)
    user = session.exec(statement).first()
    if user is None:
        raise HTTPException(
            detail="wrong username",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    elif verify_password(user.password, user_login.password):
        return UserAccessToken(
            username=user_login.username,
            token=generate_access_token(user.id, user.username, user.full_name),
        )
    else:
        raise HTTPException(
            detail="wrong password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


@auth_router.post("/user/login/github", response_model=UserAccessToken, tags=["auth"])
async def login_github(
    github_code: UserLoginGithub, session: SessionDep
) -> UserAccessToken:
    """
    Login with Github
    """
    github_token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        params={
            "client_id": os.environ["GITHUB_CLIENT_ID"],
            "client_secret": os.environ["GITHUB_CLIENT_SECRET"],
            "code": github_code.code,
        },
        headers={"Accept": "application/json"},
    ).json()
    github_access_token = github_token_response["access_token"]
    github_user_response = requests.get(
        "https://api.github.com/user",
        params={
            "client_id": os.environ["GITHUB_CLIENT_ID"],
            "client_secret": os.environ["GITHUB_CLIENT_SECRET"],
            "code": github_code.code,
        },
        headers={"Authorization": f"Bearer {github_access_token}"},
    ).json()
    username = github_user_response["login"]
    full_name = github_user_response["name"]
    email = github_user_response["email"]

    statement = select(User).where(User.username == username)
    user = session.exec(statement).one_or_none()
    if not user:
        user = User.model_validate(
            {
                "username": username,
                "full_name": full_name,
                "email": email,
            }
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    return UserAccessToken(
        username=user.username,
        token=generate_access_token(user.id, user.username, user.full_name),
    )
