#!/bin/bash
# Setup script for AutoWRX auto-update system
# Run this on your staging/production server to enable automatic deployments

set -e

echo "=== AutoWRX Auto-Update Setup ==="
echo ""

# Default values
DEPLOY_DIR="${1:-/opt/autowrx/staging}"
ENVIRONMENT="${2:-staging}"
POLLING_INTERVAL="${3:-5}"  # minutes

echo "Configuration:"
echo "  Deploy directory: $DEPLOY_DIR"
echo "  Environment: $ENVIRONMENT"
echo "  Polling interval: Every $POLLING_INTERVAL minutes"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please run as regular user (will use sudo when needed)"
    exit 1
fi

# Create directories
echo "Creating deployment directories..."
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p /opt/deploy/scripts
sudo mkdir -p /var/log
sudo chown -R "$USER:$USER" "$DEPLOY_DIR"
sudo chown "$USER:$USER" /var/log/autowrx-deploy.log 2>/dev/null || sudo touch /var/log/autowrx-deploy.log && sudo chown "$USER:$USER" /var/log/autowrx-deploy.log

# Copy auto-update script
echo "Installing auto-update script..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo cp "$SCRIPT_DIR/auto-update.sh" /opt/deploy/scripts/
sudo chmod +x /opt/deploy/scripts/auto-update.sh

# Setup systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/autowrx-update.service > /dev/null <<EOF
[Unit]
Description=AutoWRX Auto Update Check - $ENVIRONMENT
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment="DEPLOY_DIR=$DEPLOY_DIR"
Environment="COMPOSE_FILE=docker-compose.stack.yml"
Environment="ENV_FILE=.env.stack"
Environment="LOG_FILE=/var/log/autowrx-deploy.log"
ExecStart=/opt/deploy/scripts/auto-update.sh
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
EOF

# Setup systemd timer
echo "Creating systemd timer..."
sudo tee /etc/systemd/system/autowrx-update.timer > /dev/null <<EOF
[Unit]
Description=Check for AutoWRX updates every $POLLING_INTERVAL minutes - $ENVIRONMENT

[Timer]
OnBootSec=2min
OnUnitActiveSec=${POLLING_INTERVAL}min
Unit=autowrx-update.service

[Install]
WantedBy=timers.target
EOF

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable and start timer
echo "Enabling auto-update timer..."
sudo systemctl enable autowrx-update.timer
sudo systemctl start autowrx-update.timer

echo ""
echo "✓ Setup completed successfully!"
echo ""
echo "Useful commands:"
echo "  View timer status:    sudo systemctl status autowrx-update.timer"
echo "  List all timers:      sudo systemctl list-timers | grep autowrx"
echo "  View logs:            tail -f /var/log/autowrx-deploy.log"
echo "  View service logs:    sudo journalctl -u autowrx-update.service -f"
echo "  Manual update:        /opt/deploy/scripts/auto-update.sh"
echo "  Stop auto-update:     sudo systemctl stop autowrx-update.timer"
echo "  Disable auto-update:  sudo systemctl disable autowrx-update.timer"
echo ""
echo "Next steps:"
echo "1. Copy docker-compose.stack.yml to $DEPLOY_DIR"
echo "2. Copy .env.stack to $DEPLOY_DIR (configure image tags)"
echo "3. Login to GitHub Container Registry:"
echo "   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
echo "4. Wait for next update check or run manually"
echo ""
