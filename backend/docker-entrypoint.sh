#!/bin/sh
# Docker entrypoint — seeds built-in widgets on first startup, then hands off to the server.
#
# To restore an instance snapshot: manually extract the snapshot ZIP into the ./instance/
# directory (next to docker-compose.yml) and restart the container.

INSTANCE_DIR="/usr/src/playground-be/instance"
BUILTIN_WIDGETS_DIR="/usr/src/playground-be/static/builtin-widgets"
BUILTIN_WIDGETS_DEFAULT="/usr/src/playground-be/static/builtin-widgets-default"

# Seed built-in widgets into the volume-mounted directory on first startup.
# The volume mount shadows the image's static/builtin-widgets/, so we keep a
# copy at static/builtin-widgets-default/ and copy it across when the volume is empty.
# Skip if the snapshot bundle already provides builtin-widgets/ (server will restore those).
if [ -d "$BUILTIN_WIDGETS_DEFAULT" ] && [ -z "$(ls -A "$BUILTIN_WIDGETS_DIR" 2>/dev/null)" ] && [ ! -d "$INSTANCE_DIR/builtin-widgets" ]; then
  echo "[entrypoint] Seeding built-in widgets from image defaults..."
  cp -r "$BUILTIN_WIDGETS_DEFAULT/." "$BUILTIN_WIDGETS_DIR/"
  echo "[entrypoint] Built-in widgets seeded."
fi

exec "$@"
