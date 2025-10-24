#!/bin/bash
# Auto-update script for AutoWRX deployment
# This script polls the container registry and deploys new images automatically

set -e

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-/opt/autowrx/staging}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.stack.yml}"
ENV_FILE="${ENV_FILE:-.env.stack}"
LOG_FILE="${LOG_FILE:-/var/log/autowrx-deploy.log}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Change to deployment directory
if [ ! -d "$DEPLOY_DIR" ]; then
    log "ERROR: Deployment directory $DEPLOY_DIR does not exist"
    exit 1
fi

cd "$DEPLOY_DIR" || exit 1

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log "ERROR: Docker compose file $COMPOSE_FILE not found"
    exit 1
fi

log "Checking for updates..."

# Pull latest images and capture output
PULL_OUTPUT=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull 2>&1 | tee -a "$LOG_FILE")

# Check if new images were downloaded
if echo "$PULL_OUTPUT" | grep -q "Downloaded newer image\|Status: Image is up to date"; then
    if echo "$PULL_OUTPUT" | grep -q "Downloaded newer image"; then
        log "New images found, deploying..."

        # Deploy with zero downtime
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

        # Wait for services to stabilize
        log "Waiting for services to stabilize..."
        sleep 15

        # Get frontend port from env or use default
        FRONTEND_PORT=$(grep FRONTEND_PORT "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ' || echo "8090")

        # Health check
        log "Performing health check on port $FRONTEND_PORT..."
        if curl -sf "http://localhost:${FRONTEND_PORT}/health" > /dev/null 2>&1 || \
           curl -sf "http://localhost:${FRONTEND_PORT}/" > /dev/null 2>&1; then
            log "✓ Deployment successful"

            # Show running services
            log "Running services:"
            docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | tee -a "$LOG_FILE"

            # Cleanup old images
            log "Cleaning up old images..."
            docker image prune -f >> "$LOG_FILE" 2>&1

            log "Deployment completed successfully"
        else
            log "✗ Health check failed"
            log "Service logs:"
            docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50 | tee -a "$LOG_FILE"

            log "WARNING: Deployment may have issues, check logs above"
            # Note: Not rolling back automatically to avoid cascade failures
            exit 1
        fi
    else
        log "Images are up to date, no deployment needed"
    fi
else
    log "No updates available"
fi

log "Update check completed"
