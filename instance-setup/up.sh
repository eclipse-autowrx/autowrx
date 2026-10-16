# Start the instance and wait until all containers are healthy.
# WAIT_TIMEOUT (seconds) bounds how long `docker compose up --wait` blocks.

WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"

if ! docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --wait --wait-timeout "$WAIT_TIMEOUT"; then
    echo "ERROR: services did not become healthy within ${WAIT_TIMEOUT}s" >&2
    docker compose -f docker-compose.prod.yml --env-file .env.prod ps >&2 || true
    docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=100 autowrx >&2 || true
    exit 1
fi
