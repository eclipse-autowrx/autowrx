#!/bin/bash
# Coder Integration Setup Script
# This script helps set up Coder and Gitea for AutoWRX integration

set -e

echo "=========================================="
echo "AutoWRX Coder Integration Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Start Coder and Gitea
echo ""
echo "Starting Coder and Gitea services..."
docker compose -f coder-docker-compose.yml up -d

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker compose -f coder-docker-compose.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}✗ Services failed to start. Check logs with:${NC}"
    echo "  docker compose -f coder-docker-compose.yml logs"
    exit 1
fi

echo ""
echo "=========================================="
echo "Setup Instructions"
echo "=========================================="
echo ""
echo -e "${YELLOW}1. Coder Setup:${NC}"
echo "   - Open http://localhost:7080 in your browser"
echo "   - Create an admin user"
echo "   - Generate an API token (Account → Tokens)"
echo "   - Create a template named 'docker-template' using docker-template.tf"
echo ""
echo -e "${YELLOW}2. Gitea Setup:${NC}"
echo "   Option A (Automated):"
echo "     ./setup-gitea-auto.sh"
echo ""
echo "   Option B (Manual):"
echo "     - Open http://localhost:3000 in your browser"
echo "     - Complete the installation wizard"
echo "     - Generate an admin API token (Settings → Applications)"
echo ""
echo -e "${YELLOW}3. Backend Configuration:${NC}"
echo "   - Add the following to backend/.env:"
echo ""
echo "     CODER_URL=http://localhost:7080"
echo "     CODER_ADMIN_API_KEY=<your-coder-token>"
echo "     GITEA_URL=http://localhost:3000"
echo "     GITEA_ADMIN_USERNAME=<your-gitea-username>"
echo "     GITEA_ADMIN_PASSWORD=<your-gitea-password>"
echo "     GITEA_ADMIN_TOKEN=<your-gitea-token>"
echo ""
echo -e "${YELLOW}4. Test the Integration:${NC}"
echo "   - See coder-integration-testing-guide.md for detailed testing steps"
echo ""
echo "=========================================="
echo "Useful Commands"
echo "=========================================="
echo ""
echo "View logs:"
echo "  docker compose -f coder-docker-compose.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f coder-docker-compose.yml down"
echo ""
echo "Restart services:"
echo "  docker compose -f coder-docker-compose.yml restart"
echo ""
echo "Check service status:"
echo "  docker compose -f coder-docker-compose.yml ps"
echo ""
