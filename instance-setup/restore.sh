#!/usr/bin/env bash
# restore.sh — restore the MongoDB database and/or upload/plugin data of an
# AutoWRX instance deployment from files produced by ./backup.sh
#
# Usage:
#   ./restore.sh                        # interactive: pick a backup zip, restore both
#   ./restore.sh --backup <file.zip>    # restore from a specific backup zip
#
# Backup zips (from ./backup.sh) contain INFO.txt describing the instance
# and database they came from, plus the .env.prod of that instance. The
# restore VALIDATES that the INFO matches the current instance before
# proceeding, so a backup from another instance is refused.
#
# Protection: you must type RESTORE three times (once per confirmation
# stage) before anything destructive happens.
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
NEWLINE=$'\n'

ZIP_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --backup) ZIP_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1 (supported: --backup <file.zip>)"; exit 1 ;;
  esac
done

unzip_one() { # unzip_one <zip> <member> -> stdout
  python3 - "$1" "$2" <<'PY'
import sys, zipfile
try:
    with zipfile.ZipFile(sys.argv[1]) as z:
        sys.stdout.buffer.write(z.read(sys.argv[2]))
except KeyError:
    sys.exit(3)
PY
}

STAGE=""
if [ -n "$ZIP_FILE" ]; then
  [ -f "$ZIP_FILE" ] || { echo "ERROR: '$ZIP_FILE' not found"; exit 1; }
else
  Z=$(ls -1t "$BACKUP_DIR"/autowrx-backup-*.zip 2>/dev/null | head -1 || true)
  [ -n "$Z" ] || { echo "ERROR: no backup zips in $BACKUP_DIR (run ./backup.sh first)"; exit 1; }
  ZIP_FILE="$Z"
  echo "No --backup given; using the most recent:"
fi
echo "Backup zip:    $ZIP_FILE"

# --- Consistency validation: INFO.txt must match this instance ---
INFO=$(unzip_one "$ZIP_FILE" INFO.txt 2>/dev/null || true)
if [ -n "$INFO" ]; then
  B_NAME=$(echo "$INFO" | grep -E '^Instance name:' | cut -d: -f2- | tr -d ' ')
  B_DB=$(echo "$INFO" | grep -E '^Database:' | cut -d: -f2- | awk '{print $1}')
  echo "Backup origin: instance '$B_NAME', database '$B_DB' (from INFO.txt)"
  if [ "$B_NAME" != "$NAME" ] || [ "$B_DB" != "$DB_NAME" ]; then
    echo "REFUSED: backup is from instance '$B_NAME' / database '$B_DB', but this deployment is '$NAME' / '$DB_NAME'."
    echo "Restoring across instances is not supported by this script."
    exit 1
  fi
else
  echo "WARNING: zip has no INFO.txt — cannot verify origin. Continuing is allowed but unchecked."
fi

# Extract members to a temp stage
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
HAS_MONGO=0; HAS_DATA=0
if unzip_one "$ZIP_FILE" mongo.archive.gz > "$STAGE/mongo.archive.gz" 2>/dev/null && [ -s "$STAGE/mongo.archive.gz" ]; then HAS_MONGO=1; fi
if unzip_one "$ZIP_FILE" data.tar.gz > "$STAGE/data.tar.gz" 2>/dev/null && [ -s "$STAGE/data.tar.gz" ]; then HAS_DATA=1; fi
MONGO_FILE=""; DATA_FILE=""
if [ "$HAS_MONGO" -eq 1 ]; then MONGO_FILE="$STAGE/mongo.archive.gz"; fi
if [ "$HAS_DATA" -eq 1 ]; then DATA_FILE="$STAGE/data.tar.gz"; fi
[ -n "$MONGO_FILE" ] || [ -n "$DATA_FILE" ] || { echo "ERROR: zip contains neither mongo.archive.gz nor data.tar.gz"; exit 1; }

confirm_restore() {
  local stage=$1 detail=$2
  echo
  echo "--- Confirmation $stage of 3 ---"
  [ -n "$detail" ] && echo "$detail"
  read -r -p "Type RESTORE to proceed: " answer
  [ "$answer" = "RESTORE" ] || { echo "Aborted."; exit 1; }
}

echo "=== AutoWRX instance RESTORE (destructive) ==="
echo "Instance:     $NAME"
echo "Database:     $DB_NAME (container: $DB_CONTAINER) — collections will be REPLACED (--drop)"
if [ -n "$MONGO_FILE" ]; then echo "DB backup:    mongo.archive.gz ($(du -h "$MONGO_FILE" | cut -f1 || true))"; fi
if [ -n "$DATA_FILE" ]; then echo "Data backup:  data.tar.gz ($(du -h "$DATA_FILE" | cut -f1 || true))"; echo "Data target:  $UPLOAD_PATH, $PLUGIN_PATH — current contents overwritten"; fi
echo "The app container will be stopped during restore and restarted after."
echo "Backups taken AFTER this zip contain data that will be LOST."
echo "The zip's .env.prod is NOT applied automatically — current env stays."

confirm_restore 1 "Instance '$NAME', database '$DB_NAME', containers will be stopped."
confirm_restore 2 "Database collections will be REPLACED (--drop) from:$NEWLINE$MONGO_FILE$NEWLINE$DATA_FILE"
confirm_restore 3 "Data directories will be OVERWRITTEN: $UPLOAD_PATH, $PLUGIN_PATH.$NEWLINE This is the last chance to abort."

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
