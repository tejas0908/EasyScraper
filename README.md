# EasyScraper

## Backlog
- [x] User can signup for a new account
- [x] User can login to account
- [x] User can create Scraping Projects
- [x] User can define Page Templates
- [ ] User can define Seed Pages
- [ ] Saving Page Templates auto builds the scraper
- [ ] User can trigger scraping for the project (each scrape run generate an output)
- [ ] Scrape Runs can be resumed if they are interrupted by failures
- [ ] User can set scrape settings- Sleep time between page scrapes
- [ ] User can perform a scrape test by providing URL and Page Template

# Architecture

# Tech Stack

![Tech Stack](plantuml/output/tech-stack.png)

## Use Case Diagram

![Use case diagram](plantuml/output/use-case-diagram.png)

## Database Design

![Database design](plantuml/output/db-schema.png)

## API documentation

https://tejas0908.github.io/EasyScraper/

Re-build api documentation
```bash
docker compose up --build
wget http://localhost:8000/openapi.json -O docs/openapi.json
npx @redocly/cli build-docs docs/openapi.json -o docs/index.html
```