ALTER TABLE public.project
    add rate_count integer null,
    add rate_time_unit varchar null,
    drop sleep_seconds_between_page_scrape,
    drop ignore_scrape_failures;