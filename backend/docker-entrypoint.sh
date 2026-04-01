#!/bin/sh
# Docker entrypoint — auto-extracts a snapshot ZIP from the instance volume
# if manifest.json specifies a restoreFile, then hands off to the server.
#
# Usage: place a ZIP in the instance volume and create manifest.json:
#   { "restoreFile": "my-snapshot.zip" }
# The ZIP is extracted in-place and deleted after extraction.

INSTANCE_DIR="/usr/src/playground-be/instance"
MANIFEST="$INSTANCE_DIR/manifest.json"

if [ -f "$MANIFEST" ]; then
  RESTORE_FILE=$(node -e "try{const m=require('$MANIFEST');process.stdout.write(m.restoreFile||'')}catch(e){}" 2>/dev/null)
  if [ -n "$RESTORE_FILE" ]; then
    ZIP_PATH="$INSTANCE_DIR/$RESTORE_FILE"
    if [ -f "$ZIP_PATH" ]; then
      echo "[entrypoint] Extracting instance snapshot: $RESTORE_FILE"
      unzip -o "$ZIP_PATH" -d "$INSTANCE_DIR"
      rm -f "$ZIP_PATH"
      echo "[entrypoint] Extraction complete. Removed $RESTORE_FILE"
    else
      echo "[entrypoint] WARNING: restoreFile '$RESTORE_FILE' not found in instance dir — skipping extraction."
    fi
  fi
fi

# Seed built-in widgets into the volume-mounted directory on first startup.
# The volume mount shadows the image's static/builtin-widgets/, so we keep a
# copy at static/builtin-widgets-default/ and copy it across when the volume is empty.
# Skip if the snapshot bundle already provides builtin-widgets/ (server will restore those).
BUILTIN_WIDGETS_DIR="/usr/src/playground-be/static/builtin-widgets"
BUILTIN_WIDGETS_DEFAULT="/usr/src/playground-be/static/builtin-widgets-default"
SNAPSHOT_BUILTIN_WIDGETS="$INSTANCE_DIR/builtin-widgets"
if [ -d "$BUILTIN_WIDGETS_DEFAULT" ] && [ -z "$(ls -A "$BUILTIN_WIDGETS_DIR" 2>/dev/null)" ] && [ ! -d "$SNAPSHOT_BUILTIN_WIDGETS" ]; then
  echo "[entrypoint] Seeding built-in widgets from image defaults..."
  cp -r "$BUILTIN_WIDGETS_DEFAULT/." "$BUILTIN_WIDGETS_DIR/"
  echo "[entrypoint] Built-in widgets seeded."
fi

exec "$@"
