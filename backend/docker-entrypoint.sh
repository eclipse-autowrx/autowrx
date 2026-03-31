#!/bin/sh
# Docker entrypoint — auto-extracts a snapshot ZIP from the instance volume
# if manifest.json specifies a restoreFile, then hands off to the server.
#
# Usage: place a ZIP in the instance volume and create manifest.json:
#   { "restoreFile": "my-snapshot.zip" }
# The ZIP is extracted in-place and renamed to *.imported so it won't re-run.

INSTANCE_DIR="/usr/src/playground-be/instance"
MANIFEST="$INSTANCE_DIR/manifest.json"

if [ -f "$MANIFEST" ]; then
  RESTORE_FILE=$(node -e "try{const m=require('$MANIFEST');process.stdout.write(m.restoreFile||'')}catch(e){}" 2>/dev/null)
  if [ -n "$RESTORE_FILE" ]; then
    ZIP_PATH="$INSTANCE_DIR/$RESTORE_FILE"
    if [ -f "$ZIP_PATH" ]; then
      echo "[entrypoint] Extracting instance snapshot: $RESTORE_FILE"
      unzip -o "$ZIP_PATH" -d "$INSTANCE_DIR"
      mv "$ZIP_PATH" "$ZIP_PATH.imported"
      echo "[entrypoint] Extraction complete. Renamed to $RESTORE_FILE.imported"
    else
      echo "[entrypoint] WARNING: restoreFile '$RESTORE_FILE' not found in instance dir — skipping extraction."
    fi
  fi
fi

exec "$@"
