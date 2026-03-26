#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

docker compose \
  --project-directory "${REPO_ROOT}" \
  -f "${SCRIPT_DIR}/docker-compose.prod.yml" \
  --env-file "${SCRIPT_DIR}/.env.prod" \
  up -d --build
