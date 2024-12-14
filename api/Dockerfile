FROM ghcr.io/astral-sh/uv:python3.13-bookworm

RUN apt install curl -y

WORKDIR /app

ADD pyproject.toml /app
ADD uv.lock /app

RUN uv sync --frozen && \
    uv run playwright install-deps firefox && \
    uv run playwright install firefox

ADD . /app

CMD ["uv", "run", "fastapi", "run", "server.py", "--port", "8000"]