import os
import tempfile
from datetime import datetime, timedelta, timezone

import boto3
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from botocore.client import Config
from botocore.exceptions import NoCredentialsError
from ulid import ULID
from playwright.sync_api import sync_playwright
from fake_useragent import UserAgent
from lxml_html_clean import Cleaner

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


def get_file_from_minio(file_url):
    bucket_name = os.environ["MINIO_DEFAULT_BUCKET"]
    object_name = file_url.split("/")[-1]
    print(f"Getting file from Minio: {bucket_name}/{object_name}")
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["MINIO_URL"],
        aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
        aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
        config=Config(signature_version="s3v4"),
    )

    response = s3.get_object(Bucket=bucket_name, Key=object_name)
    file_content = response["Body"].read()
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(file_content)
    temp_file.close()
    return temp_file.name


def upload_to_minio(local_file_path):
    minio_host_url = os.environ.get("MINIO_URL")
    minio_client = boto3.client(
        "s3",
        endpoint_url=minio_host_url,
        aws_access_key_id=os.environ.get("MINIO_ACCESS_KEY"),
        aws_secret_access_key=os.environ.get("MINIO_SECRET_KEY"),
        region_name="us-east-1",
    )
    bucket_name = os.environ.get("MINIO_DEFAULT_BUCKET")

    object_name = local_file_path.split("/")[-1]

    try:
        minio_client.upload_file(local_file_path, bucket_name, object_name)
        minio_url = f"{minio_host_url}/{bucket_name}/{object_name}"
        return minio_url
    except FileNotFoundError:
        print("The file was not found")
        return None
    except NoCredentialsError:
        print("Credentials not available")
        return None


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
