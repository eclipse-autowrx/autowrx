#!/bin/bash
# Automated Coder Setup Script for AutoWRX
# Usage: ./setup-coder.sh [--admin-email EMAIL] [--admin-password PASSWORD] [--coder-url URL]
#
# This script:
#   1. Starts Coder via docker compose
#   2. Creates the admin user
#   3. Generates an API token
#   4. Pushes the docker-template
#   5. Updates .env.prod with the token
#   6. Creates the prototypes directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Defaults
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@email.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-AutoWrx2026Admin}"
CODER_INTERNAL_URL="http://localhost:7080"
CODER_EXTERNAL_URL="${CODER_URL:-https://coder.test.digital.auto}"
ENV_FILE="${SCRIPT_DIR}/.env.prod"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --admin-email) ADMIN_EMAIL="$2"; shift 2;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2;;
    --coder-url) CODER_EXTERNAL_URL="$2"; shift 2;;
    --env-file) ENV_FILE="$2"; shift 2;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

echo "=========================================="
echo " AutoWRX Coder Setup"
echo "=========================================="

# --- Step 1: Check Docker ---
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    exit 1
fi
echo -e "${GREEN}[1/6] Docker is running${NC}"

# --- Step 2: Start Coder ---
echo -e "${YELLOW}[2/6] Starting Coder...${NC}"
docker compose -f coder-docker-compose.yml up -d

echo "  Waiting for Coder to be ready..."
for i in $(seq 1 30); do
    if curl -sf "$CODER_INTERNAL_URL/api/v2/buildinfo" > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

if ! curl -sf "$CODER_INTERNAL_URL/api/v2/buildinfo" > /dev/null 2>&1; then
    echo -e "${RED}Error: Coder failed to start. Check: docker compose -f coder-docker-compose.yml logs${NC}"
    exit 1
fi
echo -e "${GREEN}  Coder is ready${NC}"

# --- Step 3: Create admin user ---
echo -e "${YELLOW}[3/6] Creating admin user...${NC}"

# Check if first user already exists
HAS_FIRST_USER=$(curl -sf "$CODER_INTERNAL_URL/api/v2/users/first" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

if [ "$HAS_FIRST_USER" = "200" ]; then
    # First user endpoint returns 200 = no user yet, create one
    docker exec coder coder login "$CODER_INTERNAL_URL" \
        --first-user-email "$ADMIN_EMAIL" \
        --first-user-password "$ADMIN_PASSWORD" \
        --first-user-username admin \
        --first-user-trial=false \
        --use-token-as-session > /dev/null 2>&1
    echo -e "${GREEN}  Admin user created ($ADMIN_EMAIL)${NC}"
else
    echo -e "${GREEN}  Admin user already exists, logging in...${NC}"
    # Login with password to get session
    SESSION_TOKEN=$(python3 -c "
import json, urllib.request
data = json.dumps({'email':'$ADMIN_EMAIL','password':'$ADMIN_PASSWORD'}).encode()
req = urllib.request.Request('$CODER_INTERNAL_URL/api/v2/users/login', data=data, headers={'Content-Type':'application/json'})
resp = urllib.request.urlopen(req)
print(json.loads(resp.read().decode())['session_token'])
" 2>/dev/null)
    docker exec coder coder login "$CODER_INTERNAL_URL" --token "$SESSION_TOKEN" > /dev/null 2>&1
fi

# --- Step 4: Generate API token ---
echo -e "${YELLOW}[4/6] Generating API token...${NC}"
API_TOKEN=$(docker exec coder coder tokens create --name "autowrx-setup-$(date +%s)" --lifetime 168h 2>/dev/null)

if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}Error: Failed to generate API token${NC}"
    exit 1
fi
echo -e "${GREEN}  API token generated${NC}"

# --- Step 5: Push docker-template ---
echo -e "${YELLOW}[5/6] Pushing docker-template...${NC}"

# Generate terraform lock file if not present
if [ ! -f ".terraform.lock.hcl" ]; then
    echo "  Generating terraform lock file..."
    terraform init -backend=false > /dev/null 2>&1 || true
fi

# Push template via stdin tar
tar cf - docker-template.tf .terraform.lock.hcl workspace-image/ 2>/dev/null | \
    docker exec -i coder coder templates push docker-template -d - --yes 2>&1 | tail -3

echo -e "${GREEN}  docker-template pushed${NC}"

# --- Step 6: Update .env.prod ---
echo -e "${YELLOW}[6/6] Updating configuration...${NC}"

if [ -f "$ENV_FILE" ]; then
    # Update CODER_ADMIN_API_KEY if it exists, otherwise append
    if grep -q "CODER_ADMIN_API_KEY" "$ENV_FILE"; then
        sed -i "s|CODER_ADMIN_API_KEY=.*|CODER_ADMIN_API_KEY=$API_TOKEN|" "$ENV_FILE"
    else
        echo "" >> "$ENV_FILE"
        echo "# Coder" >> "$ENV_FILE"
        echo "CODER_URL=$CODER_EXTERNAL_URL" >> "$ENV_FILE"
        echo "CODER_ADMIN_API_KEY=$API_TOKEN" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}  Updated $ENV_FILE${NC}"
else
    echo -e "${YELLOW}  Warning: $ENV_FILE not found. Set CODER_ADMIN_API_KEY=$API_TOKEN manually.${NC}"
fi

# Create prototypes directory
sudo mkdir -p /var/lib/autowrx/prototypes
sudo chown 1000:1000 /var/lib/autowrx/prototypes
echo -e "${GREEN}  Prototypes directory ready${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN} Coder setup complete!${NC}"
echo "=========================================="
echo ""
echo "  Admin email:    $ADMIN_EMAIL"
echo "  Admin password: $ADMIN_PASSWORD"
echo "  Coder URL:      $CODER_EXTERNAL_URL"
echo "  API token:      $API_TOKEN"
echo ""
echo "  NOTE: API token expires in 7 days."
echo "        Set CODER_MAX_TOKEN_LIFETIME in coder env for longer tokens."
echo ""
