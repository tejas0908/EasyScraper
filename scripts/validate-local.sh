#!/bin/sh
set -eu

# Use an explicit context so validation never changes the caller's Docker context.
context=${DOCKER_VALIDATION_CONTEXT:-orbstack}
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
name="easyscraper-validation-$$"
ui="$name-ui"
api="$name-api"
docker_cmd() { docker --context "$context" "$@"; }
cleanup() { docker_cmd rm -f "$ui" "$api" >/dev/null 2>&1 || true; }
trap cleanup EXIT HUP INT TERM

docker_cmd build -t "$ui" "$root/ui"
docker_cmd build -t "$api" "$root/api"
# No host ports or external services are used. Placeholder settings only permit
# process startup; this does not test database, OAuth, or scraping integration.
docker_cmd run -d --name "$ui" --network none "$ui" >/dev/null
docker_cmd run -d --name "$api" --network none \
  -e DB_URL=postgresql://local:local@localhost:5432/local \
  -e JWT_SECRET=local-validation-only -e BROKER_URL=redis://localhost:6379/0 \
  -e RESULT_BACKEND=redis://localhost:6379/0 -e BLOB_STORE=fs \
  -e FS_PATH=/tmp -e OPENAI_API_KEY=local-validation-only \
  -e TOKEN_EXPIRY_MINUTES=60 "$api" >/dev/null

wait_for_health() {
  container=$1
  url=$2
  attempt=0
  until docker_cmd exec "$container" curl -fsS "$url" >/dev/null; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
      docker_cmd logs "$container"
      return 1
    fi
    sleep 1
  done
}
wait_for_health "$ui" http://localhost:3000/api/health
wait_for_health "$api" http://localhost:8000/health
docker_cmd exec "$ui" curl -fsS http://localhost:3000/login >/dev/null
status=$(docker_cmd exec "$ui" curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard)
[ "$status" = 307 ] || { echo "Expected dashboard redirect, got $status" >&2; exit 1; }
echo 'UI and API image builds and smoke checks passed.'
