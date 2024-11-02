from fastapi import APIRouter
from app.models.auth import UserSignup, User, UserOut
from app.db.engine import SessionDep

auth_router = APIRouter()


@auth_router.post("/user/signup", response_model=UserOut)
async def sign_up(user_signup: UserSignup, session: SessionDep) -> UserOut:
    user = User.model_validate(user_signup)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
