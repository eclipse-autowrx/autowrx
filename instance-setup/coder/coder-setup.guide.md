# Coder setup (local / instance)

How to run Coder with the AutoWRX **docker-template**, build the workspace image (including the **autowrx-runner** VSIX), and connect AutoWRX via **site config**.

## Prerequisites

- Docker and Docker Compose
- Docker socket available at **`/var/run/docker.sock`** (Coder provisions workspace containers through it; same assumption as `docker-template.tf`)

## Start Coder and push the template

From **`instance-setup/coder/`**:

```bash
chmod +x start.sh
./start.sh
```

What **`start.sh`** does (see script for exact commands):

1. Starts Coder with **`coder-docker-compose.yml`** (default UI/API port **7080**).
2. Runs **first-user login** for the Coder CLI inside the `coder` container (default admin user/password are in the script).
3. Builds **`autowrx-runner.vsix`** from **`autowrx-runner/`** and copies **`docker-template.tf`** + **`workspace-image/`** into a temp dir, then **`coder templates push docker-template`** from a tar stream.
4. **`docker build -t autowrx-workspace:1`** on the workspace image context (warms cache).
5. Creates a CLI token **`auto-token`** (7d lifetime) — use this or create another token in Coder UI / CLI for AutoWRX.

## Wire AutoWRX to Coder

Coder settings are stored as **site** configuration in the database (not `.env`). The backend reads them in **`backend/src/utils/coderConfig.js`**.

**Admin UI:** **`/admin/site-config`** → open the **VS Code** tab (VS Code / Coder integration section — `VscodeConfigSection`).

| Key | Purpose | Default in code if unset |
|-----|---------|---------------------------|
| **`VSCODE_ENABLE`** | Turn integration on; shows VS Code tab | off / false |
| **`CODER_URL`** | Coder server base URL (must be reachable from **AutoWRX backend**) | `http://localhost:7080` |
| **`CODER_ADMIN_API_KEY`** | Coder API token with rights to manage users/workspaces (stored as secret in UI) | empty |
| **`PROTOTYPES_PATH`** | Host directory for per-user prototype folders; **must match** what workspaces bind-mount (`prototypes_host_path` template parameter defaults to the same path) | `/var/lib/autowrx/prototypes` |

**Deployment notes:**

- If AutoWRX **backend** and Coder run on different machines, **`CODER_URL`** must be reachable from the backend, and **`PROTOTYPES_PATH`** must refer to the directory on the host that Coder (and Docker) use for the bind mount — typically the **Coder host’s** path, shared with how the template parameter is set when workspaces are created.
- After changing these keys, allow a short moment for the backend config cache (~10s) or restart if you need an immediate pick-up.

## Workspace image

- **Dockerfile:** `instance-setup/coder/workspace-image/Dockerfile` — installs dependencies (including **`requirements.base.txt`** into system Python as documented in-image).
- **Terraform:** `instance-setup/coder/docker-template.tf` — defines the **`docker-template`**, Docker provider on **`unix:///var/run/docker.sock`**, bind-mount of **`prototypes_host_path`**, and code-server-based workspace.
- Optional Git parameters in the template are **commented out**; the live flow uses the **prototypes folder mount** only.

## Run button inside embedded VS Code

The dashboard **Run** control (when the VS Code tab is active) calls **`POST /v2/system/coder/workspace/:prototypeId/trigger-run`**. The backend writes **`.autowrx_run`** under the prototype folder; **autowrx-runner** in the workspace picks it up. See **`coder-integration-flow.md`** (Phase 6) and **`coder-trigger-run-sequence.md`**.

## References

- Runtime flow: [`coder-integration-flow.md`](./coder-integration-flow.md)
- Mermaid — open tab: [`coder-flow-diagram.md`](./coder-flow-diagram.md)
- Mermaid — Run trigger: [`coder-trigger-run-sequence.md`](./coder-trigger-run-sequence.md)
- Compose: `coder-docker-compose.yml`
- Template + image: `docker-template.tf`, `workspace-image/`
