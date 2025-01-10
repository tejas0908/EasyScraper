import os
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fake_useragent import UserAgent
from lxml_html_clean import Cleaner
from playwright.sync_api import sync_playwright
from ulid import ULID

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


def generate_access_token(id, username, full_name):
    dt = datetime.now(tz=timezone.utc) + timedelta(
        minutes=int(os.environ["TOKEN_EXPIRY_MINUTES"])
    )
    return jwt.encode(
        {"id": id, "username": username, "exp": dt, "full_name": full_name},
        jwt_secret,
        algorithm="HS256",
    )


cleaner = Cleaner(javascript=True, comments=True, scripts=True, style=True, meta=True)


def get_html(url, clean=True):
    html = None
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        ua = UserAgent()
        page = browser.new_page(user_agent=ua.firefox)
        page.goto(url, wait_until="domcontentloaded")
        html = page.content()
        browser.close()
    html = cleaner.clean_html(html) if clean else html
    return html
