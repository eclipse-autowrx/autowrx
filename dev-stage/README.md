# Dev Stage Deployment

Quick deployment system for testing branches and PRs without building Docker images.

## Overview

This setup allows you to:
- Deploy any branch or PR to this server instantly
- Test changes in production mode without Docker build overhead
- Access the deployed version via `test.digital.auto` (or your configured domain)

## Architecture

```
GitHub Actions (workflow_dispatch)
         │
         ▼
Self-hosted Runner (this server)
         │
         ├── git pull/checkout
         ├── yarn install (backend + frontend)
         ├── yarn build (frontend)
         └── pm2 start (backend in production mode)
         │
         ▼
Nginx (test.digital.auto) → localhost:3202
         │
         ▼
MongoDB (Docker container)
```

## Setup Guide

### 1. Prerequisites

Ensure these are installed on the server:

```bash
# Node.js (v20 recommended)
node --version

# Yarn
yarn --version

# PM2 (process manager)
npm install -g pm2

# Docker (for MongoDB)
docker --version
```

### 2. Start MongoDB

```bash
cd /opt/dev/autowrx/dev-stage
docker compose -f docker-compose.mongodb.yml up -d

# Verify it's running
docker ps | grep autowrx-dev-mongodb
```

### 3. Configure Environment

```bash
# Copy the sample environment file
cp /opt/dev/autowrx/dev-stage/.env.dev-stage.sample /opt/dev/autowrx/backend/.env

# Edit with your settings
nano /opt/dev/autowrx/backend/.env
```

Key settings to configure:
- `MONGODB_URL` - Should be `mongodb://localhost:27020/autowrx-dev`
- `JWT_SECRET` - Change to a secure value
- `ADMIN_EMAILS` - Your admin email
- `CORS_ORIGINS` - Include your test domain

### 4. Configure Nginx

```bash
# Copy and modify the nginx sample
sudo cp /opt/dev/autowrx/dev-stage/nginx-sample.conf /etc/nginx/sites-available/test.digital.auto

# Edit to match your domain and SSL certificates
sudo nano /etc/nginx/sites-available/test.digital.auto

# Enable the site
sudo ln -sf /etc/nginx/sites-available/test.digital.auto /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Install GitHub Actions Runner

```bash
# Run the setup script
cd /opt/dev/autowrx/dev-stage
chmod +x setup-runner.sh
./setup-runner.sh

# Follow the instructions to configure the runner
```

### 6. Test Manual Deployment

Before using GitHub Actions, test the manual deploy script:

```bash
cd /opt/dev/autowrx/dev-stage
chmod +x deploy.sh

# Deploy main branch
./deploy.sh main

# Or deploy a specific branch
./deploy.sh feature/my-feature

# Or deploy a PR
./deploy.sh pr:123
```

## Usage

### Via GitHub Actions (Recommended)

1. Go to your repository on GitHub
2. Navigate to **Actions** → **Deploy Dev Stage**
3. Click **Run workflow**
4. Select options:
   - **Deploy type**: `branch` or `pr`
   - **Branch name**: e.g., `main`, `feature/new-feature`
   - **PR number**: e.g., `123` (if deploy type is pr)
   - **Skip frontend build**: Check if only backend changes
5. Click **Run workflow**

### Via Manual Script

```bash
cd /opt/dev/autowrx/dev-stage

# Deploy a branch
./deploy.sh main
./deploy.sh feature/my-feature

# Deploy a PR
./deploy.sh pr:123
```

### Via Direct Commands

```bash
cd /opt/dev/autowrx

# Fetch and checkout
git fetch --all
git checkout feature/my-branch
git pull

# Build
cd frontend && yarn install && yarn build && cd ..

# Restart backend
cd backend
pm2 restart autowrx-dev-stage

# Or if not running yet
pm2 start ecosystem.dev-stage.json
```

## Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs autowrx-dev-stage

# Monitor resources
pm2 monit

# Check MongoDB
docker logs autowrx-dev-mongodb
```

## Troubleshooting

### Service won't start

```bash
# Check logs
pm2 logs autowrx-dev-stage --lines 50

# Verify .env file exists
ls -la /opt/dev/autowrx/backend/.env

# Check MongoDB is running
docker ps | grep mongodb
```

### Frontend not loading

```bash
# Verify frontend was built
ls -la /opt/dev/autowrx/backend/static/frontend-dist/

# Rebuild if needed
cd /opt/dev/autowrx/frontend
yarn build
```

### Cannot connect via domain

```bash
# Check nginx config
sudo nginx -t

# Check nginx is proxying correctly
curl -I http://localhost:3202
curl -I https://test.digital.auto

# Check nginx logs
sudo tail -f /var/log/nginx/test.digital.auto.error.log
```

### GitHub Actions runner not working

```bash
# Check runner status
cd /opt/actions-runner
sudo ./svc.sh status

# View runner logs
sudo journalctl -u actions.runner.* -f

# Restart runner
sudo ./svc.sh stop
sudo ./svc.sh start
```

## File Structure

```
dev-stage/
├── README.md                    # This file
├── docker-compose.mongodb.yml   # MongoDB container
├── .env.dev-stage.sample        # Environment template
├── nginx-sample.conf            # Nginx configuration
├── deploy.sh                    # Manual deploy script
└── setup-runner.sh              # GitHub Actions runner setup
```

## Security Notes

- The `.env` file in `backend/` contains secrets - never commit it
- Use strong `JWT_SECRET` in production
- Configure proper SSL certificates for your domain
- Restrict server access appropriately
- The self-hosted runner has access to the server - secure GitHub repo access
