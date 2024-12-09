## Backlog
- [ ] Import / Export Project in JSON format
- [ ] Kubernetes helm chart
- [ ] Github actions for build and push to dockerhub
- [ ] blob store interface (Minio Impl, S3 Impl)
- [ ] scraper interface (Xpath Impl, CSS Impl, Autoscraper Impl, AI Impl)
- [ ] api documentation - add more field level details
- [ ] model provider support (OpenAI Impl, Ollama Impl, ...)
- [ ] login with github option
- [ ] rate limited scraping
- [ ] use litellm for AI calls
- [ ] chrome extension to extract xpaths and css selectors?
- [ ] signup takes first and lastname
- [ ] auto logout if token expires
- [ ] pagination changes (next page / total records)
- [ ] add pagination to page templates, scrape rules, seed pages and scrape runs
- [ ] scrape output interface (JSONL Impl, CSV Impl, XLSX Impl)
- [ ] dashboard analytics and per project analytics (Total projects, Total Scrape runs, Scrape run pie chart, Scrape pages pie chart)
- [ ] download images for scraped links
- [ ] playwright automated testing
- [ ] fix lint issues on ui
- [ ] project takes website url input, extract favicon and display
- [ ] documentation
- [ ] flyway db migrations

# Architecture

## Tech Stack

![Tech Stack](plantuml/output/tech-stack.png)

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