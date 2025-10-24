# Server Polling Deployment Guide

## Overview

AutoWRX v3 uses server-side polling for automatic deployments. This approach is ideal for enterprise networks where inbound connections are restricted.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Actions (CI)                                     │
│ ├─ Build images                                         │
│ └─ Push to ghcr.io                                      │
└─────────────────────────────────────────────────────────┘
                    ↓ (Images in registry)
┌─────────────────────────────────────────────────────────┐
│ GitHub Container Registry (ghcr.io)                     │
│ ├─ frontend:v3-base (latest)                           │
│ └─ backend:v3-base (latest)                            │
└─────────────────────────────────────────────────────────┘
                    ↑ (Poll every 5 minutes)
┌─────────────────────────────────────────────────────────┐
│ Server (Staging/Production)                             │
│                                                          │
│ Systemd Timer (every 5 min)                            │
│    ↓                                                     │
│ auto-update.sh                                          │
│    ├─ docker compose pull (check for new images)       │
│    ├─ If new images: deploy                            │
│    ├─ Health check                                     │
│    └─ Log results                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Server Setup

### Prerequisites

- Docker and Docker Compose installed
- GitHub Personal Access Token (for pulling images)
- Sudo access for setup

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/tri2510/autowrx.git
cd autowrx

# 2. Run setup script
./scripts/setup-auto-update.sh /opt/autowrx/staging staging 5

# 3. Copy deployment files
sudo cp docker-compose.stack.yml /opt/autowrx/staging/
sudo cp .env.stack.example /opt/autowrx/staging/.env.stack

# 4. Configure environment
sudo nano /opt/autowrx/staging/.env.stack
# Set image tags, ports, etc.

# 5. Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 6. Done! Auto-updates will start in 2 minutes
```

---

## Configuration

### Polling Interval

Change update frequency by editing the timer:

```bash
sudo nano /etc/systemd/system/autowrx-update.timer

# Change this line:
OnUnitActiveSec=5min  # 5 minutes (default)

# Examples:
OnUnitActiveSec=2min   # Every 2 minutes
OnUnitActiveSec=10min  # Every 10 minutes
OnUnitActiveSec=1h     # Every hour

# Reload after changes
sudo systemctl daemon-reload
sudo systemctl restart autowrx-update.timer
```

### Image Tags

Control which versions to deploy via `.env.stack`:

**Staging (auto-deploy latest):**
```bash
FRONTEND_IMAGE_TAG=main
BACKEND_IMAGE_TAG=main
```

**Production (specific versions):**
```bash
FRONTEND_IMAGE_TAG=v1.0.0
BACKEND_IMAGE_TAG=v1.0.0
```

---

## Deployment Workflow

### Staging (Automatic)

```
Developer → Push to main → GitHub Actions builds → Push to ghcr.io
                                                        ↓
                                 Staging server polls (every 5 min)
                                                        ↓
                                 Auto-deploys if new images found
```

### Production (Manual)

```
1. Run "Tag Production Release" workflow in GitHub
2. SSH to production server
3. Update .env.stack with version tag:
   FRONTEND_IMAGE_TAG=v1.0.0
   BACKEND_IMAGE_TAG=v1.0.0
4. Wait for auto-deploy (5 min) or trigger manually
```

---

## Management Commands

### View Status

```bash
# Check timer status
sudo systemctl status autowrx-update.timer
sudo systemctl list-timers | grep autowrx

# View deployment logs
tail -f /var/log/autowrx-deploy.log

# View systemd logs
sudo journalctl -u autowrx-update.service -f

# Check running services
cd /opt/autowrx/staging
docker compose ps
```

### Manual Operations

```bash
# Trigger update check immediately
/opt/deploy/scripts/auto-update.sh

# Stop auto-updates
sudo systemctl stop autowrx-update.timer

# Start auto-updates
sudo systemctl start autowrx-update.timer

# Disable auto-updates permanently
sudo systemctl disable autowrx-update.timer

# Enable auto-updates
sudo systemctl enable autowrx-update.timer
```

### Deployment Control

```bash
# Deploy specific version (production)
cd /opt/autowrx/production
nano .env.stack  # Change FRONTEND_IMAGE_TAG=v1.2.0
/opt/deploy/scripts/auto-update.sh  # Or wait for next poll

# Rollback to previous version
nano .env.stack  # Change to old version
/opt/deploy/scripts/auto-update.sh

# Skip next deployment
sudo systemctl stop autowrx-update.timer
# Make changes
sudo systemctl start autowrx-update.timer
```

---

## Troubleshooting

### No Updates Detected

```bash
# Check registry authentication
docker login ghcr.io -u YOUR_USERNAME
docker pull ghcr.io/tri2510/autowrx/frontend:v3-base

# Check image tags in .env.stack
cat /opt/autowrx/staging/.env.stack | grep IMAGE_TAG

# Manual pull test
cd /opt/autowrx/staging
docker compose pull
```

### Deployment Fails

```bash
# View error logs
tail -50 /var/log/autowrx-deploy.log
sudo journalctl -u autowrx-update.service -n 50

# Check service health
docker compose ps
docker compose logs frontend
docker compose logs backend

# Restart services
docker compose restart
```

### Timer Not Running

```bash
# Check timer status
sudo systemctl status autowrx-update.timer

# View timer logs
sudo journalctl -u autowrx-update.timer

# Restart timer
sudo systemctl restart autowrx-update.timer
```

---

## Benefits

✅ **Enterprise friendly** - Only outbound HTTPS connections
✅ **Zero GitHub secrets** - No credentials in public repository
✅ **Firewall compatible** - No inbound ports required
✅ **Simple** - One script, one timer, done
✅ **Reliable** - Systemd managed, auto-restart on failure
✅ **Auditable** - Full logs on server
✅ **Flexible** - Control deployment timing and versions

---

## Security Considerations

### Best Practices

✅ Use read-only GitHub tokens (packages:read only)
✅ Use dedicated deploy user (not root)
✅ Store tokens in systemd environment, not scripts
✅ Regular token rotation (90 days)
✅ Monitor deployment logs for anomalies
✅ Use specific version tags for production
✅ Test in staging before production

### Access Control

```bash
# Create dedicated deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Set proper permissions
sudo chown -R deploy:deploy /opt/autowrx
sudo chown deploy:deploy /var/log/autowrx-deploy.log

# Run timer as deploy user (already configured in setup script)
```

---

## Advanced Configuration

### Environment-Specific Settings

**Staging:** Frequent updates, auto-deploy everything
```bash
OnUnitActiveSec=5min
FRONTEND_IMAGE_TAG=main
```

**Production:** Conservative updates, specific versions only
```bash
OnUnitActiveSec=10min
FRONTEND_IMAGE_TAG=v1.0.0
```

### Maintenance Windows

Add to auto-update.sh before deployment:

```bash
# Only deploy during off-hours
HOUR=$(date +%H)
if [ $HOUR -ge 9 ] && [ $HOUR -lt 18 ]; then
    log "During business hours, skipping deployment"
    exit 0
fi
```

### Notification Integration

Add after successful deployment in auto-update.sh:

```bash
# Slack notification
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"AutoWRX $ENVIRONMENT deployed successfully\"}"

# Email notification
echo "Deployment successful" | mail -s "AutoWRX Deployed" admin@company.com
```

---

## Migration from Webhook Approach

If you previously used webhooks:

1. Stop webhook service: `sudo systemctl stop webhook`
2. Remove webhook secrets from GitHub
3. Run setup script: `./scripts/setup-auto-update.sh`
4. Verify auto-updates work
5. Disable webhook service: `sudo systemctl disable webhook`

---

## FAQ

**Q: What if I want instant deployments?**
A: Set polling interval to 1-2 minutes, or trigger manually after builds.

**Q: Can I deploy different versions to different servers?**
A: Yes, each server has its own .env.stack with version tags.

**Q: What happens if deployment fails?**
A: Script logs error and exits. Service stays on previous version.

**Q: How do I know deployment succeeded?**
A: Check logs: `tail -f /var/log/autowrx-deploy.log`

**Q: Can I disable auto-deploy temporarily?**
A: Yes: `sudo systemctl stop autowrx-update.timer`

**Q: Does this work with private repositories?**
A: Yes, just use GitHub token with repo access.

---

## Support

For issues or questions:
- Check logs: `/var/log/autowrx-deploy.log`
- View service status: `sudo systemctl status autowrx-update`
- Manual test: `/opt/deploy/scripts/auto-update.sh`
