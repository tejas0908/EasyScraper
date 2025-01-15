import csv
import json
import os
import re
import time
import traceback
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List
from urllib.parse import urlparse

import requests
import xlsxwriter
from app.celery.celery import celery_app
from app.models.page_template import PageTemplate
from app.models.project import Project
from app.models.scrape_rule import ScrapeRule
from app.models.scrape_run import ScrapeRun, ScrapeRunOutput, ScrapeRunPage
from app.models.seed_page import SeedPage
from bs4 import BeautifulSoup
from celery import group
from fake_useragent import UserAgent
from lxml import html
from lxml_html_clean import Cleaner
from openai import OpenAI
from PIL import Image
from playwright.sync_api import sync_playwright
from sqlalchemy.pool import NullPool
from sqlmodel import Session, create_engine, select
from token_throttler import TokenBucket, TokenThrottler
from token_throttler.storage import RuntimeStorage
from app.blob_store import blob_store
from app.util import download_image, get_image_extension, create_zip

db_url = os.environ["DB_URL"]
engine = create_engine(db_url, echo=False, poolclass=NullPool)
session = Session(engine)

openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
cleaner = Cleaner(javascript=True, comments=True, scripts=True, style=True, meta=True)


def get_project(project_id):
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).one_or_none()
    return project


def get_page_template(page_template_id, project_id):
    statement = (
        select(PageTemplate)
        .where(PageTemplate.id == page_template_id)
        .where(PageTemplate.project_id == project_id)
    )
    page_template = session.exec(statement).one_or_none()
    return page_template


def get_page_templates(project_id):
    statement = select(PageTemplate).where(PageTemplate.project_id == project_id)
    page_templates = session.exec(statement).all()
    return page_templates


def get_scrape_rules(page_template_id):
    statement = select(ScrapeRule).where(
        ScrapeRule.page_template_id == page_template_id
    )
    scrape_rules = session.exec(statement).all()
    return scrape_rules


def get_scrape_run(scrape_run_id, project_id):
    statement = (
        select(ScrapeRun)
        .where(ScrapeRun.id == scrape_run_id)
        .where(ScrapeRun.project_id == project_id)
    )
    scrape_run = session.exec(statement).one_or_none()
    return scrape_run


def get_scrape_run_page(scrape_run_page_id):
    statement = select(ScrapeRunPage).where(ScrapeRunPage.id == scrape_run_page_id)
    scrape_run_page = session.exec(statement).one_or_none()
    return scrape_run_page


def get_seed_pages(project_id):
    statement = select(SeedPage).where(SeedPage.project_id == project_id)
    seed_pages = session.exec(statement).all()
    return seed_pages


def get_root_url(url):
    parsed_url = urlparse(url)
    return f"{parsed_url.scheme}://{parsed_url.netloc}"


def process_page_source_url(candidate_url, page_template, root_url):
    if page_template.output_type == "PAGE_SOURCE":
        if candidate_url.startswith("http"):
            return candidate_url.strip()
        else:
            return f"{root_url}{candidate_url}"
    else:
        return candidate_url.strip()


def scrape_page_xpath_selector(scrape_run_id, page_template, scrape_rules, url):
    root = get_root_url(url)
    html_code = get_html(url, clean=False)
    tree = html.fromstring(html_code)
    scrape_result = {}
    for scrape_rule in scrape_rules:
        elements = tree.xpath(scrape_rule.value)
        print(elements)
        elements = [
            process_page_source_url(element, page_template, root)
            for element in elements
        ]
        if scrape_rule.type == "SINGLE":
            scrape_result[scrape_rule.alias] = (
                elements[0] if len(elements) > 0 else None
            )
        else:
            scrape_result[scrape_rule.alias] = list(set(elements))
    return scrape_result


def scrape_page_ai_scraper(scrape_run_id, page_template, scrape_rules, url):
    html_code = get_html(url, clean=True)
    ai_input = None
    if page_template.ai_input == "HTML":
        ai_input = html_code
    else:
        soup = BeautifulSoup(html_code, "html.parser")
        ai_input = soup.get_text()
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "scrape_result",
            "schema": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
    for scrape_rule in scrape_rules:
        if scrape_rule.type == "SINGLE":
            response_format["json_schema"]["schema"]["properties"][
                scrape_rule.alias
            ] = {"type": "string"}
        else:
            response_format["json_schema"]["schema"]["properties"][
                scrape_rule.alias
            ] = {"type": "array", "items": {"type": "string"}}
        response_format["json_schema"]["schema"]["required"].append(scrape_rule.alias)
    openai_response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a web scraper.\n" + page_template.ai_prompt
                    if page_template.ai_prompt
                    else ""
                ),
            },
            {"role": "user", "content": ai_input},
        ],
        response_format=response_format,
    )
    openai_result = openai_response.choices[0].message.content
    scrape_result = json.loads(openai_result)
    return scrape_result


def scrape_page(scrape_run_id, page_template, scrape_rules, url):
    scrape_result = {}
    if page_template.scraper == "XPATH_SELECTOR":
        scrape_result = scrape_page_xpath_selector(
            scrape_run_id, page_template, scrape_rules, url
        )
    if page_template.scraper == "AI_SCRAPER":
        scrape_result = scrape_page_ai_scraper(
            scrape_run_id, page_template, scrape_rules, url
        )
    return scrape_result


@celery_app.task(time_limit=60)
def scrape_page_for_run(project_id, scrape_run_id, scrape_run_page_id):
    scrape_run_page = get_scrape_run_page(scrape_run_page_id)
    scrape_result = {}
    try:
        page_template_id = scrape_run_page.page_template_id
        url = scrape_run_page.url
        page_template = get_page_template(page_template_id, project_id)
        scrape_rules = get_scrape_rules(page_template_id)
        scrape_result = scrape_page(scrape_run_id, page_template, scrape_rules, url)
        scrape_run_page.status = "COMPLETED"
        scrape_run_page.scrape_output = scrape_result

        # if new pages are generated, save them
        if (
            scrape_run_page.output_type == "PAGE_SOURCE"
            and "urls" in scrape_result
            and len(scrape_result["urls"]) > 0
        ):
            output_page_template = get_page_template(
                page_template.output_page_template_id, project_id
            )
            for url in scrape_result["urls"]:
                scrape_run_page_new = ScrapeRunPage(
                    url=url,
                    output_type=output_page_template.output_type,
                    page_template_id=output_page_template.id,
                    scrape_run_id=scrape_run_id,
                    status="PENDING",
                )
                session.add(scrape_run_page_new)
            session.commit()

        # if any images are to be downloaded
        for scrape_rule in scrape_rules:
            if scrape_rule.download_as_image is True:
                if (
                    scrape_rule.alias in scrape_result
                    and scrape_result[scrape_rule.alias] is not None
                ):
                    image_urls = scrape_result[scrape_rule.alias]
                    if isinstance(scrape_result[scrape_rule.alias], str):
                        image_urls = [scrape_result[scrape_rule.alias]]
                    for i, image_url in enumerate(image_urls):
                        extension = get_image_extension(image_url)
                        save_path = f"/app/celery_file_data/temp/{scrape_run_id}/{scrape_run_page_id}/{scrape_rule.alias}_{i+1}.{extension}"
                        os.makedirs(os.path.dirname(save_path), exist_ok=True)
                        download_image(image_url, save_path)
                        remote_file_path = f"{scrape_run_id}/{scrape_run_page_id}/{scrape_rule.alias}_{i+1}.{extension}"
                        blob_store.upload_file(save_path, remote_file_path)

    except:
        scrape_run_page.status = "FAILED"
        print(traceback.format_exc())
    finally:
        session.add(scrape_run_page)
        session.commit()
    return scrape_result, page_template.output_page_template_id


@celery_app.task(time_limit=60)
def scrape_page_for_test(project_id, page_template_id, url):
    page_template = get_page_template(page_template_id, project_id)
    scrape_rules = get_scrape_rules(page_template_id)
    scrape_result = scrape_page(str(int(time.time())), page_template, scrape_rules, url)
    return scrape_result


def get_scrape_run_pages_by_status(scrape_run_id, status, output_type):
    statement = (
        select(ScrapeRunPage)
        .where(ScrapeRunPage.scrape_run_id == scrape_run_id)
        .where(ScrapeRunPage.status == status)
        .where(ScrapeRunPage.output_type == output_type)
    )
    scrape_run_pages = session.exec(statement).all()
    return scrape_run_pages


def write_to_jsonl_file(scrape_run_pages, scrape_run_id, page_template_id):
    output_file_path = f"/app/celery_file_data/scrape_run_outputs/{scrape_run_id}_{page_template_id}.jsonl"
    with open(output_file_path, "w") as output_file:
        for scrape_run_page in scrape_run_pages:
            output = scrape_run_page.scrape_output
            output["scrape_url"] = scrape_run_page.url
            output["scrape_id"] = scrape_run_page.id
            json_line = json.dumps(output)
            output_file.write(json_line + "\n")
    return output_file_path


def write_to_csv_file(scrape_run_pages, scrape_run_id, page_template_id):
    output_file_path = f"/app/celery_file_data/scrape_run_outputs/{scrape_run_id}_{page_template_id}.csv"
    csv_scrape_run_pages = [
        x
        for x in scrape_run_pages
        if type(x.scrape_output) == dict and len(x.scrape_output.keys()) > 0
    ]
    with open(output_file_path, "w", newline="") as csv_output_file:
        fieldnames = (
            csv_scrape_run_pages[0].scrape_output.keys() if csv_scrape_run_pages else []
        )
        writer = csv.DictWriter(csv_output_file, fieldnames=fieldnames)
        writer.writeheader()
        for scrape_run_page in csv_scrape_run_pages:
            output = scrape_run_page.scrape_output
            output["scrape_url"] = scrape_run_page.url
            output["scrape_id"] = scrape_run_page.id
            writer.writerow(output)
    return output_file_path


def write_to_xlsx_file(scrape_run_pages, scrape_run_id, page_template_id):
    # write scrape output to XLSX file
    output_file_path = f"/app/celery_file_data/scrape_run_outputs/{scrape_run_id}_{page_template_id}.xlsx"
    xlsx_scrape_run_pages = [
        x
        for x in scrape_run_pages
        if type(x.scrape_output) == dict and len(x.scrape_output.keys()) > 0
    ]
    workbook = xlsxwriter.Workbook(output_file_path)
    worksheet = workbook.add_worksheet()

    # Write headers
    fieldnames = (
        xlsx_scrape_run_pages[0].scrape_output.keys() if xlsx_scrape_run_pages else []
    )
    for col_num, fieldname in enumerate(list(fieldnames) + ["scrape_url", "scrape_id"]):
        worksheet.write(0, col_num, fieldname)

    # Write data
    for row_num, scrape_run_page in enumerate(xlsx_scrape_run_pages, start=1):
        output = scrape_run_page.scrape_output
        output["scrape_url"] = scrape_run_page.url
        output["scrape_id"] = scrape_run_page.id
        for col_num, fieldname in enumerate(fieldnames):
            worksheet.write(row_num, col_num, str(output.get(fieldname)))
    workbook.close()
    return output_file_path


def update_stage(stage, scrape_run_id, project_id):
    scrape_run = get_scrape_run(scrape_run_id, project_id)
    scrape_run.stage = stage
    session.add(scrape_run)
    session.commit()
    session.refresh(scrape_run)


@celery_app.task
def scrape_master(project_id, scrape_run_id, resume=False):
    try:
        project = get_project(project_id)
        scrape_run = get_scrape_run(scrape_run_id, project_id)
        update_stage("STARTED", scrape_run_id, project_id)

        # add seed pages to scrape run pages, if resume then skip this step
        seed_pages = get_seed_pages(project_id)
        for seed_page in seed_pages:
            if not resume:
                page_template = get_page_template(
                    seed_page.page_template_id, project_id
                )
                scrape_run_page = ScrapeRunPage(
                    url=seed_page.url,
                    output_type=page_template.output_type,
                    page_template_id=seed_page.page_template_id,
                    scrape_run_id=scrape_run_id,
                    status="PENDING",
                )
                session.add(scrape_run_page)
                session.commit()

        # setup rate limiter
        def get_rate_config():
            req, time = project.rate_count, project.rate_time_unit
            time = 60 if time == "MINUTE" else 1
            ratio = req / time
            cost = round(ratio) if ratio >= 1 else 1
            sleep_time = int(time / req)
            sleep_time = sleep_time if sleep_time >= 1 else 1
            return req, time, cost, sleep_time

        max_tokens, replenish_time, cost, sleep_time = get_rate_config()
        throttler: TokenThrottler = TokenThrottler(cost, RuntimeStorage())
        throttler.add_bucket(
            "rate", TokenBucket(replenish_time=replenish_time, max_tokens=max_tokens)
        )

        update_stage("PAGE_GENERATION", scrape_run_id, project_id)
        # while there are page generators in STARTED status, scrape pages, then add more pages to scrape run pages
        group_promises = []
        while True:
            scrape_run_pages = get_scrape_run_pages_by_status(
                scrape_run_id, "PENDING", "PAGE_SOURCE"
            )
            if len(scrape_run_pages) == 0:
                started_srps = get_scrape_run_pages_by_status(
                    scrape_run_id, "STARTED", "PAGE_SOURCE"
                )
                if len(started_srps) == 0:
                    break
            scrape_page_tasks = []
            for scrape_run_page in scrape_run_pages[:cost]:
                scrape_run_page.status = "STARTED"
                session.add(scrape_run_page)
                scrape_page_task = scrape_page_for_run.s(
                    project_id, scrape_run_id, scrape_run_page.id
                )
                scrape_page_tasks.append(scrape_page_task)
            session.commit()
            if throttler.consume("rate"):
                group_promise = group(scrape_page_tasks)()
                group_promises.append(group_promise)
            time.sleep(sleep_time)

        while True:
            if all([p.ready() for p in group_promises]):
                break
            time.sleep(10)

        update_stage("LEAF_SCRAPING", scrape_run_id, project_id)
        # while there are leafs in STARTED status, scrape pages
        group_promises = []
        while True:
            scrape_run_pages = get_scrape_run_pages_by_status(
                scrape_run_id, "PENDING", "LEAF"
            )
            if len(scrape_run_pages) == 0:
                break
            scrape_page_tasks = []
            for scrape_run_page in scrape_run_pages[:cost]:
                scrape_run_page.status = "STARTED"
                session.add(scrape_run_page)
                scrape_page_task = scrape_page_for_run.s(
                    project_id, scrape_run_id, scrape_run_page.id
                )
                scrape_page_tasks.append(scrape_page_task)
            session.commit()
            if throttler.consume("rate"):
                group_promise = group(scrape_page_tasks)()
                group_promises.append(group_promise)
            time.sleep(sleep_time)

        while True:
            if all([p.ready() for p in group_promises]):
                break
            time.sleep(10)

        update_stage("OUTPUT", scrape_run_id, project_id)
        # create scrape output files and upload to minio, add scrape run outputs to db
        scrape_run_pages = get_scrape_run_pages_by_status(
            scrape_run_id, "COMPLETED", "LEAF"
        )
        unique_page_template_ids = set(
            map(lambda x: x.page_template_id, scrape_run_pages)
        )
        unique_page_templates = [
            get_page_template(x, project_id) for x in unique_page_template_ids
        ]
        Path("/app/celery_file_data/scrape_run_outputs").mkdir(
            parents=True, exist_ok=True
        )
        for page_template in unique_page_templates:
            grouped_scrape_run_pages = [
                x for x in scrape_run_pages if x.page_template_id == page_template.id
            ]
            jsonl_file_path = write_to_jsonl_file(
                grouped_scrape_run_pages, scrape_run_id, page_template.id
            )
            csv_file_path = write_to_csv_file(
                grouped_scrape_run_pages, scrape_run_id, page_template.id
            )
            xlsx_file_path = write_to_xlsx_file(
                grouped_scrape_run_pages, scrape_run_id, page_template.id
            )

            jsonl_file_url = blob_store.upload_file(
                jsonl_file_path, jsonl_file_path.split("/")[-1]
            )
            csv_file_url = blob_store.upload_file(
                csv_file_path, csv_file_path.split("/")[-1]
            )
            xlsx_file_url = blob_store.upload_file(
                xlsx_file_path, xlsx_file_path.split("/")[-1]
            )
            jsonl_scrape_run_output = ScrapeRunOutput(
                format="JSONL",
                file_url=jsonl_file_url,
                scrape_run_id=scrape_run_id,
            )
            csv_scrape_run_output = ScrapeRunOutput(
                format="CSV",
                file_url=csv_file_url,
                scrape_run_id=scrape_run_id,
            )
            xlsx_scrape_run_output = ScrapeRunOutput(
                format="XLSX",
                file_url=xlsx_file_url,
                scrape_run_id=scrape_run_id,
            )
            session.add(jsonl_scrape_run_output)
            session.add(csv_scrape_run_output)
            session.add(xlsx_scrape_run_output)
            session.commit()

        # if download images are present, create a zip file
        download_images_present = False
        for pt in unique_page_templates:
            srs = get_scrape_rules(pt.id)
            if any([x.download_as_image for x in srs]) is True:
                download_images_present = True

        if download_images_present:
            local_folder_path = blob_store.download_folder(scrape_run_id)
            zip_path = f"/app/celery_file_data/temp/{scrape_run_id}"
            os.makedirs(os.path.dirname(zip_path), exist_ok=True)
            create_zip(local_folder_path, zip_path)
            blob_store.upload_file(f"{zip_path}.zip", f"{scrape_run_id}.zip")
            zip_scrape_run_output = ScrapeRunOutput(
                format="ZIP",
                file_url=f"{scrape_run_id}.zip",
                scrape_run_id=scrape_run_id,
            )
            session.add(zip_scrape_run_output)
            session.commit()

        # update scrape run status as COMPLETED
        scrape_run.status = "COMPLETED"
        scrape_run.stage = "COMPLETED"
        scrape_run.ended_on = datetime.now()
        session.add(scrape_run)
        session.commit()
    except:
        print(traceback.format_exc())
        scrape_run = get_scrape_run(scrape_run_id, project_id)
        scrape_run.status = "FAILED"
        scrape_run.stage = "COMPLETED"
        scrape_run.ended_on = datetime.now()
        session.add(scrape_run)
        session.commit()
    return


def get_image_area(url):
    try:
        req = requests.get(url, headers={"User-Agent": UserAgent().firefox})
        im = Image.open(BytesIO(req.content))
        return im.size[0] * im.size[1]
    except:
        return 0


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


@celery_app.task
def get_html_task(url, clean=True):
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


@celery_app.task
def set_favicon_url(project_id, website_url):
    project = get_project(project_id)
    favicons = []
    try:
        html_code = get_html(website_url, clean=False)
        soup = BeautifulSoup(html_code, features="lxml")
        for item in soup.find_all(
            "link", attrs={"rel": re.compile("^(shortcut icon|icon)$", re.I)}
        ):
            turl = item.get("href")
            parsed_url = urlparse(website_url)
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
        website_favicon_url = favicons[favicon_sizes.index(max(favicon_sizes))]
        project.website_favicon_url = website_favicon_url
        session.add(project)
        session.commit()
        session.refresh(project)


@celery_app.task()
def export_project_task(project_id):
    data = {}
    data["project"] = get_project(project_id).model_dump()
    data["page_templates"] = [x.model_dump() for x in get_page_templates(project_id)]
    scrape_rules = []
    for page_template in get_page_templates(project_id):
        scrape_rules += get_scrape_rules(page_template.id)
    data["scrape_rules"] = [x.model_dump() for x in scrape_rules]
    data["seed_pages"] = [x.model_dump() for x in get_seed_pages(project_id)]

    data_file_path = f"{project_id}-{str(int(time.time()))}.json"
    with open(data_file_path, "w") as f:
        json.dump(data, f)
    data_file_url = blob_store.upload_file(data_file_path, data_file_path)
    return data_file_url


@celery_app.task()
def import_project_task(data_file_url, user_id):
    data = None
    file_path = blob_store.download_file(data_file_url)
    with open(file_path) as f:
        data = json.load(f)

    def remove_id(obj):
        id = obj["id"]
        del obj["id"]
        return obj, id

    def save(obj):
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    def audit(obj):
        obj["created_by"] = user_id
        obj["modified_by"] = user_id
        return obj

    id_map = {}

    # create project
    project, project_id_old = remove_id(data["project"])
    project["user_id"] = user_id
    project = save(Project.model_validate(audit(project)))
    id_map[project_id_old] = project.id

    page_templates: List[PageTemplate] = []
    output_ptids = []
    # create page templates pass 1
    for page_template in data["page_templates"]:
        page_template, page_template_id_old = remove_id(page_template)
        page_template["project_id"] = id_map[page_template["project_id"]]
        output_ptids.append(page_template["output_page_template_id"])
        page_template["output_page_template_id"] = None
        page_template = save(PageTemplate.model_validate(audit(page_template)))
        id_map[page_template_id_old] = page_template.id
        page_templates.append(page_template)
    # create page templates pass 2
    for i, page_template in enumerate(page_templates):
        if output_ptids[i] is not None:
            page_template.output_page_template_id = id_map[output_ptids[i]]
            save(page_template)

    # create scrape rules
    for scrape_rule in data["scrape_rules"]:
        scrape_rule, scrape_rule_id_old = remove_id(scrape_rule)
        scrape_rule["page_template_id"] = id_map[scrape_rule["page_template_id"]]
        scrape_rule = save(ScrapeRule.model_validate(audit(scrape_rule)))
        id_map[scrape_rule_id_old] = scrape_rule.id

    # create seed pages
    for seed_page in data["seed_pages"]:
        seed_page, seed_page_id_old = remove_id(seed_page)
        seed_page["project_id"] = id_map[seed_page["project_id"]]
        seed_page["page_template_id"] = id_map[seed_page["page_template_id"]]
        seed_page = save(SeedPage.model_validate(audit(seed_page)))
        id_map[seed_page_id_old] = seed_page.id

    return project.id
