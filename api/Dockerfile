FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

RUN apt-get update -y && \
    apt-get install curl -y

ADD . /app

WORKDIR /app

RUN uv sync --frozen

CMD ["uv", "run", "fastapi", "run", "server.py", "--port", "8000"]