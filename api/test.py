import asyncio
from playwright.async_api import async_playwright
import os
import re
import tempfile
import traceback
from datetime import datetime, timedelta, timezone
from io import BytesIO
from urllib.parse import urlparse

import boto3
import jwt
import requests
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from botocore.client import Config
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from PIL import Image
from playwright.async_api import async_playwright
from ulid import ULID


def get_image_area(url):
    try:
        req = requests.get(url, headers={"User-Agent": UserAgent().firefox})
        im = Image.open(BytesIO(req.content))
        return im.size[0] * im.size[1]
    except:
        return 0


async def get_html(url):
    html = None
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        ua = UserAgent()
        page = await browser.new_page(user_agent=ua.firefox)
        await page.goto(url, wait_until="domcontentloaded")
        html = await page.content()
        await browser.close()
    return html


async def get_favicon_url(url):
    favicons = []
    try:
        html_code = await get_html(url)
        soup = BeautifulSoup(html_code, features="lxml")
        for item in soup.find_all(
            "link", attrs={"rel": re.compile("^(shortcut icon|icon)$", re.I)}
        ):
            turl = item.get("href")
            parsed_url = urlparse(url)
            root = f"{parsed_url.scheme}://{parsed_url.netloc}"
            if turl.startswith("http"):
                turl = turl
            elif turl.startswith("//"):
                turl = f"{parsed_url.scheme}:{turl}"
            elif turl.startswith("/"):
                turl = f"{root}{turl}"
            favicons.append(turl)
    except:
        print(traceback.format_exc())
        pass
    if len(favicons) > 0:
        favicon_sizes = [get_image_area(x) for x in favicons]
        print(favicons)
        return favicons[favicon_sizes.index(max(favicon_sizes))]
    else:
        return None


asyncio.run(get_favicon_url("https://www.adidas.co.in/"))
