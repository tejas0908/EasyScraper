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

![Use case diagram](plantuml/output/use-case-diagram.png)

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
