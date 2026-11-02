# Instance Setup Guide

This guide helps you deploy a new AutoWRX production instance using Docker Compose.

## Backup, restore & snapshots

Three companion scripts live alongside `up.sh` / `down.sh`:

- **`./backup.sh`** — same-instance backup. Writes one zip, `backups/<NAME>-backup-<ts>.zip`, with `INFO.txt`, the instance `.env.prod`, the MongoDB dump and the upload/plugin data. Flags: `--db` / `--data` to scope, `-y` to skip the confirmation prompt. Backups are never auto-deleted.
- **`./restore.sh`** — restores a `backup.sh` zip (most recent by default, or `--backup <file.zip>`) into the **same** instance; a zip from another instance/database is refused. The database is restored with `--drop`, data directories are overwritten, and the app container is stopped during restore and restarted after. You must type `RESTORE` three times.
- **`./snapshot.sh`** — portable, versioned snapshot for **migration and environment cloning** (see below).

Notes:

- `mongo:7.0` images ship `mongodump`/`mongorestore`. The scripts also accept tools mounted at `/opt/dbtools` (see the commented volume in `docker-compose.prod.yml`) for images that lack them.
- Restore/import replaces post-backup data. Take a fresh backup or snapshot first if the current state matters (`snapshot.sh import` does this automatically).

### Snapshot export / import

```bash
./snapshot.sh export [--out DIR] [--include-env] [-y]
./snapshot.sh inspect snapshots/<NAME>-snapshot-<ts>.tar
./snapshot.sh import  snapshots/<NAME>-snapshot-<ts>.tar --dry-run   # show the plan, change nothing
./snapshot.sh import  snapshots/<NAME>-snapshot-<ts>.tar              # asks you to type the instance NAME
```

A bundle is a plain tar:

| Member | Content |
| --- | --- |
| `manifest.json` | `format: "autowrx-snapshot"`, `formatVersion`, creation time, source instance/database/Mongo version, sha256 + size of every member, per-collection document counts, a fingerprint (not the value) of `JWT_SECRET` |
| `mongo.archive.gz` | `mongodump --archive --gzip` of the instance database |
| `data.tar.gz` | data directories stored by role (`upload/`, `plugin/`, and `builtin-widgets/` / `global.css` when present), not by host path |
| `env.prod` | only with `--include-env` — contains secrets, the bundle is then written `chmod 600` |

Import behaviour:

- Validates the bundle first: known members only, supported `formatVersion` (newer is refused), checksums, gzip integrity, and safe paths inside `data.tar.gz`.
- **Works across instances**: the source database is renamed to this instance's `MONGODB_DATABASE`, and data roles map to this instance's `*_PATH_HOST` values.
- Replaces state exactly: collections are restored with `--drop`, collections that are not in the snapshot are dropped, and each data directory is replaced (extracted beside the old one, swapped in only after extraction succeeds).
- Before changing anything it exports a **safety snapshot** (`snapshots/<NAME>-snapshot-pre-import-<ts>.tar`); skip with `--no-safety-snapshot`. `--db-only` / `--data-only` limit the scope.
- Stops the app container during import and waits for it to be healthy again afterwards.
- **`JWT_SECRET` must match the source instance** — it derives the at-rest encryption key. A fingerprint mismatch is shown in the plan, needs an extra `yes` interactively, and is refused under `-y` unless `--allow-secret-mismatch` is passed.
- The bundle's `env.prod` is never applied; copy it by hand if you want it.

Round-trip check (two throwaway MongoDB-only compose projects, cleaned up afterwards): `./tests/snapshot-roundtrip.sh`.

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
# NOTE: Replace TAG below if you want to pin to a specific version (e.g., TAG=v2026.06.30)
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

**Required Configuration (environment mode):**

```bash
# Instance name (used for container naming)
NAME=autowrx

# Port mapping
FRONTEND_PORT=3200
NODE_ENV=production
SECRETS_PROVIDER=env

# Database and security - CHANGE THESE!
MONGODB_URL=mongodb://autowrx-db:27017/autowrx
JWT_SECRET=your-secure-random-secret-here
ADMIN_PASSWORD=your-secure-password

# CORS - Add your domain(s)
CORS_ORIGINS=yourdomain\\.com,.*\\.yourdomain\\.com

# Admin user (created on first run)
ADMIN_EMAILS=admin@yourdomain.com
```

**Azure Key Vault mode (optional):**

Set the following instead of supplying `MONGODB_URL`, `JWT_SECRET`, and `ADMIN_PASSWORD`:

```bash
SECRETS_PROVIDER=keyvault
AZURE_KEY_VAULT_NAME=your-key-vault-name
AZURE_KEY_VAULT_ALLOW_ENV_FALLBACK=false
```

Create the corresponding `mongodb-url`, `jwt-secret`, and `admin-password` secrets in the vault. The production `mongodb-url` should use the Docker hostname `autowrx-db`, not `localhost`.

**Important Notes:**
- Keep `.env.prod` private; it is ignored by Git.
- `JWT_SECRET`: Use a strong, random secret (e.g., `openssl rand -base64 32`)
  - Keep it stable. To rotate signing keys, use `JWT_KEYS` + `JWT_ACTIVE_KID` instead — see [Rotating the JWT signing key](../backend/src/docs/environment-variables.md#rotating-the-jwt-signing-key)
- `TRUST_PROXY`: Number of reverse proxies in front of the backend (default `1`). Set `false` if the backend port is exposed directly; a wrong value lets clients spoof their IP and bypass auth rate limits
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

#### Container health status

The `autowrx` image defines a Docker healthcheck that probes `GET /v2/health/ready` (via `backend/src/healthcheck.js`) every 15s. Readiness depends only on MongoDB answering a ping — unlike `GET /v2/health`, it does not log in as admin or probe external hosts, so it is safe to poll continuously. Startup seeds data before the server listens, hence the 90s start period.

`./up.sh` runs `docker compose up --wait`, which blocks until the container reports `healthy` (bounded by `WAIT_TIMEOUT`, default 180s) and prints the service status plus the last 100 `autowrx` log lines if it doesn't get there.

To read the health status at any time:

```bash
docker inspect --format '{{.State.Health.Status}}' ${NAME:-prod}-autowrx
# healthy | starting | unhealthy
```

`unhealthy` usually means MongoDB is unreachable — check `docker compose -f docker-compose.prod.yml logs autowrx-db` (the SPA at `/` still returns 200 in that state, so don't rely on it as a health signal).

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
- **Global CSS**: Stored in `./data/global.css` (configurable via `GLOBAL_CSS_PATH_HOST`). Admins can edit via the UI; changes persist across container rebuilds.
- **Builtin Widgets**: Bundled inside the Docker image by default. To override with custom widgets from the host, see [Custom Builtin Widgets](#custom-builtin-widgets) below.

## Custom Builtin Widgets

By default, builtin widgets are bundled inside the Docker image. If you want to override them with custom widgets from the host (e.g., to persist or customize widgets across updates), use the provided override file:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.widgets.yml --env-file .env.prod up -d
```

This mounts `./data/builtin-widgets` (or the path set in `BUILTIN_WIDGETS_PATH_HOST`) into the container, replacing the image's built-in widgets.

**Note:** The bind mount overlays the container directory entirely. If `./data/builtin-widgets/` is empty, the container will see an empty directory. Make sure to populate it with your widget files before starting.

To go back to the default image widgets, simply omit the override file:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

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

## Out of scope

- Set up a reverse proxy (Nginx/Traefik) for SSL/TLS
- Configure domain DNS
- Set up automated backups
- Monitor logs and performance

---

**Note:** For development setup, see the [Development Guide](../docs/getting-started/development-guide.md) in the project root.
