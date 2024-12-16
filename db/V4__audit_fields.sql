ALTER TABLE public.project
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_project_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_project_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.pagetemplate
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_pagetemplate_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_pagetemplate_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.scraperule
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_scraperule_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_scraperule_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.seedpage
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_seedpage_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_seedpage_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.scraperun
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_scraperun_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_scraperun_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.scraperunpage
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_scraperunpage_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_scraperunpage_modified_by foreign key (modified_by) references public.user (id) on delete set null;

ALTER TABLE public.scraperunoutput
    add created_on timestamp without time zone null,
    add created_by varchar null,
    add modified_on timestamp without time zone null,
    add modified_by varchar null,
    add constraint fk_scraperunoutput_created_by foreign key (created_by) references public.user (id) on delete set null,
    add constraint fk_scraperunoutput_modified_by foreign key (modified_by) references public.user (id) on delete set null;