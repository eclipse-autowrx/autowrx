#!/bin/bash
# Automated Gitea setup script
# This script waits for Gitea to start and then automates the installation

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

GITEA_URL=${GITEA_URL:-http://localhost:3000}
GITEA_ADMIN_USER=${GITEA_ADMIN_USER:-gitea-admin}
GITEA_ADMIN_PASSWORD=${GITEA_ADMIN_PASSWORD:-changeme123}
GITEA_ADMIN_EMAIL=${GITEA_ADMIN_EMAIL:-admin@example.com}

echo "=========================================="
echo "Automated Gitea Installation"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  URL: $GITEA_URL"
echo "  Admin User: $GITEA_ADMIN_USER"
echo "  Admin Email: $GITEA_ADMIN_EMAIL"
echo ""

# Wait for Gitea to be ready
echo "Waiting for Gitea to start..."
for i in $(seq 1 60); do
    if curl -s "$GITEA_URL" > /dev/null 2>&1; then
        echo "✓ Gitea is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "✗ Gitea failed to start after 60 seconds"
        echo "Check logs with: docker compose -f coder-docker-compose.yml logs gitea"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
sleep 2

# Check if already installed by trying to access API
if curl -s "$GITEA_URL/api/v1/version" > /dev/null 2>&1; then
    echo "✓ Gitea is already installed and running."
    echo ""
    echo "To reset and reinstall, run:"
    echo "  ./reset-gitea.sh"
    exit 0
fi

# Check if installation page is available
if ! curl -s "$GITEA_URL/install" | grep -q "installation"; then
    echo "Installation page not available. Gitea might already be installed."
    exit 0
fi

echo "Installing Gitea automatically..."

# Get the installation page to extract CSRF token
INSTALL_PAGE=$(curl -s -c /tmp/gitea_cookies.txt "$GITEA_URL/install")

# Extract CSRF token (try multiple patterns)
CSRF_TOKEN=$(echo "$INSTALL_PAGE" | grep -oP 'name="_csrf" value="\K[^"]+' || \
             echo "$INSTALL_PAGE" | grep -oP '_csrf["\s]*value=["\047]?([^"\047\s>]+)' | head -1 | cut -d'"' -f2 || \
             echo "")

if [ -z "$CSRF_TOKEN" ]; then
    echo "⚠ Could not extract CSRF token automatically."
    echo "Please complete installation manually at: $GITEA_URL"
    echo ""
    echo "Use these credentials:"
    echo "  Username: $GITEA_ADMIN_USER"
    echo "  Password: $GITEA_ADMIN_PASSWORD"
    echo "  Email: $GITEA_ADMIN_EMAIL"
    exit 1
fi

echo "CSRF token obtained. Submitting installation form..."

# Submit installation
INSTALL_RESPONSE=$(curl -s -L -b /tmp/gitea_cookies.txt -c /tmp/gitea_cookies.txt \
    -X POST "$GITEA_URL/install" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "Referer: $GITEA_URL/install" \
    --data-urlencode "_csrf=$CSRF_TOKEN" \
    --data-urlencode "db_type=SQLite3" \
    --data-urlencode "db_host=localhost:3306" \
    --data-urlencode "db_user=root" \
    --data-urlencode "db_passwd=" \
    --data-urlencode "db_name=gitea" \
    --data-urlencode "db_path=/data/gitea/gitea.db" \
    --data-urlencode "ssl_mode=disable" \
    --data-urlencode "charset=utf8mb4" \
    --data-urlencode "app_name=AutoWRX Git" \
    --data-urlencode "repo_root_path=/data/git/repositories" \
    --data-urlencode "lfs_root_path=/data/git/lfs" \
    --data-urlencode "run_user=git" \
    --data-urlencode "domain=localhost" \
    --data-urlencode "ssh_port=22" \
    --data-urlencode "http_port=3000" \
    --data-urlencode "app_url=http://localhost:3000" \
    --data-urlencode "log_root_path=/data/gitea/log" \
    --data-urlencode "smtp_host=" \
    --data-urlencode "enable_federated_avatar=on" \
    --data-urlencode "enable_open_id_sign_in=on" \
    --data-urlencode "enable_open_id_sign_up=on" \
    --data-urlencode "default_allow_create_organization_user=on" \
    --data-urlencode "default_enable_timetracking=on" \
    --data-urlencode "no_reply_address=noreply.localhost" \
    --data-urlencode "admin_name=$GITEA_ADMIN_USER" \
    --data-urlencode "admin_passwd=$GITEA_ADMIN_PASSWORD" \
    --data-urlencode "admin_confirm_passwd=$GITEA_ADMIN_PASSWORD" \
    --data-urlencode "admin_email=$GITEA_ADMIN_EMAIL" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$INSTALL_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✓ Installation submitted successfully!"
    echo ""
    echo "Waiting for Gitea to restart..."
    sleep 5
    
    # Wait for Gitea to be ready after installation
    for i in $(seq 1 30); do
        if curl -s "$GITEA_URL/api/v1/version" > /dev/null 2>&1; then
            echo "✓ Gitea is installed and running!"
            echo ""
            echo "Admin credentials:"
            echo "  Username: $GITEA_ADMIN_USER"
            echo "  Password: $GITEA_ADMIN_PASSWORD"
            echo "  Email: $GITEA_ADMIN_EMAIL"
            echo ""
            echo "You can now log in at: $GITEA_URL"
            rm -f /tmp/gitea_cookies.txt
            exit 0
        fi
        sleep 1
    done
    
    echo "⚠ Installation might have completed, but Gitea is still starting."
    echo "Please check: $GITEA_URL"
else
    echo "✗ Installation failed. HTTP code: $HTTP_CODE"
    echo ""
    echo "Please complete installation manually at: $GITEA_URL"
    echo "Use these credentials:"
    echo "  Username: $GITEA_ADMIN_USER"
    echo "  Password: $GITEA_ADMIN_PASSWORD"
    echo "  Email: $GITEA_ADMIN_EMAIL"
fi

rm -f /tmp/gitea_cookies.txt
