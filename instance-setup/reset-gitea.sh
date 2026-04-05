#!/bin/bash
# Reset Gitea to start fresh installation
# WARNING: This will delete all Gitea data!

echo "WARNING: This will delete all Gitea data!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "Stopping Gitea..."
docker compose -f coder-docker-compose.yml stop gitea

echo "Removing Gitea container..."
docker compose -f coder-docker-compose.yml rm -f gitea

echo "Finding and removing Gitea data volume..."
# Try different possible volume names
VOLUME_FOUND=false
for vol_name in "instance-setup_gitea_data" "coder-docker-compose_gitea_data" "gitea_data"; do
    if docker volume ls | grep -q "$vol_name"; then
        echo "Found volume: $vol_name"
        docker volume rm "$vol_name" 2>/dev/null && VOLUME_FOUND=true && break
    fi
done

# If volume not found by name, try to find it by inspecting the compose file
if [ "$VOLUME_FOUND" = false ]; then
    echo "Trying to find volume by inspecting containers..."
    # Get the actual volume name from docker
    ACTUAL_VOL=$(docker inspect gitea 2>/dev/null | grep -A 5 "Mounts" | grep "Source" | head -1 | sed 's/.*"Source": "\([^"]*\)".*/\1/' | xargs basename 2>/dev/null || echo "")
    if [ -n "$ACTUAL_VOL" ]; then
        echo "Found volume path, trying to remove..."
        docker volume ls | grep gitea | awk '{print $2}' | xargs -I {} docker volume rm {} 2>/dev/null || true
    fi
fi

# Force remove any remaining gitea volumes
echo "Cleaning up any remaining Gitea volumes..."
docker volume ls | grep -i gitea | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true

echo "Starting Gitea fresh..."
docker compose -f coder-docker-compose.yml up -d gitea

echo ""
echo "Waiting for Gitea to start..."
sleep 3

echo ""
echo "✓ Gitea has been reset!"
echo ""
echo "Now you have two options:"
echo ""
echo "Option A - Automated Setup (Recommended):"
echo "  ./setup-gitea-auto.sh"
echo ""
echo "Option B - Manual Setup:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. You should see the INSTALLATION page (not login screen)"
echo "  3. Complete the installation with these settings:"
echo "     - Admin Username: gitea-admin"
echo "     - Admin Password: (choose a strong password)"
echo "     - Admin Email: admin@example.com"
echo "     - Disable Self-Registration: ✓ (check this)"
echo "  4. Click 'Install Gitea'"
echo ""
