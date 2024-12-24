ALTER TABLE public.user
    add email varchar null,
    add avatar_url varchar null,
    alter "password" drop not null,
    alter "password" set default null;