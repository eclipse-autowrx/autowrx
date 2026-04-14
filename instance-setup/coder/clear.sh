#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/coder-docker-compose.yml"

echo "[clear] Stopping Coder compose stack..."
docker compose -f "${COMPOSE_FILE}" down -v || true

echo "[clear] Removing workspace containers..."
mapfile -t workspace_containers < <(docker ps -aq --filter "label=coder.workspace_id")
if ((${#workspace_containers[@]} > 0)); then
  docker rm -f "${workspace_containers[@]}"
else
  echo "[clear] No workspace containers found."
fi

echo "[clear] Removing workspace-labeled Docker volumes..."
mapfile -t workspace_labeled_volumes < <(docker volume ls -q --filter "label=coder.workspace_id")
if ((${#workspace_labeled_volumes[@]} > 0)); then
  docker volume rm "${workspace_labeled_volumes[@]}" || true
else
  echo "[clear] No workspace-labeled volumes found."
fi

echo "[clear] Removing workspace home volumes..."
mapfile -t workspace_home_volumes < <(docker volume ls --format '{{.Name}}' | rg '^coder-.*-home$')
if ((${#workspace_home_volumes[@]} > 0)); then
  docker volume rm "${workspace_home_volumes[@]}" || true
else
  echo "[clear] No workspace home volumes found."
fi

echo "[clear] Done."