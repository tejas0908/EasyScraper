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

![Database design](plantuml/output/db-schema.png)

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
