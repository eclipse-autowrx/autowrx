# Instance Setup Guide

This guide helps you deploy a new AutoWRX production instance using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)
- At least 4GB free disk space

## Quick Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd autowrx/instance-setup
```

### (Alternative) Download from GitHub Release (wget)

If you don’t want to clone the repo, you can download the instance setup files directly from a GitHub Release.

```bash
# Option A: download a single file from the latest release (docker-compose)
wget https://github.com/eclipse-autowrx/autowrx/releases/latest/download/docker-compose.prod.yml

# Option B: download the full instance-setup package from the latest release (recommended)
# NOTE: Replace TAG below if you want to pin to a specific version (e.g., TAG=v3.0.0)
TAG=latest
wget https://github.com/eclipse-autowrx/autowrx/releases/download/${TAG}/instance-setup-${TAG}.tar.gz
tar -xzf instance-setup-${TAG}.tar.gz

# After extracting (tarball contains the instance-setup directory contents)
cp .env.prod.sample .env.prod
# Edit .env.prod with your configuration, then:
./up.sh
```

### 2. Configure Environment

Copy the example environment file and edit it:

```bash
cp .env.prod.sample .env.prod
nano .env.prod  # or use your preferred editor
```

**Required Configuration:**

```bash
# Instance name (used for container naming)
NAME=autowrx

# Port mapping
FRONTEND_PORT=3200

# Security - CHANGE THESE!
JWT_SECRET=your-secure-random-secret-here

# CORS - Add your domain(s)
CORS_ORIGINS=yourdomain\\.com,.*\\.yourdomain\\.com

# Admin user (created on first run)
ADMIN_EMAILS=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password
```

**Important Notes:**
- `JWT_SECRET`: Use a strong, random secret (e.g., `openssl rand -base64 32`)
- `CORS_ORIGINS`: Escape dots with `\\.` (e.g., `example\\.com`)
- Authentication settings (self-registration, public viewing, etc.) are configured via the Site Configuration in the admin panel after deployment

### 3. Deploy

Start the services:

```bash
./up.sh
```

Or manually:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

The first build will take 5-10 minutes (downloads dependencies, builds frontend).

### 4. Verify

Check that containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Access your instance at: `http://your-server:${FRONTEND_PORT}`

## Management Commands

**Stop the instance:**
```bash
./down.sh
```

**View logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Restart services:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Update to latest version:**
```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Data Persistence

- **MongoDB data**: Stored in Docker volume `autowrx-dbdata`
- **Uploads**: Stored in `./data/upload` (configurable via `UPLOAD_PATH_HOST`)
- **Plugins**: Stored in `./data/plugin` (configurable via `PLUGIN_PATH_HOST`)

## Configuration Options

See `.env.prod.sample` for all available configuration options:

- `MONGODB_DATABASE`: Database name (default: `autowrx`)
- `UPLOAD_PATH_HOST`: Path for user uploads
- `PLUGIN_PATH_HOST`: Path for plugin files
- `JWT_COOKIE_NAME`: Cookie name for authentication
- `JWT_COOKIE_DOMAIN`: Cookie domain (for cross-subdomain auth)

## Troubleshooting

**Containers won't start:**
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Verify `.env.prod` syntax (no spaces around `=`)
- Ensure ports are not in use: `lsof -i :${FRONTEND_PORT}`

**Can't access the application:**
- Verify firewall allows traffic on `${FRONTEND_PORT}`
- Check `CORS_ORIGINS` includes your domain
- Review backend logs: `docker compose -f docker-compose.prod.yml logs autowrx`

**MongoDB connection issues:**
- Wait for MongoDB health check (15-30 seconds)
- Check MongoDB logs: `docker compose -f docker-compose.prod.yml logs autowrx-db`

## Security Checklist

- [ ] Changed `JWT_SECRET` to a strong random value
- [ ] Configured `CORS_ORIGINS` with your actual domain(s)
- [ ] Configured authentication settings via Site Configuration (self-registration, public viewing, etc.)
- [ ] Changed default admin credentials
- [ ] Configured firewall rules
- [ ] Set up SSL/TLS (via reverse proxy like Nginx)
- [ ] Regular backups of MongoDB volume

## Next Steps

- Set up a reverse proxy (Nginx/Traefik) for SSL/TLS
- Configure domain DNS
- Set up automated backups
- Monitor logs and performance

---

**Note:** For development setup, see the [Development Guide](../development-guide.md) in the project root.
