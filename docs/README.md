# Architecture

## Tech Stack

```mermaid
%%{
    init: {
        'theme': 'neutral'
    }
}%%
mindmap
    Tech Stack
        UI
            NextJS
            ReactJS
            Shadcn
        API
            UV
            FastAPI
            Python
        DB
            Postgres
            Minio
        Scraper
            Celery
            Redis
```

## Use Case Diagram

```mermaid
%%{
    init: {
        'theme': 'neutral'
    }
}%%
timeline
    title User Journey
    Authentication : User can signup for account : User can login to account
    Project Creation : User can create a new project : User can import project from a file
    Project Configuration : User can create or edit page template : User can create or update scrape rules : User can create or update seed pages : User can update project settings
    Project Run : User executes scrape test : User triggers scrape runs : User views scrape run status : User downloads scrape output files
    Others : User can export project as a file
```

## Database Design

```mermaid
%%{
    init: {
        'theme': 'neutral'
    }
}%%
erDiagram
    User{
        ulid id PK
        string username
        hashed password
    }
    Project{
        ulid id PK
        string name
        integer sleep_seconds_between_page_scrape
        boolean ignore_scrape_failures
        ulid user_id FK
    }
    PageTemplate{
        ulid id PK
        string name
        Enum output_type "PAGE_SOURCE, LEAF"
        Enum scraper "XPATH_SELECTOR, AI_SCRAPER"
        string example_url
        string ai_prompt
        Enum ai_input "HTML, TEXT"
        ulid output_page_template_id FK
        ulid project_id FK
    }
    SeedPage{
        ulid id PK
        string url
        ulid page_template_id FK
        ulid project_id FK
    }
    ScrapeRule{
        ulid id PK
        string alias
        Enum type "SINGLE, MULTI"
        string value
        ulid page_template_id FK
    }
    ScrapeRun{
        ulid id PK
        long started_on
        long ended_on
        Enum status "STARTED, COMPLETED, FAILED"
        ulid project_id FK
    }
    ScrapeRunPage{
        ulid id PK
        string url
        JSON scrape_output
        Enum status "STARTED, COMPLETED, FAILED"
        Enum output_type "PAGE_SOURCE, LEAF"
        ulid page_template_id FK
        ulid scrape_run_id FK
    }
    ScrapeRunOutput{
        ulid id PK
        Enum format "JSONL, CSV, XLSX"
        string file_url
        ulid scrape_run_id FK
    }
    User ||--|{ Project : has
    Project ||--|{ SeedPage : has
    Project ||--|{ PageTemplate: has
    PageTemplate ||--|{ ScrapeRule: has
    Project ||--|{ ScrapeRun : has
    ScrapeRun ||--|{ ScrapeRunPage : has
    ScrapeRun ||--|{ ScrapeRunOutput : has
    SeedPage ||--|{ PageTemplate : has
```

## Deployment View

![Deployment View](plantuml/output/deployment.png)

## Sequence Diagrams

![User Signup Sequence Diagram](plantuml/output/sequence-signup.png)
![User Login Sequence Diagram](plantuml/output/sequence-login.png)

## API documentation

https://tejas0908.github.io/EasyScraper/

Re-build api documentation

```bash
docker compose up -d --build
wget http://localhost:8000/openapi.json -O docs/openapi.json
npx @redocly/cli build-docs docs/openapi.json -o docs/index.html
```
