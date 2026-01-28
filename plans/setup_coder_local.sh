#!/bin/bash
# Setup script for local Coder Docker deployment

set -e

echo "Setting up Coder local environment..."

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose -f coder-docker-compose.yml down 2>/dev/null || true

# Remove old volume if it exists (optional - comment out to keep data)
# docker volume rm plans_coder_data 2>/dev/null || true

echo "Starting Coder container..."
docker-compose -f coder-docker-compose.yml up -d

echo ""
echo "Waiting for Coder to initialize..."
sleep 5

echo ""
echo "Checking Coder logs..."
docker logs coder --tail 50

echo ""
echo "Setup complete! Access Coder at http://localhost:7080"
echo "Check logs for admin password: docker logs coder | grep -i password"
