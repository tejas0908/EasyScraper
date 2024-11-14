import requests
from bs4 import BeautifulSoup
from lxml import html
from urllib.parse import urlparse


class ScrapeRule:
    def __init__(self, alias, type, value, href=False):
        self.alias = alias
        self.type = type
        self.value = value
        self.href = href


def get_root_url(url):
    parsed_url = urlparse(url)
    return f"{parsed_url.scheme}://{parsed_url.netloc}"


def get_href(href, root):
    return href if href.startswith("http") else f"{root}{href}"


def scrape_page_xpath_selector(scrape_rules, url):
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


def scrape_page_css_selector(scrape_rules, url):
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


category_url = "https://www.wolford.com/en-us/shapewear/bodies-and-dresses/"
category_scrape_rules_xpath = [
    ScrapeRule(
        alias="urls",
        type="MULTI",
        value='//div[contains(@class,"product-tile")]//a[contains(@class,"image-tile-link")]',
        href=True,
    )
]
print(scrape_page_xpath_selector(category_scrape_rules_xpath, category_url))
category_scrape_rules_css = [
    ScrapeRule(
        alias="urls",
        type="MULTI",
        value="div.product-tile a.image-tile-link",
        href=True,
    )
]
print(scrape_page_css_selector(category_scrape_rules_css, category_url))
