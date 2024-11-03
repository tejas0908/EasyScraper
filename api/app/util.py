from ulid import ULID
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
import os
from datetime import datetime, timezone, timedelta

jwt_secret = os.environ["JWT_SECRET"]


def generate_ulid():
    return str(ULID())


def hash_password(password_plain):
    return PasswordHasher().hash(password_plain)


def verify_password(password_hash, password_plain):
    try:
        return PasswordHasher().verify(password_hash, password_plain)
    except VerifyMismatchError:
        return False


def generate_access_token(id, username):
    dt = datetime.now(tz=timezone.utc) + timedelta(hours=1)
    return jwt.encode(
        {"id": id, "username": username, "exp": dt}, jwt_secret, algorithm="HS256"
    )
