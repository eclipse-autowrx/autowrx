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

### (Alternative) Download from GitHub Release

If you don't want to clone the repo, download the instance setup files directly from a GitHub Release.

```bash
# Download the full instance-setup package from the latest release
# NOTE: Replace TAG below if you want to pin to a specific version (e.g., TAG=v3.0.0)
TAG=latest
wget https://github.com/eclipse-autowrx/autowrx/releases/download/${TAG}/instance-setup-${TAG}.tar.gz
tar -xzf instance-setup-${TAG}.tar.gz

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

## Instance Snapshot (Export / Import)

Snapshots let you capture a fully configured instance and reproduce it on a fresh deployment — no manual re-configuration needed.

### Export

In the admin panel go to **Settings → Site Management** and click **Export Snapshot**. This downloads a ZIP file containing:

```
<instance>-snapshot.zip
├── manifest.json              # version, export date, instance name
├── site-configs.json          # all non-secret site configs
├── global.css                 # custom global CSS
├── uploads/                   # user-uploaded files (logos, covers, etc.)
├── imgs/                      # static images (default model/prototype images, logos)
├── plugin/                    # plugin JS files
├── builtin-widgets/           # builtin widget files
├── vss/
│   ├── vss.json               # VSS version catalog
│   ├── v4.1.json
│   ├── v5.0.json
│   └── ...                    # one file per available VSS version
└── seed/
    ├── plugins.json
    ├── model-templates.json
    ├── dashboard-templates.json
    ├── models.json
    └── prototypes.json
```

### Import (restore on startup)

1. Extract the snapshot ZIP:

```bash
unzip <instance>-snapshot.zip -d ./instance/
```

2. The `instance/` directory (next to `docker-compose.prod.yml`) should now contain the extracted files:

```
instance-setup/
├── docker-compose.prod.yml
├── .env.prod
└── instance/
    ├── manifest.json
    ├── site-configs.json
    ├── seed/
    ├── uploads/
    ├── imgs/
    ├── plugin/
    ├── builtin-widgets/
    ├── vss/
    └── global.css
```

3. Start (or restart) the instance:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

On startup the backend detects `instance/manifest.json`, seeds all data into Docker volumes, then **clears the `instance/` directory automatically**. After the container is running, `instance/` will be empty.

### Seed behaviour

| Scenario                                                              | Result                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Fresh deploy, no snapshot                                             | Default configs only                                        |
| Fresh deploy with snapshot                                            | Snapshot values seeded, defaults fill any gaps              |
| Restart with no `instance/manifest.json`                              | No seed — skipped                                           |
| Admin edits a value after restore, then re-deploys with same snapshot | Admin value preserved — seed never overwrites existing data |

## Data Persistence

All runtime data is stored in named Docker volumes, independent of the host directory:

| Data            | Volume                           |
| --------------- | -------------------------------- |
| MongoDB         | `<NAME>-autowrx-dbdata`          |
| Uploaded files  | `<NAME>-autowrx-uploads`         |
| Plugin JS files | `<NAME>-autowrx-plugins`         |
| Builtin widgets | `<NAME>-autowrx-builtin-widgets` |
| VSS data files  | `<NAME>-autowrx-vss-data`        |

The only bind-mount is `./instance/` — used exclusively for snapshot restore input. It is always empty during normal operation.

> **Custom instance path:** If you need to use a different host directory, set `INSTANCE_PATH` in `.env.prod`:
>
> ```bash
> INSTANCE_PATH=/opt/autowrx-snapshots
> ```

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

**Snapshot not restored:**

- Confirm `instance/manifest.json` exists before starting the container
- Check backend logs for `[Instance]` lines: `docker compose -f docker-compose.prod.yml logs autowrx | grep Instance`

## Security Checklist

- [ ] Changed `JWT_SECRET` to a strong random value
- [ ] Configured `CORS_ORIGINS` with your actual domain(s)
- [ ] Configured authentication settings via Site Configuration (self-registration, public viewing, etc.)
- [ ] Changed default admin credentials
- [ ] Configured firewall rules
- [ ] Set up SSL/TLS (via reverse proxy like Nginx)
- [ ] Regularly export instance snapshots for backup

## Next Steps

- Set up a reverse proxy (Nginx/Traefik) for SSL/TLS
- Configure domain DNS
- Export an instance snapshot after initial configuration to preserve your setup
- Monitor logs and performance

---

**Note:** For development setup, see the [Development Guide](../development-guide.md) in the project root.
