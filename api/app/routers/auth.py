from fastapi import APIRouter, status, HTTPException
from app.models.auth import UserCreate, User, UserOut, UserAccessToken, UserLogin
from app.models.common import FastAPIError
from app.db.engine import SessionDep
from app.util import hash_password, verify_password, generate_access_token
from sqlmodel import select
from app.db.db_utils import check_if_user_exists


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
    check_if_user_exists(user_signup.username, session)
    user = User.model_validate(user_signup)
    user.password = hash_password(user.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserAccessToken(
        username=user.username, token=generate_access_token(user.id, user.username)
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
            token=generate_access_token(user.id, user.username),
        )
    else:
        raise HTTPException(
            detail="wrong password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
