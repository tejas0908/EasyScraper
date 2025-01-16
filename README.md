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

# BLOB_STORE can be 'fs' or 's3'
BLOB_STORE=s3
S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_DEFAULT_REGION=us-east-1
S3_BUCKET=easyscraper
#FS_PATH=/blob_store/data

POSTGRES_USER=xxx
POSTGRES_PASSWORD=xxx
POSTGRES_DB=xxx
OPENAI_API_KEY=xxx
TOKEN_EXPIRY_MINUTES=1440
FLYWAY_DB_URL=jdbc:postgresql://postgres:5432/postgres
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

## Instructions to Run

1. Create a `.env` file in the root of the repository with above format (Replace the xxx with real values)
2. `docker compose --profile minio up -d --build`
3. Go to http://localhost:3000 on the browser
4. Signup for a new account
5. Login with username and password
6. Create and Configure a project
7. Execute a scrape
8. Download Scrape output file
