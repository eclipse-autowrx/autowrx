# AutoWRX v3 Docker Stack Deployment

Unified Docker stack deployment for AutoWRX v3 monorepo architecture.

---

## Quick Start

```bash
# 1. Configure environment
cp .env.stack.example .env.stack
nano .env.stack  # Edit configuration

# 2. Deploy all services
docker compose -f docker-compose.stack.yml --env-file .env.stack up -d

# 3. Access services
# Frontend: http://localhost:8090
# Kong API: http://localhost:9800
```

---

## Before vs After

### Architecture Comparison

| Aspect | v2 (Before) | v3 (After) |
|--------|-------------|------------|
| **Repositories** | 2 separate repos | 1 monorepo |
| **Services in compose** | 1 (frontend only) | 8 (complete stack) |
| **Backend build** | Pre-built image | Builds from ./backend/ |
| **Frontend build** | Pre-built image | CI/CD builds dist/ → Docker |
| **Frontend deploy time** | ~5-10 min (full build) | ~30 seconds (copy dist) |
| **Configuration** | Multiple .env files | Single .env.stack |
| **Deployment** | Multiple manual steps | One command |
| **Orchestration** | None | Automatic (depends_on) |
| **Local testing** | ✗ Cannot replicate | ✓ Exact production |

### Visual Comparison

**v2 - Scattered Services:**
```
Frontend Repo     Backend Repo      Other Services
(separate)        (separate)        (unknown location)
    ↓                 ↓                    ↓
Frontend:8090     Backend:8080      Kong:9800 + 5 others
                                    (manual deployment)

Problems: 2 repos, unclear locations, no orchestration
```

**v3 - Unified Stack:**
```
Single Monorepo (autowrx-fork)
    ↓
docker-compose.stack.yml
    ↓
┌─────────────────────────────────────────┐
│ Kong:9800 (API Gateway)                 │
├─────────────────────────────────────────┤
│ Frontend:8090  Backend:8080  Upload:9810│
│ Homologation   Inventory-BE             │
│ MongoDB x2     (all 8 services)         │
└─────────────────────────────────────────┘

Benefits: 1 repo, 1 command, automatic orchestration
```

---

## Port Configuration

| Service | v2 Port | v3 Port | Public Access |
|---------|---------|---------|---------------|
| Frontend | 8090 | 8090 | ✓ Yes |
| Kong API Gateway | 9800 | 9800 | ✓ Yes |
| Backend | 8080 | 8080 | ✗ Internal only |
| Upload | 9810 | 9810 | ✗ Internal only |
| MongoDB (main) | 27017 | 27017 | ✗ Internal only |
| MongoDB (inventory) | 27017 | 27017 | ✗ Internal only |

**For Parallel Testing:** Deploy v3 on ports 8091/9801 to avoid conflict with v2 (8090/9800).

---

## v3 Services Stack

1. **Kong Gateway** - API reverse proxy (Port 9800)
2. **Frontend** - React/Vite + Nginx (Port 8090)
3. **Backend** - Node.js/Express API (Port 8080)
4. **Upload Service** - File upload handling (Port 9810)
5. **Homologation Service** - Vehicle workflows
6. **Inventory Backend** - Inventory management
7. **MongoDB (main)** - Application database
8. **MongoDB (inventory)** - Inventory database

---

## Optimized Build Strategy

**Frontend (Fast Deployment)**:
- ✅ CI/CD pipeline: `yarn build` → generates `dist/` folder
- ✅ Docker: Copies `dist/` into lightweight Nginx image
- ✅ Result: **30 seconds deployment** (vs 5-10 minutes)

**Backend (Builds from Source)**:
- Builds from `./backend/` directory during Docker image creation
- Standard Node.js build process (~2-3 minutes)

---

## Zero-Downtime Migration

Deploy v3 alongside existing v2 for safe testing:

```bash
# v2 continues running on ports 8090, 9800
# v3 runs on different ports 8091, 9801

# 1. Edit .env.stack
FRONTEND_PORT=8091      # v2 uses 8090
KONG_PROXY_PORT=9801    # v2 uses 9800
ENV=staging-new

# 2. Deploy v3 (no conflict)
docker compose --env-file .env.stack -f docker-compose.stack.yml up -d

# 3. Test both versions side-by-side
# v2: http://server:8090
# v3: http://server:8091

# 4. When ready, stop v2 and move v3 to production ports
```

---

## Workflow Use Cases (Step-by-Step)

### Use Case 1: Deploy New Feature to Staging

**Scenario:** You finished developing a new feature and want to test it on staging.

```bash
# 1. Push your changes to main branch
git push origin main

# 2. GitHub Actions automatically:
#    - Builds frontend and backend Docker images
#    - Pushes to ghcr.io with "main" tag
#    - Displays notification with image info

# 3. Staging server (within 5 minutes):
#    - Detects new "main" images
#    - Pulls and deploys automatically
#    - Logs to /var/log/autowrx-deploy.log

# 4. Test your feature on staging
curl http://staging-server:8091/
# Or visit in browser and test manually

# 5. Check deployment logs (if needed)
ssh staging-server
tail -f /var/log/autowrx-deploy.log
```

---

### Use Case 2: Test Specific Version Before Production

**Scenario:** You want to test the exact images that will go to production.

```bash
# 1. Find the image SHA from successful build
#    Go to: GitHub → Actions → Latest successful run
#    Note the SHA: sha-248dacd

# 2. SSH to staging server
ssh staging-server

# 3. Update staging to use specific SHA
cd /opt/autowrx/staging
nano .env.stack
# Change to:
# FRONTEND_IMAGE_TAG=sha-248dacd
# BACKEND_IMAGE_TAG=sha-248dacd

# 4. Trigger immediate deployment (optional)
/opt/deploy/scripts/auto-update.sh
# Or wait 5 minutes for auto-deploy

# 5. Test thoroughly on staging
./scripts/smoke-test.sh http://localhost:8091 http://localhost:9801

# 6. If tests pass, promote to production (see Use Case 3)
```

---

### Use Case 3: Promote Tested Version to Production

**Scenario:** Staging tests passed, now deploy to production.

**Option A: Via GitHub Actions (Recommended)**

```bash
# 1. Go to GitHub → Actions → "Tag Production Release"

# 2. Click "Run workflow"

# 3. Fill in:
#    - Version: sha-248dacd (or v1.0.0 if tagged)
#    - Confirm: deploy

# 4. Workflow shows deployment instructions

# 5. SSH to production server
ssh production-server
cd /opt/autowrx/production
nano .env.stack
# Update:
# FRONTEND_IMAGE_TAG=sha-248dacd
# BACKEND_IMAGE_TAG=sha-248dacd

# 6. Deployment happens automatically within 5 minutes
#    Or trigger manually: /opt/deploy/scripts/auto-update.sh

# 7. Verify production deployment
curl http://production-server:8090/health
docker compose ps
```

**Option B: Direct on Server**

```bash
# 1. SSH to production server
ssh production-server
cd /opt/autowrx/production

# 2. Update .env.stack
nano .env.stack
# FRONTEND_IMAGE_TAG=sha-248dacd
# BACKEND_IMAGE_TAG=sha-248dacd

# 3. Deploy immediately
/opt/deploy/scripts/auto-update.sh

# 4. Verify
docker compose ps
docker compose logs -f --tail=100
```

---

### Use Case 4: Rollback Production to Previous Version

**Scenario:** Production deployment has issues, need to rollback quickly.

```bash
# 1. SSH to production server
ssh production-server
cd /opt/autowrx/production

# 2. Check current version
grep IMAGE_TAG .env.stack
# Shows: FRONTEND_IMAGE_TAG=sha-248dacd

# 3. Change to previous working version
nano .env.stack
# FRONTEND_IMAGE_TAG=sha-8b13e66  # Previous version
# BACKEND_IMAGE_TAG=sha-8b13e66

# 4. Trigger immediate rollback
/opt/deploy/scripts/auto-update.sh

# 5. Verify rollback successful
docker compose ps
curl http://localhost:8090/health
docker compose logs --tail=50

# Time to rollback: ~2-3 minutes
```

---

### Use Case 5: Parallel Testing (Staging vs Production)

**Scenario:** Compare new version on staging against current production.

```bash
# Staging runs latest from main
# Production runs stable version

# 1. Check staging (new version)
curl http://staging-server:8091/api/v2/models

# 2. Check production (current version)
curl http://production-server:8090/api/v2/models

# 3. Compare response times, errors, features

# 4. Run automated tests on both
./scripts/smoke-test.sh http://staging-server:8091 http://staging-server:9801
./scripts/smoke-test.sh http://production-server:8090 http://production-server:9800

# 5. If staging performs better, promote (see Use Case 3)
```

---

### Use Case 6: Monitor Auto-Deployment Status

**Scenario:** Check if server is deploying updates automatically.

```bash
# 1. Check auto-update timer status
ssh server
sudo systemctl status autowrx-update.timer

# Expected output:
# Active: active (waiting)
# Trigger: Wed 2025-10-22 16:05:00 UTC; 2min left

# 2. Check recent deployments
tail -50 /var/log/autowrx-deploy.log

# 3. Check last deployment time
grep "Deployment completed" /var/log/autowrx-deploy.log | tail -1

# 4. View systemd logs
sudo journalctl -u autowrx-update.service -n 50

# 5. Check running services
docker compose ps
docker compose logs --tail=20
```

---

### Use Case 7: Temporarily Disable Auto-Updates

**Scenario:** Need to perform manual maintenance without auto-updates interfering.

```bash
# 1. Stop auto-update timer
ssh server
sudo systemctl stop autowrx-update.timer

# 2. Verify timer is stopped
sudo systemctl status autowrx-update.timer
# Should show: inactive (dead)

# 3. Perform your maintenance
docker compose down
# ... do maintenance ...
docker compose up -d

# 4. Re-enable auto-updates when done
sudo systemctl start autowrx-update.timer

# 5. Verify timer is running again
sudo systemctl list-timers | grep autowrx
```

---

### Use Case 8: Deploy Hotfix Quickly

**Scenario:** Critical bug in production, need immediate fix.

```bash
# 1. Fix bug and commit
git add .
git commit -m "Hotfix: Fix critical bug"
git push origin main

# 2. Wait for build (check GitHub Actions)
#    Usually completes in 2-3 minutes

# 3. Get the new SHA from GitHub Actions
#    Example: sha-abc1234

# 4. Deploy to production immediately
ssh production-server
cd /opt/autowrx/production
nano .env.stack
# FRONTEND_IMAGE_TAG=sha-abc1234
# BACKEND_IMAGE_TAG=sha-abc1234

/opt/deploy/scripts/auto-update.sh

# 5. Verify fix is deployed
curl http://localhost:8090/health
docker compose logs --tail=100 | grep -i error

# Total time from commit to production: ~5-7 minutes
```

---

## CI/CD Workflows (Modern Approach)

AutoWRX v3 uses container registry-based deployment with server-side polling.

**Build & Push** (`.github/workflows/build-and-push.yml`):
- Trigger: Push to main/v3-base, PRs, tags
- Process: Build images → Push to GitHub Container Registry (ghcr.io)
- Features: Docker layer caching, parallel builds, semantic versioning

**Staging Notification** (`.github/workflows/deploy-staging.yml`):
- Trigger: After successful build on main
- Process: Notifies that images are ready
- Deployment: Server polls registry every 5 minutes and auto-deploys

**Production Release** (`.github/workflows/deploy-production.yml`):
- Trigger: Manual dispatch (requires version + "deploy" confirmation)
- Process: Tags release for production deployment
- Deployment: Update .env.stack on server, auto-deploys on next poll

**Key Benefits:**
- ✅ Enterprise network friendly - Only outbound HTTPS connections
- ✅ Zero GitHub secrets - No credentials in public repository
- ✅ Firewall compatible - No inbound webhook ports required
- ✅ Immutable images - Build once, deploy many times
- ✅ Easy rollback - Change version tag in .env.stack
- ✅ Full audit trail - Server logs and GitHub deployment records

See [SERVER-POLLING.md](./SERVER-POLLING.md) for detailed setup and configuration.

---

## Key Improvements in v3

✅ **Single repository** - All code in one place
✅ **Unified deployment** - One command for all services
✅ **Faster frontend** - 30s deployment vs 5-10 min
✅ **Automatic orchestration** - Services start in correct order
✅ **Parallel testing** - Run v2 and v3 simultaneously
✅ **Production-ready** - Local env matches production exactly
✅ **Clear configuration** - Single .env.stack file
✅ **Zero-downtime migration** - Safe transition path

---

## Additional Documentation

- **[SERVER-POLLING.md](./SERVER-POLLING.md)** - Server polling deployment setup and configuration guide
