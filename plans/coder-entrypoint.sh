#!/bin/sh
# Entrypoint script for Coder container
# Fixes permissions and starts Coder server

set -e

# Ensure the config directory exists and has correct permissions
mkdir -p /home/coder/.config
chown -R coder:coder /home/coder/.config 2>/dev/null || chmod -R 777 /home/coder/.config || true

# Try to switch to coder user if su-exec or gosu is available
# Otherwise, the container should already be running as the correct user
if command -v su-exec >/dev/null 2>&1; then
    exec su-exec coder coder server --http-address 0.0.0.0:7080
elif command -v gosu >/dev/null 2>&1; then
    exec gosu coder coder server --http-address 0.0.0.0:7080
else
    # If no user switching tool is available, try to run as coder user directly
    # or fall back to running the command (assuming container runs as correct user)
    exec coder server --http-address 0.0.0.0:7080
fi
