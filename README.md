# EasyScraper

## Backlog
- [x] User can signup for a new account
- [x] User can login to account
- [x] User can create Scraping Projects
- [x] User can define Page Templates
- [x] User can define Seed Pages
- [x] User can trigger scraping for the project (each scrape run generate an output)
- [x] User can use xpath, css, auto scraper or AI scraper
- [x] User can set scrape settings- Sleep time between page scrapes
- [x] User can perform a scrape test by providing URL and Page Template
- [ ] User can import/export projects as JSON

# Architecture

## Tech Stack

![Tech Stack](docs/plantuml/output/tech-stack.png)

## Use Case Diagram

![Use case diagram](docs/plantuml/output/use-case-diagram.png)

## Database Design

![Database design](docs/plantuml/output/db-schema.png)

## Deployment View

![Deployment View](docs/plantuml/output/deployment.jpg)

## Sequence Diagrams

![User Signup Sequence Diagram](docs/plantuml/output/sequence-signup.png)
![User Login Sequence Diagram](docs/plantuml/output/sequence-login.png)

## API documentation

https://tejas0908.github.io/EasyScraper/

Re-build api documentation
```bash
docker compose up -d --build
wget http://localhost:8000/openapi.json -O docs/openapi.json
npx @redocly/cli build-docs docs/openapi.json -o docs/index.html
```