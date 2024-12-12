-- User
CREATE TABLE public.user (
    id varchar not null,
    username varchar(20) not null,
    "password" varchar(500) not null,
    constraint user_pkey primary key (id)
);

-- Project
CREATE TABLE public.project (
    id varchar not null,
    "name" varchar(100) not null,
    sleep_seconds_between_page_scrape integer not null,
    ignore_scrape_failures boolean not null,
    user_id varchar not null,
    constraint project_pkey primary key (id),
    constraint fk_project_user foreign key (user_id) references public.user (id) on delete cascade
);

-- Page Template
CREATE TABLE public.pagetemplate (
    id varchar not null,
    "name" varchar(100) not null,
    output_type varchar not null,
    scraper varchar not null,
    example_url varchar(1000) NULL,
    ai_prompt varchar(1000) NULL,
    ai_input varchar NULL,
    output_page_template_id varchar NULL,
    project_id varchar not null,
    constraint pagetemplate_pkey primary key (id),
    constraint fk_pagetemplate_pagetemplate foreign key (output_page_template_id) references public.pagetemplate (id) on delete cascade,
    constraint fk_pagetemplate_project foreign key (project_id) references public.project (id) on delete cascade
);

-- Scrape Rule
CREATE TABLE public.scraperule (
    id varchar not null,
    alias varchar(100) not null,
    "type" varchar not null,
    "value" varchar(1000) NULL,
    href boolean NULL,
    page_template_id varchar NULL,
    constraint scraperule_pkey primary key (id),
    constraint fk_scraperule_pagetemplate foreign key (page_template_id) references public.pagetemplate (id) on delete cascade
);

-- Seed Page
CREATE TABLE public.seedpage (
    id varchar not null,
    "url" varchar not null,
    page_template_id varchar not null,
    project_id varchar not null,
    constraint seedpage_pkey primary key (id),
    constraint fk_seedpage_pagetemplate foreign key (page_template_id) references public.pagetemplate (id) on delete cascade,
    constraint fk_seedpage_project foreign key (project_id) references public.project (id) on delete cascade
);

-- Scrape Run
CREATE TABLE public.scraperun (
    id varchar not null,
    started_on timestamp without time zone not null,
    ended_on timestamp without time zone NULL,
    "status" varchar not null,
    stage varchar not null,
    project_id varchar not null,
    constraint scraperun_pkey primary key (id),
    constraint fk_scraperun_project foreign key (project_id) references public.project (id) on delete cascade
);

-- Scrape Run Page
CREATE TABLE public.scraperunpage (
    id varchar not null,
    "url" varchar not null,
    scrape_output json NULL,
    "status" varchar not null,
    output_type varchar not null,
    page_template_id varchar not null,
    scrape_run_id varchar not null,
    constraint scraperunpage_pkey primary key (id),
    constraint fk_scraperunpage_scraperun foreign key (scrape_run_id) references public.scraperun (id) on delete cascade,
    constraint fk_scraperunpage_pagetemplate foreign key (page_template_id) references public.pagetemplate (id) on delete cascade
);

-- Scrape Run Output
CREATE TABLE public.scraperunoutput (
    id varchar not null,
    format varchar not null,
    file_url varchar not null,
    scrape_run_id varchar not null,
    constraint scraperunoutput_pkey primary key (id),
    constraint fk_scraperunoutput_scraperun foreign key (scrape_run_id) references public.scraperun (id) on delete cascade
);
