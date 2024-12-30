export interface Project {
  id: string;
  name: string;
  website_url: string;
  website_favicon_url: string;
  rate_count: number;
  rate_time_unit: string;
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
  started_on: string;
  ended_on: string;
  status: string;
  stage: string;
  project_id: string;
  run_time: number;
  outputs: { id: string; format: string }[];
  total_discovered_pages: number;
  total_successful_scraped_pages: number;
  total_failed_scraped_pages: number;
  progress: number;
}

export interface SeedPage {
  id: string;
  url: string;
  page_template_id: string;
  page_template: PageTemplate;
  project_id: string;
}
