#!/usr/bin/env bash
# restore.sh — restore the MongoDB database and/or upload/plugin data of an
# AutoWRX instance deployment from files produced by ./backup.sh
#
# Usage:
#   ./restore.sh                        # interactive: pick a backup, confirm, restore both
#   ./restore.sh --mongo <file>         # restore database from a specific archive
#   ./restore.sh --data <file>          # restore data from a specific tarball
#
# Destructive: the database restore uses --drop (each collection is replaced)
# and the data restore overwrites the upload/plugin directories. The app
# container is stopped before restore and restarted after, so no writes race
# the restore. You will be asked to confirm — read the summary carefully.

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.prod"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found"; exit 1; }

NAME=$(grep -E '^NAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
NAME=${NAME:-prod}
DB_NAME=$(grep -E '^MONGODB_DATABASE=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
DB_NAME=${DB_NAME:-autowrx}
UPLOAD_PATH=$(grep -E '^UPLOAD_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
UPLOAD_PATH=${UPLOAD_PATH:-./data/upload}
PLUGIN_PATH=$(grep -E '^PLUGIN_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
PLUGIN_PATH=${PLUGIN_PATH:-./data/plugin}

APP_CONTAINER="${NAME}-autowrx"
DB_CONTAINER="${NAME}-autowrx-db"
BACKUP_DIR="./backups"

MONGO_FILE=""; DATA_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --mongo) MONGO_FILE="$2"; shift 2 ;;
    --data)  DATA_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1 (supported: --mongo <file>, --data <file>)"; exit 1 ;;
  esac
done

# Interactive picker when no explicit files given
latest_in() { ls -1t "$BACKUP_DIR"/$1 2>/dev/null | head -1; }
if [ -z "$MONGO_FILE" ] && [ -z "$DATA_FILE" ]; then
  M=$(latest_in "mongo-*.archive.gz")
  D=$(latest_in "data-*.tar.gz")
  [ -n "$M" ] && MONGO_FILE="$M"
  [ -n "$D" ] && DATA_FILE="$D"
  [ -z "$MONGO_FILE" ] && [ -z "$DATA_FILE" ] && { echo "ERROR: no backups found in $BACKUP_DIR (run ./backup.sh first)"; exit 1; }
  echo "No --mongo/--data given; using the most recent of each:"
fi

echo "=== AutoWRX instance RESTORE (destructive) ==="
echo "Instance:     $NAME"
echo "Database:     $DB_NAME (container: $DB_CONTAINER) — collections will be REPLACED (--drop)"
[ -n "$MONGO_FILE" ] && echo "DB backup:    $MONGO_FILE ($(du -h "$MONGO_FILE" 2>/dev/null | cut -f1))"
[ -n "$DATA_FILE" ] && echo "Data backup:  $DATA_FILE ($(du -h "$DATA_FILE" 2>/dev/null | cut -f1))"
[ -n "$DATA_FILE" ] && echo "Data target:  $UPLOAD_PATH, $PLUGIN_PATH — current contents overwritten"
echo "The app container will be stopped during restore and restarted after."
echo "Backups taken AFTER the selected files contain data that will be LOST."
echo
read -r -p "Type RESTORE in capitals to proceed: " answer
[ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }

APP_WAS_RUNNING=0
if docker inspect "$APP_CONTAINER" >/dev/null 2>&1 && [ "$(docker inspect -f '{{.State.Running}}' "$APP_CONTAINER")" = "true" ]; then
  APP_WAS_RUNNING=1
  echo "[app] stopping $APP_CONTAINER for the duration of the restore"
  docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" stop autowrx
fi
trap '[ "$APP_WAS_RUNNING" -eq 1 ] && docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d autowrx || true' EXIT

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
if [ -n "$MONGO_FILE" ]; then
  [ -f "$MONGO_FILE" ] || { echo "ERROR: '$MONGO_FILE' not found"; exit 1; }
  docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || { echo "ERROR: database container '$DB_CONTAINER' not running (run ./up.sh first)"; exit 1; }

  RESTORE_CMD=""
  if docker exec "$DB_CONTAINER" mongorestore --version >/dev/null 2>&1; then
    RESTORE_CMD="mongorestore"
  elif docker exec "$DB_CONTAINER" /opt/dbtools/mongorestore --version >/dev/null 2>&1; then
    RESTORE_CMD="/opt/dbtools/mongorestore"
  else
    echo "ERROR: no mongorestore available inside '$DB_CONTAINER' — see the tools-mount instructions in docker-compose.prod.yml"
    exit 1
  fi

  gzip -t "$MONGO_FILE" || { echo "ERROR: '$MONGO_FILE' fails gzip integrity — refusing to restore"; exit 1; }
  echo "[db] restoring via '$RESTORE_CMD' (drop) -> $DB_NAME"
  if docker exec -i "$DB_CONTAINER" "$RESTORE_CMD" --db="$DB_NAME" --archive --gzip --drop --quiet < "$MONGO_FILE"; then
    COUNTS=$(docker exec "$DB_CONTAINER" mongosh --quiet "$DB_NAME" --eval \
      'let t=0; const ns=[]; db.getCollectionNames().forEach(c=>{const n=db[c].countDocuments({}); ns.push(c+"="+n); t+=n}); print(ns.join(" ")); print("TOTAL="+t)')
    echo "[db] OK — collection counts:"
    echo "     $COUNTS"
  else
    echo "[db] RESTORE FAILED — database may be in a partial state; re-run with a known-good archive"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
if [ -n "$DATA_FILE" ]; then
  [ -f "$DATA_FILE" ] || { echo "ERROR: '$DATA_FILE' not found"; exit 1; }
  gzip -t "$DATA_FILE" || { echo "ERROR: '$DATA_FILE' fails gzip integrity — refusing to restore"; exit 1; }
  echo "[data] extracting $DATA_FILE over $(pwd)"
  # Archives were created relative to the instance dir (./data/upload, ./data/plugin),
  # so extracting here lands files exactly where the compose mounts expect them.
  tar xzf "$DATA_FILE"
  echo "[data] OK"
fi

echo
echo "Restore complete."
# Restart app explicitly (trap would also do it, but report it)
if [ "$APP_WAS_RUNNING" -eq 1 ]; then
  docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d autowrx >/dev/null 2>&1 || true
  APP_WAS_RUNNING=0
  echo "[app] $APP_CONTAINER restarted"
fi
echo "Verify the instance (open the site, check content), then consider a fresh ./backup.sh"
