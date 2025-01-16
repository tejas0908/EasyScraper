# Architecture

## Tech Stack

```mermaid
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
erDiagram
    User{
        ulid id PK
        string username
        hashed password
        string full_name
        string email
        string avatar_url
    }
    Project{
        ulid id PK
        string name
        string website_url
        string website_favicon_url
        integer rate_count
        Enum rate_time_unit "SECOND, MINUTE"
        ulid user_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
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
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
    }
    SeedPage{
        ulid id PK
        string url
        ulid page_template_id FK
        ulid project_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
    }
    ScrapeRule{
        ulid id PK
        string alias
        string description
        Enum type "SINGLE, MULTI"
        string value
        boolean download_as_image
        ulid page_template_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
    }
    ScrapeRun{
        ulid id PK
        long started_on
        long ended_on
        Enum status "STARTED, COMPLETED, FAILED"
        Enum stage "CREATED, STARTED, PAGE_GENERATION, LEAF_SCRAPING, OUTPUT, COMPLETED"
        ulid project_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
    }
    ScrapeRunPage{
        ulid id PK
        string url
        JSON scrape_output
        Enum status "PENDING, STARTED, COMPLETED, FAILED"
        Enum output_type "PAGE_SOURCE, LEAF"
        ulid page_template_id FK
        ulid scrape_run_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
    }
    ScrapeRunOutput{
        ulid id PK
        Enum format "JSONL, CSV, XLSX, ZIP"
        string file_url
        ulid scrape_run_id FK
        datetime created_on
        datetime modified_on
        string created_by
        string modified_by
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

```mermaid
architecture-beta
    group dc(cloud)[Docker Compose]

    service ui(server)[UI] in dc
    service api(server)[API] in dc
    service redis(database)[Redis] in dc
    service minio(disk)[Minio] in dc
    service postgres(database)[Postgres] in dc
    service celery(server)[Celery Workers] in dc
    junction junction1 in dc
    junction junction2 in dc
    junction junction3 in dc
    junction junction4 in dc

    service browser(internet)[Browser]
    service ew(internet)[External Website]

    browser:R --> L:ui
    ui:R --> L:api
    celery:R --> L:ew
    api:R --> L:redis
    redis:R <-- L:celery
    api:T -- B:junction1
    junction1:R --> L:minio
    minio:R <-- L:junction2
    junction2:B -- T:celery
    api:B -- T:junction3
    junction3:R --> L:postgres
    celery:B -- T:junction4
    junction4:L --> R:postgres
```

## Sequence Diagrams

```mermaid
sequenceDiagram
    title User Signup Sequence Diagram
    participant browser as browser
    participant ui as UI
    participant api as API
    participant db as Postgres

    browser ->> ui : User signup page
    ui ->> browser : signup form
    browser ->> ui : username + password
    ui ->> api : POST /user/signup
    api ->> db : check if user exists
    api ->> api : hash password
    api ->> db : insert user
    api ->> ui : JWT Token
    ui ->> ui : save token
    ui ->> browser : redirect to home page
```

```mermaid
sequenceDiagram
    title User Login Sequence Diagram
    participant browser as browser
    participant ui as UI
    participant api as API
    participant db as Postgres

    browser ->> ui : Home Page
    ui ->> ui : check if token exists and valid
    ui ->> browser : redirect to login page
    browser ->> ui : User Login Page
    ui ->> browser : login form
    browser ->> ui : username + password
    ui ->> api : POST /user/login
    api ->> db : check if user exists
    api ->> api : verify password using hash comparision
    api ->> api : generate JWT token
    api ->> ui : JWT token
    ui ->> ui : save token
    ui ->> browser : redirect to home page
```

## API documentation

https://tejas0908.github.io/EasyScraper/

Re-build api documentation

```bash
docker compose up -d --build
wget http://localhost:8000/openapi.json -O docs/openapi.json
npx @redocly/cli build-docs docs/openapi.json -o docs/index.html
```
