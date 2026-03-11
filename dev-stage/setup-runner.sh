#!/bin/bash
# Setup script for GitHub Actions self-hosted runner
# Run this once to install the runner on your server

set -e

RUNNER_DIR="/opt/actions-runner"
RUNNER_VERSION="2.311.0"  # Update to latest version from https://github.com/actions/runner/releases

echo "=========================================="
echo "  GitHub Actions Self-Hosted Runner Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please run as regular user (not root)"
    exit 1
fi

# Prerequisites check
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required"; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo "Error: Yarn is required"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "Error: PM2 is required. Install with: npm install -g pm2"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required"; exit 1; }
echo "All prerequisites met!"

# Create runner directory
echo ""
echo "Creating runner directory at $RUNNER_DIR..."
sudo mkdir -p "$RUNNER_DIR"
sudo chown -R "$USER:$USER" "$RUNNER_DIR"

# Download runner
echo ""
echo "Downloading GitHub Actions Runner v$RUNNER_VERSION..."
cd "$RUNNER_DIR"

ARCH=$(uname -m)
case $ARCH in
    x86_64) RUNNER_ARCH="x64" ;;
    aarch64|arm64) RUNNER_ARCH="arm64" ;;
    *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

curl -sLO "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
tar xzf "actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
rm "actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"

echo ""
echo "=========================================="
echo "  Runner Downloaded Successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Go to your GitHub repository settings:"
echo "   https://github.com/YOUR_ORG/YOUR_REPO/settings/actions/runners/new"
echo ""
echo "2. Click 'New self-hosted runner' and select Linux"
echo ""
echo "3. Copy the configuration token from the GitHub page"
echo ""
echo "4. Run the configuration command:"
echo "   cd $RUNNER_DIR"
echo "   ./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN"
echo ""
echo "5. Install and start the runner as a service:"
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"
echo ""
echo "6. Verify the runner appears in your repository settings"
echo ""
echo "=========================================="
echo ""
echo "Useful commands after setup:"
echo "  Check status:   sudo ./svc.sh status"
echo "  View logs:      sudo journalctl -u actions.runner.* -f"
echo "  Stop runner:    sudo ./svc.sh stop"
echo "  Uninstall:      sudo ./svc.sh uninstall"
echo ""
