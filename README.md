# EasyScraper

![GitHub Release](https://img.shields.io/github/v/release/tejas0908/easyscraper)
![GitHub License](https://img.shields.io/github/license/tejas0908/easyscraper)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/tejas0908/EasyScraper/push.yaml)



[![Static Badge](https://img.shields.io/badge/Dockerhub%20API%20image-blue?logo=docker&logoColor=white)](https://hub.docker.com/r/tejas0908/easyscraper-api)
![Docker Pulls - API](https://img.shields.io/docker/pulls/tejas0908/easyscraper-api)

[![Static Badge](https://img.shields.io/badge/Dockerhub%20UI%20image-blue?logo=docker&logoColor=white)](https://hub.docker.com/r/tejas0908/easyscraper-ui)
![Docker Pulls - UI](https://img.shields.io/docker/pulls/tejas0908/easyscraper-ui)


## Env format

```.env
API_BASE_URL=http://localhost:8000
DB_URL=postgresql://postgres:xxx@xxx:5432/postgres
JWT_SECRET=xxx
BROKER_URL=redis://redis:6379/0
RESULT_BACKEND=redis://redis:6379/0
MINIO_ROOT_USER=xxx
MINIO_ROOT_PASSWORD=xxx
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_DEFAULT_BUCKET=easyscraper
MINIO_URL=http://minio:9000
POSTGRES_USER=xxx
POSTGRES_PASSWORD=xxx
POSTGRES_DB=xxx
OPENAI_API_KEY=xxx
TOKEN_EXPIRY_MINUTES=1440
FLYWAY_DB_URL=jdbc:postgresql://postgres:5432/postgres
```

## Instructions to Run

1. Create a `.env` file in the root of the repository with above format (Replace the xxx with real values)
1. `docker compose up`
2. Go to http://localhost:3000 on the browser
3. Signup for a new account
4. Login with username and password
5. Create and Configure a project
6. Execute a scrape
7. Download Scrape output file

## Linting
```bash
uv run pylint --recursive=y app
uv run flake8 app
uv run mypy app
```