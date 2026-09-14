#!/bin/bash
# Manual deploy script for dev stage
# Usage: ./deploy.sh [branch_name]
# Example: ./deploy.sh feature/my-feature
#          ./deploy.sh pr:123

set -e

# Show help
show_help() {
    echo ""
    echo "AutoWRX Dev Stage Deploy Script"
    echo "================================"
    echo ""
    echo "Usage: bash deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  (no argument)     Deploy from 'main' branch"
    echo "  <branch-name>     Deploy from a specific branch"
    echo "  pr:<number>       Deploy from a pull request"
    echo "  help, -h, --help  Show this help message"
    echo ""
    echo "Examples:"
    echo "  bash deploy.sh                    # Deploy main branch"
    echo "  bash deploy.sh develop            # Deploy 'develop' branch"
    echo "  bash deploy.sh feature/new-ui     # Deploy feature branch"
    echo "  bash deploy.sh pr:123             # Deploy pull request #123"
    echo "  bash deploy.sh help               # Show this help"
    echo ""
    exit 0
}

# Check for help flag
if [[ "$1" == "help" || "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
fi

DEPLOY_DIR="/opt/dev/autowrx"
PM2_APP_NAME="autowrx-dev-stage"
BRANCH_OR_PR="${1:-main}"

echo "=========================================="
echo "  AutoWRX Dev Stage Manual Deploy"
echo "=========================================="
echo "Target: $BRANCH_OR_PR"
echo "=========================================="

cd "$DEPLOY_DIR"

# Stop PM2 process
echo ""
echo "[1/6] Stopping current service..."
cd backend
pm2 stop $PM2_APP_NAME 2>/dev/null || true
pm2 delete $PM2_APP_NAME 2>/dev/null || true
cd ..

# Fetch and checkout
echo ""
echo "[2/6] Fetching latest changes..."
git fetch --all --prune
git reset --hard
git clean -fd

if [[ "$BRANCH_OR_PR" == pr:* ]]; then
    PR_NUMBER="${BRANCH_OR_PR#pr:}"
    echo "Checking out PR #$PR_NUMBER..."
    git fetch origin pull/$PR_NUMBER/head:pr-$PR_NUMBER
    git checkout pr-$PR_NUMBER
else
    echo "Checking out branch: $BRANCH_OR_PR..."
    git checkout "$BRANCH_OR_PR"
    git pull origin "$BRANCH_OR_PR"
fi

echo "Current commit:"
git log -1 --oneline

# Install dependencies
echo ""
echo "[3/6] Installing backend dependencies..."
cd backend
yarn install
cd ..

echo ""
echo "[4/6] Installing frontend dependencies..."
cd frontend
yarn install
cd ..

# Build frontend
echo ""
echo "[5/6] Building frontend..."
cd frontend
yarn build
cd ..

# Start backend
echo ""
echo "[6/6] Starting backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Please create it from dev-stage/.env.dev-stage.sample"
    echo "Attempting to continue anyway..."
fi

# Create ecosystem config
cat > ecosystem.dev-stage.json << 'EOF'
{
  "apps": [
    {
      "name": "autowrx-dev-stage",
      "script": "src/index.js",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "time": true,
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
EOF

pm2 start ecosystem.dev-stage.json

# Wait and check
sleep 5
PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "3202")

echo ""
echo "=========================================="
if curl -sf "http://localhost:$PORT/" > /dev/null 2>&1; then
    echo "  Deployment Successful!"
    echo "=========================================="
    echo ""
    echo "Service running on port: $PORT"
    echo ""
    pm2 status
else
    echo "  Warning: Health check failed"
    echo "=========================================="
    echo ""
    echo "Check logs with: pm2 logs"
fi
