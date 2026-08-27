#!/usr/bin/env bash
# restore.sh — restore the MongoDB database and/or upload/plugin data of an
# AutoWRX instance deployment from files produced by ./backup.sh
#
# Usage:
#   ./restore.sh --enable               # STEP 1: unlock restores for 15 minutes
#   ./restore.sh                        # STEP 2: pick a backup, confirm, restore both
#   ./restore.sh --mongo <file>         # restore database from a specific archive
#   ./restore.sh --data <file>          # restore data from a specific tarball
#
# Two independent protections:
#   1. EXPLICIT UNLOCK — restore refuses to run unless it was enabled with
#      `--enable` at most 15 minutes ago (token file under ./backups/).
#      Scripts, cron jobs and accidental runs cannot restore.
#   2. TYPED CONFIRMATION — you must type the exact instance NAME, binding
#      the restore to the deployment you are actually aiming at.
#
# Destructive: the database restore uses --drop (each collection is replaced)
# and the data restore overwrites the upload/plugin directories. The app
# container is stopped before restore and restarted after, so no writes race
# the restore.

set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.prod"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found"; exit 1; }

NAME=$(grep -E '^NAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
NAME=${NAME:-prod}
DB_NAME=$(grep -E '^MONGODB_DATABASE=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
DB_NAME=${DB_NAME:-autowrx}
UPLOAD_PATH=$(grep -E '^UPLOAD_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
UPLOAD_PATH=${UPLOAD_PATH:-./data/upload}
PLUGIN_PATH=$(grep -E '^PLUGIN_PATH_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
PLUGIN_PATH=${PLUGIN_PATH:-./data/plugin}

APP_CONTAINER="${NAME}-autowrx"
DB_CONTAINER="${NAME}-autowrx-db"
BACKUP_DIR="./backups"

MONGO_FILE=""; DATA_FILE=""
ENABLE_TTL_MIN=15
TOKEN_FILE="./backups/.restore-allowed"
while [ $# -gt 0 ]; do
  case "$1" in
    --enable)
      mkdir -p ./backups
      date +%s > "$TOKEN_FILE"
      chmod 600 "$TOKEN_FILE" 2>/dev/null || true
      echo "Restores UNLOCKED for ${ENABLE_TTL_MIN} minutes (token: $TOKEN_FILE)."
      echo "Run ./restore.sh within that window to perform a restore."
      exit 0 ;;
    --mongo) MONGO_FILE="$2"; shift 2 ;;
    --data)  DATA_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1 (supported: --enable, --mongo <file>, --data <file>)"; exit 1 ;;
  esac
done

# --- Protection 1: explicit unlock required ---
if [ ! -f "$TOKEN_FILE" ]; then
  echo "REFUSED: restores are not enabled."
  echo "This script is destructive and will not run from scripts, cron, or by accident."
  echo "Unlock it first:  ./restore.sh --enable   (valid ${ENABLE_TTL_MIN} minutes)"
  exit 1
fi
TOKEN_AGE=$(( $(date +%s) - $(cat "$TOKEN_FILE" 2>/dev/null || echo 0) ))
if [ "$TOKEN_AGE" -gt $((ENABLE_TTL_MIN * 60)) ]; then
  echo "REFUSED: unlock token expired ($((TOKEN_AGE / 60)) minutes old; max ${ENABLE_TTL_MIN})."
  echo "Re-enable with:  ./restore.sh --enable"
  rm -f "$TOKEN_FILE"
  exit 1
fi

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
# --- Protection 2: type the exact instance name ---
read -r -p "Type the instance NAME ($NAME) to proceed: " answer
[ "$answer" = "$NAME" ] || { echo "Aborted (typed '$answer', expected '$NAME')."; exit 1; }
# Consume the token: one restore per unlock
rm -f "$TOKEN_FILE"
echo "(unlock token consumed — a further restore needs ./restore.sh --enable again)"

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
