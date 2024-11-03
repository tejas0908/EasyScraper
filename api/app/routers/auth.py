from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.models.auth import UserSignup, User, UserOut, UserAccessToken, UserLogin
from app.db.engine import SessionDep
from app.util import hash_password, verify_password, generate_access_token
from sqlmodel import select
from typing import Union

auth_router = APIRouter()


@auth_router.post("/user/signup", response_model=UserOut)
async def sign_up(user_signup: UserSignup, session: SessionDep) -> UserOut:
    user = User.model_validate(user_signup)
    user.password = hash_password(user.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@auth_router.post("/user/login", response_model=None)
async def login(
    user_login: UserLogin, session: SessionDep
) -> Union[UserAccessToken, JSONResponse]:
    statement = select(User).where(User.username == user_login.username)
    user = session.exec(statement).first()
    if user is None:
        return JSONResponse(
            content={"error": "wrong username"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    elif verify_password(user.password, user_login.password):
        return UserAccessToken(
            username=user_login.username, token=generate_access_token(user.username)
        )
    else:
        return JSONResponse(
            content={"error": "wrong password"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
