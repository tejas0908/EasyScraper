from app.celery.celery import celery_app
from sqlmodel import Session, select, create_engine
from app.models.project import Project
from app.models.page_template import PageTemplate
from app.models.scrape_rule import ScrapeRule
from app.models.scrape_run import ScrapeRun, ScrapeRunPage, ScrapeRunOutput
from app.models.seed_page import SeedPage
from celery import group
import time
from autoscraper import AutoScraper
import json
import csv
import xlsxwriter
import boto3
from botocore.exceptions import NoCredentialsError
import os
from pathlib import Path
from sqlalchemy.pool import NullPool
from datetime import datetime
from lxml import html
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

db_url = os.environ["DB_URL"]
engine = create_engine(db_url, echo=True, poolclass=NullPool)
session = Session(engine)


def get_auto_scraper(scrape_run_id, url, wanted_dict):
    print(f"Building auto scraper for {scrape_run_id}")
    scraper = AutoScraper()
    scraper.build(url, wanted_dict=wanted_dict)
    return scraper


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


def scrape_page_auto_scraper(scrape_run_id, page_template, scrape_rules, url):
    wanted_dict = {}
    for scrape_rule in scrape_rules:
        wanted_dict[scrape_rule.alias] = [scrape_rule.value]
    scraper = get_auto_scraper(scrape_run_id, page_template.example_url, wanted_dict)
    scrape_result = scraper.get_result_similar(url, group_by_alias=True, unique=True)
    for scrape_rule in scrape_rules:
        if scrape_rule.type == "SINGLE":
            if (
                scrape_rule.alias in scrape_result
                and len(scrape_result[scrape_rule.alias]) > 0
            ):
                scrape_result[scrape_rule.alias] = scrape_result[scrape_rule.alias][0]
            else:
                scrape_result[scrape_rule.alias] = None
    return scrape_result


def get_root_url(url):
    parsed_url = urlparse(url)
    return f"{parsed_url.scheme}://{parsed_url.netloc}"


def get_href(href, root):
    return href if href.startswith("http") else f"{root}{href}"


def scrape_page_xpath_selector(scrape_run_id, page_template, scrape_rules, url):
    root = get_root_url(url)
    response = requests.get(url)
    tree = html.fromstring(response.content)
    scrape_result = {}
    for scrape_rule in scrape_rules:
        elements = tree.xpath(scrape_rule.value)
        elements = [
            get_href(element.attrib["href"], root) if scrape_rule.href else element.text
            for element in elements
        ]
        if scrape_rule.type == "SINGLE":
            scrape_result[scrape_rule.alias] = (
                elements[0] if len(elements) > 0 else None
            )
        else:
            scrape_result[scrape_rule.alias] = elements
    return scrape_result


def scrape_page_css_selector(scrape_run_id, page_template, scrape_rules, url):
    root = get_root_url(url)
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    scrape_result = {}
    for scrape_rule in scrape_rules:
        elements = soup.select(scrape_rule.value)
        elements = [
            get_href(element.get("href"), root) if scrape_rule.href else element.text
            for element in elements
        ]
        if scrape_rule.type == "SINGLE":
            scrape_result[scrape_rule.alias] = elements[0] if elements else None
        else:
            scrape_result[scrape_rule.alias] = [element for element in elements]
    return scrape_result


def scrape_page_ai_scraper(scrape_run_id, page_template, scrape_rules, url):
    return {}


def scrape_page(scrape_run_id, page_template, scrape_rules, url):
    scrape_result = {}
    if page_template.scraper == "AUTO_SCRAPER":
        scrape_result = scrape_page_auto_scraper(
            scrape_run_id, page_template, scrape_rules, url
        )
    if page_template.scraper == "XPATH_SELECTOR":
        scrape_result = scrape_page_xpath_selector(
            scrape_run_id, page_template, scrape_rules, url
        )
    if page_template.scraper == "CSS_SELECTOR":
        scrape_result = scrape_page_css_selector(
            scrape_run_id, page_template, scrape_rules, url
        )
    if page_template.scraper == "AI_SCRAPER":
        scrape_result = scrape_page_ai_scraper(
            scrape_run_id, page_template, scrape_rules, url
        )
    return scrape_result


@celery_app.task(time_limit=60)
def scrape_page_for_run(project_id, scrape_run_id, scrape_run_page_id):
    project = get_project(project_id)
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
    except:
        scrape_run_page.status = "FAILED"
    finally:
        session.add(scrape_run_page)
        session.commit()
    time.sleep(project.sleep_seconds_between_page_scrape)
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
            json_line = json.dumps(scrape_run_page.scrape_output)
            output_file.write(json_line + "\n")
    return output_file_path


def write_to_csv_file(scrape_run_pages, scrape_run_id, page_template_id):
    output_file_path = f"/app/celery_file_data/scrape_run_outputs/{scrape_run_id}_{page_template_id}.csv"
    with open(output_file_path, "w", newline="") as csv_output_file:
        fieldnames = (
            scrape_run_pages[0].scrape_output.keys() if scrape_run_pages else []
        )
        writer = csv.DictWriter(csv_output_file, fieldnames=fieldnames)
        writer.writeheader()
        for scrape_run_page in scrape_run_pages:
            writer.writerow(scrape_run_page.scrape_output)
    return output_file_path


def write_to_xlsx_file(scrape_run_pages, scrape_run_id, page_template_id):
    # write scrape output to XLSX file
    output_file_path = f"/app/celery_file_data/scrape_run_outputs/{scrape_run_id}_{page_template_id}.xlsx"
    workbook = xlsxwriter.Workbook(output_file_path)
    worksheet = workbook.add_worksheet()

    # Write headers
    fieldnames = scrape_run_pages[0].scrape_output.keys() if scrape_run_pages else []
    for col_num, fieldname in enumerate(fieldnames):
        worksheet.write(0, col_num, fieldname)

    # Write data
    for row_num, scrape_run_page in enumerate(scrape_run_pages, start=1):
        for col_num, fieldname in enumerate(fieldnames):
            worksheet.write(
                row_num, col_num, scrape_run_page.scrape_output.get(fieldname)
            )
    workbook.close()
    return output_file_path


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


@celery_app.task
def scrape_master(project_id, scrape_run_id, resume=False):
    scrape_run = get_scrape_run(scrape_run_id, project_id)

    # add seed pages to scrape run pages, if resume then skip this step
    seed_pages = get_seed_pages(project_id)
    for seed_page in seed_pages:
        if not resume:
            page_template = get_page_template(seed_page.page_template_id, project_id)
            scrape_run_page = ScrapeRunPage(
                url=seed_page.url,
                output_type=page_template.output_type,
                page_template_id=seed_page.page_template_id,
                scrape_run_id=scrape_run_id,
                status="STARTED",
            )
            session.add(scrape_run_page)
            session.commit()

    # while there are page generators in STARTED status, scrape pages, then add more pages to scrape run pages
    while True:
        scrape_run_pages = get_scrape_run_pages_by_status(
            scrape_run_id, "STARTED", "PAGE_SOURCE"
        )
        if len(scrape_run_pages) == 0:
            break
        scrape_page_tasks = []
        for scrape_run_page in scrape_run_pages:
            scrape_page_task = scrape_page_for_run.s(
                project_id, scrape_run_id, scrape_run_page.id
            )
            scrape_page_tasks.append(scrape_page_task)
        group_promise = group(scrape_page_tasks)()
        while not group_promise.ready():
            print(
                "page generator scraping complete => ", group_promise.completed_count()
            )
            time.sleep(10)
        group_results = group_promise.get(disable_sync_subtasks=False)
        for group_result in group_results:
            urls = group_result[0]["urls"]
            output_page_template_id = group_result[1]
            output_page_template = get_page_template(
                output_page_template_id, project_id
            )
            for url in urls:
                scrape_run_page = ScrapeRunPage(
                    url=url,
                    output_type=output_page_template.output_type,
                    page_template_id=output_page_template_id,
                    scrape_run_id=scrape_run_id,
                    status="STARTED",
                )
                session.add(scrape_run_page)
                session.commit()

    # while there are leafs in STARTED status, scrape pages
    while True:
        scrape_run_pages = get_scrape_run_pages_by_status(
            scrape_run_id, "STARTED", "LEAF"
        )
        if len(scrape_run_pages) == 0:
            break
        scrape_page_tasks = []
        for scrape_run_page in scrape_run_pages:
            scrape_page_task = scrape_page_for_run.s(
                project_id, scrape_run_id, scrape_run_page.id
            )
            scrape_page_tasks.append(scrape_page_task)
        group_promise = group(scrape_page_tasks)()
        while not group_promise.ready():
            print("leaf scraping complete => ", group_promise.completed_count())
            time.sleep(10)

    # create scrape output files and upload to minio, add scrape run outputs to db
    scrape_run_pages = get_scrape_run_pages_by_status(
        scrape_run_id, "COMPLETED", "LEAF"
    )
    unique_page_template_ids = set(map(lambda x: x.page_template_id, scrape_run_pages))
    unique_page_templates = [
        get_page_template(x, project_id) for x in unique_page_template_ids
    ]
    Path("/app/celery_file_data/scrape_run_outputs").mkdir(parents=True, exist_ok=True)
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
        jsonl_file_url = upload_to_minio(jsonl_file_path)
        csv_file_url = upload_to_minio(csv_file_path)
        xlsx_file_url = upload_to_minio(xlsx_file_path)
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

    # update scrape run status as COMPLETED
    scrape_run.status = "COMPLETED"
    scrape_run.ended_on = datetime.now()
    session.add(scrape_run)
    session.commit()

    return
