# Coder setup (local / instance)

How to run Coder with the AutoWRX **docker-template**, build the workspace image (including the **autowrx-runner** VSIX), and connect AutoWRX via **site config**.

## Prerequisites

- Docker and Docker Compose
- Docker socket available at **`/var/run/docker.sock`** (Coder provisions workspace containers through it; same assumption as `docker-template.tf`)

**Terraform providers (fast workspace builds):**

1. **`populate-terraform-mirror.sh`** (called from **`start.sh`**) downloads `coder/coder` and `kreuzwerker/docker` into **`terraform-provider-mirror/`** (~28MB, gitignored). `coder-docker-compose.yml` mounts that directory read-only and writes **`/home/coder/.terraformrc`** with a **`filesystem_mirror`** so embedded Terraform **does not hit registry.terraform.io** on each build (fixes long hangs on “Installing provider…”). See [HashiCorp: provider mirrors](https://developer.hashicorp.com/terraform/cli/commands/providers/mirror).
2. **`TF_PLUGIN_CACHE_DIR`** (named volume `coder_terraform_plugins`) still helps reuse extracted copies after init.
3. **`.terraform.lock.hcl`** is copied into the template tarball with **`docker-template.tf`** so versions stay pinned.

After changing provider versions in **`docker-template.tf`**, run **`terraform providers lock`** (or re-run **`populate-terraform-mirror.sh`** after updating the lock file) and adjust the **`terraform-provider-coder_*`** / **`terraform-provider-docker_*`** paths in **`coder-docker-compose.yml`** if filenames change.

**`./clear.sh`** runs `docker compose down -v` and removes the **plugin cache volume**; the **filesystem mirror** on disk under **`terraform-provider-mirror/`** is kept unless you delete it manually.

## Start Coder and push the template

From **`instance-setup/coder/`**:

```bash
chmod +x start.sh
./start.sh
```

What **`start.sh`** does (see script for exact commands):

1. Runs **`populate-terraform-mirror.sh`** (skips if mirror already present).
2. Starts Coder with **`coder-docker-compose.yml`** (default UI/API port **7080**).
3. Runs **first-user login** for the Coder CLI inside the `coder` container (default admin user/password are in the script).
4. Builds **`autowrx-runner.vsix`** from **`autowrx-runner/`** and copies **`docker-template.tf`**, **`.terraform.lock.hcl`**, and **`workspace-image/`** into a temp dir, then **`coder templates push docker-template`** from a tar stream.
5. **`docker build -t autowrx-workspace:debian`** on the workspace image context (warms cache).
6. Creates a CLI token **`auto-token`** (7d lifetime) — use this or create another token in Coder UI / CLI for AutoWRX.

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
