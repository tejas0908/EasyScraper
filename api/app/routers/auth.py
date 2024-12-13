from app.db.db_utils import check_if_user_exists
from app.db.engine import SessionDep
from app.models.auth import User, UserAccessToken, UserCreate, UserLogin, UserOut
from app.models.common import FastAPIError
from app.util import generate_access_token, hash_password, verify_password
from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

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
