#!/bin/sh
# Copyright (c) 2025 Eclipse Foundation.
#
# This program and the accompanying materials are made available under the
# terms of the MIT License which is available at
# https://opensource.org/licenses/MIT.
#
# SPDX-License-Identifier: MIT
#
# Docker entrypoint for AutoWRX backend.
# Supports auto-restore from a backup ZIP on first startup.
#
# Environment variables:
#   RESTORE_FILE  — absolute path to a backup ZIP inside the container.
#                   If set and the file exists, a restore is performed before
#                   the server starts.  Typical usage:
#                     - Mount a backup file into the backups volume
#                     - Set RESTORE_FILE=/usr/src/playground-be/backups/restore.zip
#                   After restore the file is renamed to <name>.restored so it
#                   does not re-run on subsequent container restarts.

set -e

WORKDIR="/usr/src/playground-be"

# ── Auto-restore from backup ────────────────────────────────────────────────
if [ -n "$RESTORE_FILE" ] && [ -f "$RESTORE_FILE" ]; then
    echo "============================================"
    echo "  AutoWRX Startup Restore"
    echo "============================================"
    echo "  File: $RESTORE_FILE"
    echo "============================================"

    if node "$WORKDIR/scripts/backup-cli.js" restore "$RESTORE_FILE" ${RESTORE_REPLACE_ALL:+--replace-all}; then
        # Rename file so subsequent restarts don't re-run the restore
        mv "$RESTORE_FILE" "${RESTORE_FILE}.restored"
        echo "  Renamed to ${RESTORE_FILE}.restored to prevent re-execution."
    else
        echo "  WARNING: Restore failed. Server will start without restored data."
        echo "  The backup file has NOT been renamed so you can retry."
    fi
    echo "============================================"
    echo ""
fi

# ── Hand off to the main process ─────────────────────────────────────────────
exec "$@"
