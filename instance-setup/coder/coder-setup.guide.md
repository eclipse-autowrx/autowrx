# Coder setup

## Prerequisites

- Docker and Docker Compose
- Docker socket available at `/var/run/docker.sock` (workspace provisioning uses it)

## Start Coder + template

From `instance-setup/coder/`:

```bash
chmod +x start.sh
./start.sh
```

What `start.sh` does:

1. Starts Coder with `coder-docker-compose.yml` (port **7080**).
2. Creates the first admin user (interactive CLI; defaults are in the script).
3. Pushes the Terraform template **`docker-template`** (includes `docker-template.tf` + `workspace-image/`).
4. Builds a local image tag **`autowrx-workspace:1`** to warm the cache.
5. Creates a CLI token named **`auto-token`** (7d lifetime) — use this or create another admin token for AutoWRX.

## Wire AutoWRX to Coder

In **Site Management → VSCode Config** (or equivalent site config keys):

| Key | Typical value |
|-----|----------------|
| `VSCODE_ENABLE` | `true` |
| `CODER_URL` | `http://localhost:7080` (or your public Coder URL) |
| `CODER_ADMIN_API_KEY` | Admin API token from Coder (`coder tokens create` or the UI) |
| `PROTOTYPES_PATH` | Host path where prototype folders are stored; must match what Coder can bind-mount (default in code: `/var/lib/autowrx/prototypes`) |

If AutoWRX and Coder run on different hosts, `CODER_URL` must be reachable from the **backend**, and `PROTOTYPES_PATH` must be the path **on the Coder host** (or the path shared into the same mount namespace).

## Workspace image (Python)

The workspace Dockerfile installs `requirements.base.txt` into **system Python** (`pip3 --break-system-packages`) — no virtualenv in the image, so builds skip `python3 -m venv` and the extra pip layer. For a disposable workspace image this is normal; if you need isolation for a project, create a local `.venv` yourself.

## References

- Flow: `coder-integration-flow.md`
- Compose: `coder-docker-compose.yml`
- Template: `docker-template.tf`, `workspace-image/Dockerfile`
