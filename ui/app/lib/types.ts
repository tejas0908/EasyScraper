
export interface Project {
    id: string;
    name: string;
    ignore_scrape_failures: boolean;
    sleep_seconds_between_page_scrape: number;
}

export interface PageTemplate {
    id: string;
    name: string;
    output_type: string;
    example_url: string;
    ai_input: string;
    scraper: string;
    ai_prompt: string;
    output_page_template_id: string;
    project_id: string;
}

export interface ScrapeRule {
    id: string;
    alias: string;
    type: string;
    value: string;
    href: boolean;
    page_template_id: string;
}

export interface ScrapeRun {
    id: string;
    started_on: number;
    ended_on: number;
    status: string;
    project_id: string;
}

export interface SeedPage {
    id: string;
    url: string;
    page_template_id: string;
    project_id: string;
}
