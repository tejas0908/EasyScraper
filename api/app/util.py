import os
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fake_useragent import UserAgent
from lxml_html_clean import Cleaner
from playwright.sync_api import sync_playwright
from ulid import ULID
import requests
import mimetypes
import shutil

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


def download_image(url, save_path):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(save_path, "wb") as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)
    except requests.exceptions.RequestException as e:
        raise Exception(e)


def get_image_extension(url):
    """
    Finds the image file extension from the URL.

    Args:
        url (str): URL of the image.

    Returns:
        str: The file extension of the image, or None if it cannot be determined.
    """
    try:
        # Send a HEAD request to fetch headers only
        response = requests.head(url, allow_redirects=True)
        response.raise_for_status()

        # Get the content type from the headers
        content_type = response.headers.get("Content-Type")

        if content_type:
            # Use mimetypes to determine the file extension
            extension = mimetypes.guess_extension(content_type)
            return extension
        else:
            print("Content-Type header not found.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch URL headers: {e}")
        return None


def create_zip(folder_path, output_zip):
    """
    Creates a ZIP file from the given folder.

    Args:
        folder_path (str): Path of the folder to be zipped.
        output_zip (str): Path (including name) for the output ZIP file.

    Example:
        create_zip("my_folder", "my_folder.zip")
    """
    try:
        # Ensure the folder exists
        if not os.path.isdir(folder_path):
            print(f"Error: The folder '{folder_path}' does not exist.")
            return

        # Create a zip file
        shutil.make_archive(output_zip, "zip", folder_path)
        print(f"ZIP file created successfully: {output_zip}.zip")
    except Exception as e:
        print(f"An error occurred while creating the ZIP file: {e}")
