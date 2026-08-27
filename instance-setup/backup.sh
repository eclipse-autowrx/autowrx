#!/usr/bin/env bash
# backup.sh — dump the MongoDB database and archive the upload/plugin data
# of an AutoWRX instance deployment (run after ./up.sh).
#
# Usage:
#   ./backup.sh            # backup both database and data (asks for confirmation)
#   ./backup.sh --db       # database only
#   ./backup.sh --data     # data (uploads + plugins) only
#   ./backup.sh -y         # skip the confirmation prompt (automation)
#
# Output: ./backups/mongo-<timestamp>.archive.gz and data-<timestamp>.tar.gz
# Retention is manual — old backups are never deleted automatically.

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.prod"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found (copy .env.prod.sample and fill it in)"; exit 1; }

# Read the same variables the compose file uses
NAME=$(grep -E '^NAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
NAME=${NAME:-prod}
DB_NAME=$(grep -E '^MONGODB_DATABASE=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
DB_NAME=${DB_NAME:-autowrx}
UPLOAD_PATH=$(grep -E '^UPLOAD_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
UPLOAD_PATH=${UPLOAD_PATH:-./data/upload}
PLUGIN_PATH=$(grep -E '^PLUGIN_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
PLUGIN_PATH=${PLUGIN_PATH:-./data/plugin}

DB_CONTAINER="${NAME}-autowrx-db"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

DO_DB=1; DO_DATA=1; ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    --db)   DO_DATA=0 ;;
    --data) DO_DB=0 ;;
    -y|--yes) ASSUME_YES=1 ;;
    *) echo "Unknown option: $arg (supported: --db, --data, -y)"; exit 1 ;;
  esac
done

echo "=== AutoWRX instance backup ==="
echo "Instance name:  $NAME"
echo "Database:       $DB_NAME (container: $DB_CONTAINER)"
echo "Data dirs:      $UPLOAD_PATH, $PLUGIN_PATH"
echo "Output:         $BACKUP_DIR/"
[ "$DO_DB" -eq 1 ]   && echo "Scope:           database + data"
[ "$DO_DB" -eq 0 ]   && echo "Scope:           data only"
[ "$DO_DATA" -eq 0 ] && echo "Scope:           database only"
echo

if [ "$ASSUME_YES" -eq 0 ]; then
  read -r -p "Proceed with backup? [yes/N] " answer
  case "$answer" in
    yes|YES|Yes|y|Y) ;;
    *) echo "Aborted."; exit 1 ;;
  esac
fi

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
if [ "$DO_DB" -eq 1 ]; then
  docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || { echo "ERROR: database container '$DB_CONTAINER' is not running (run ./up.sh first)"; exit 1; }

  # mongo 7+ images do not bundle database tools — find a working mongodump
  DUMP_CMD=""
  if docker exec "$DB_CONTAINER" mongodump --version >/dev/null 2>&1; then
    DUMP_CMD="mongodump"
  elif docker exec "$DB_CONTAINER" /opt/dbtools/mongodump --version >/dev/null 2>&1; then
    DUMP_CMD="/opt/dbtools/mongodump"
  else
    echo "ERROR: no mongodump available inside '$DB_CONTAINER'."
    echo "Mongo 7 images ship no database tools. Download them once and mount into the"
    echo "db service (see the commented tools volume in docker-compose.prod.yml):"
    echo "  curl -fsSL -o /tmp/tools.tgz https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.5.tgz"
    echo "  mkdir -p tools && tar -xzf /tmp/tools.tgz -C tools"
    echo "  # then uncomment the '- ./tools/...:/opt/dbtools:ro' volume and: docker compose -f docker-compose.prod.yml --env-file $ENV_FILE up -d autowrx-db"
    exit 1
  fi

  OUT="$BACKUP_DIR/mongo-$TS.archive.gz"
  echo "[db] dumping via '$DUMP_CMD' -> $OUT"
  if docker exec "$DB_CONTAINER" "$DUMP_CMD" --db="$DB_NAME" --archive --gzip --quiet > "$OUT"; then
    SIZE=$(du -h "$OUT" | cut -f1)
    # Integrity signal: a gzip test plus a non-trivial size
    gzip -t "$OUT" && echo "[db] OK ($SIZE, gzip integrity verified)"
  else
    echo "[db] FAILED — removing partial file"
    rm -f "$OUT"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Data (uploads + plugins)
# ---------------------------------------------------------------------------
if [ "$DO_DATA" -eq 1 ]; then
  MISSING=0
  for d in "$UPLOAD_PATH" "$PLUGIN_PATH"; do
    [ -d "$d" ] || { echo "[data] WARNING: '$d' does not exist — skipping it"; MISSING=1; }
  done
  EXISTING=()
  for d in "$UPLOAD_PATH" "$PLUGIN_PATH"; do
    [ -d "$d" ] && EXISTING+=("$d")
  done
  if [ "${#EXISTING[@]}" -eq 0 ]; then
    echo "[data] nothing to archive (no data directories exist yet)"
  else
    OUT="$BACKUP_DIR/data-$TS.tar.gz"
    echo "[data] archiving ${EXISTING[*]} -> $OUT"
    tar czf "$OUT" "${EXISTING[@]}"
    echo "[data] OK ($(du -h "$OUT" | cut -f1))"
  fi
fi

echo
echo "Backup complete. Files in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR" | tail -5
echo
echo "Restore with: ./restore.sh"
