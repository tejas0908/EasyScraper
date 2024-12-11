from ulid import ULID
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
import os
from datetime import datetime, timezone, timedelta
import boto3
from botocore.client import Config
from urllib.parse import urlparse
import tempfile

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
    dt = datetime.now(tz=timezone.utc) + timedelta(minutes=int(os.environ["TOKEN_EXPIRY_MINUTES"]))
    return jwt.encode(
        {"id": id, "username": username, "exp": dt}, jwt_secret, algorithm="HS256"
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
