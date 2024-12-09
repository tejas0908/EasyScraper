FROM ghcr.io/astral-sh/uv:python3.13-alpine

RUN apk --no-cache add curl

ADD . /app

WORKDIR /app

RUN uv sync --frozen

CMD ["uv", "run", "fastapi", "run", "server.py", "--port", "8000"]