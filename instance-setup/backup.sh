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
# Output: ./backups/autowrx-backup-<timestamp>.zip containing:
#   - INFO.txt            (instance name, database, source paths, created date)
#   - .env.prod           (the instance configuration — needed for consistent restore)
#   - mongo.archive.gz    (the database dump)
#   - data.tar.gz         (uploads + plugins)
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
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$BACKUP_DIR"
ZIP="$BACKUP_DIR/autowrx-backup-$TS.zip"

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
if [ "$DO_DB" -eq 1 ]; then echo "Scope:           database + data"; fi
if [ "$DO_DB" -eq 0 ]; then echo "Scope:           data only"; fi
if [ "$DO_DATA" -eq 0 ]; then echo "Scope:           database only"; fi
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

  OUT="$STAGE/mongo.archive.gz"
  echo "[db] dumping via '$DUMP_CMD'"
  if docker exec "$DB_CONTAINER" "$DUMP_CMD" --db="$DB_NAME" --archive --gzip --quiet > "$OUT"; then
    SIZE=$(du -h "$OUT" | cut -f1 || true)
    gzip -t "$OUT" && echo "[db] OK ($SIZE, gzip integrity verified)"
  else
    echo "[db] FAILED — aborting (no zip written)"
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
    OUT="$STAGE/data.tar.gz"
    echo "[data] archiving ${EXISTING[*]}"
    tar czf "$OUT" "${EXISTING[@]}"
    echo "[data] OK ($(du -h "$OUT" | cut -f1 || true))"
  fi
fi

# ---------------------------------------------------------------------------
# INFO.txt — proves what this backup is and where it came from
# ---------------------------------------------------------------------------
cat > "$STAGE/INFO.txt" <<INFO
AutoWRX instance backup
=======================
Created (UTC): $(date -u '+%Y-%m-%d %H:%M:%S')
Instance name: $NAME
Database:      $DB_NAME   (container: $DB_CONTAINER)
Data paths:    $UPLOAD_PATH, $PLUGIN_PATH
Contents:
  INFO.txt         this file
  .env.prod        instance configuration used at backup time
  mongo.archive.gz MongoDB dump of database '$DB_NAME' (mongodump --archive --gzip)
  data.tar.gz      uploads + plugin data (tar of the paths above)
Restore: unzip, then ./restore.sh --mongo mongo.archive.gz --data data.tar.gz
        (restore validates that the instance/database match this file's values)
INFO

# Include the instance env so restore is self-consistent
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$STAGE/$ENV_FILE"
  echo "[env] $ENV_FILE included in the zip"
else
  echo "[env] WARNING: $ENV_FILE not found — zip has no env (restore will use the current one)"
fi

echo
echo "[zip] writing $ZIP"
if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE" && zip -q -r "$OLDPWD/$ZIP" .)
else
  # No zip binary: use python's zipfile (always available in the container host images we support)
  python3 - "$STAGE" "$ZIP" <<'PY'
import sys, os, zipfile
stage, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(stage):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, stage))
PY
fi
echo "[zip] OK ($(du -h "$ZIP" | cut -f1 || true))"
echo
echo "Backup complete: $ZIP"
echo "Contents: $(unzip -l "$ZIP" 2>/dev/null | tail -1 || python3 -c "import zipfile,sys; print(sum(i.file_size for i in zipfile.ZipFile('$ZIP').infolist()), 'bytes')")"
echo
echo "Restore with: ./restore.sh"
