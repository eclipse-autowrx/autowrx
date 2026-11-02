# Self-Hosted "Codespaces" Execution Guide

This runbook provides the step-by-step commands to deploy your environment using the files you have prepared.

## Phase 1: Local Docker Setup (The Simple Host)

Use this method to run Coder on your local machine or a single VPS.

### Prerequisites

- Docker and Docker Compose installed.
- Git installed.
- Files present in directory: `coder-docker-compose.yml`, `docker-template.tf`.

### Step 1: Start the Control Plane

Run the Coder management service in the background:

```bash
docker-compose -f coder-docker-compose.yml up -d
```

The docker-compose file includes an init container that automatically fixes volume permissions before starting Coder.

**Troubleshooting:** If you encounter permission errors:

1. Stop the containers: `docker-compose -f coder-docker-compose.yml down`
2. Remove the volume (if needed): `docker volume rm plans_coder_data`
3. Restart: `docker-compose -f coder-docker-compose.yml up -d`

Alternatively, you can use the setup script:
```bash
chmod +x setup_coder_local.sh
./setup_coder_local.sh
```

### Step 2: Access & Initial Setup

Open your browser to: `http://localhost:7080`

You will be redirected to the setup page where you can create your first admin account:

1. Enter your **Email** address
2. Enter a **Password** for your admin account
3. (Optional) Check the box if you want to start a free trial of Enterprise features
4. Click **Continue with email**

This will create your admin account and log you into the Coder dashboard.

> **Note:** In Coder v2, there is no auto-generated password. You create your admin account through the web UI on first access.

### Step 3: Create the Docker Template

First, create a zip file containing the template. You can either:

**Option A:** Use the helper script:
```bash
chmod +x prepare-templates.sh
./prepare-templates.sh
```

**Option B:** Create the zip manually:
```bash
zip docker-template.zip docker-template.tf
```

Then in the Coder Dashboard:

1. Navigate to **Templates > Create**.
2. Select **Upload**.
3. Upload the file: `docker-template.zip`.
4. Click **Create Template**.

### Step 4: Launch a Workspace

1. Go to **Workspaces > Create**.
2. Select the template you just uploaded.
3. Enter the Git Repository URL you want to work on.
4. Click **Create Workspace**.

### Docker access via socket proxy

Coder never mounts the host Docker socket. Only the `docker-socket-proxy` service ([tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy)) sees it, mounted read-only. The proxy then allowlists the Docker API calls Coder can make:

```
coder ──tcp://docker-socket-proxy:2375──▶ docker-socket-proxy ──(ro)──▶ /var/run/docker.sock
        (network docker_proxy, internal: true, no published port)
```

- The `coder` service gets Docker through `DOCKER_HOST=tcp://docker-socket-proxy:2375`. It has no socket mount and no `group_add` root group.
- `docker-template.tf` points its `docker` provider at the same address.
- Workspaces join only `coder_network`. They are never attached to `docker_proxy`, so they can't resolve or reach the proxy, and code inside a workspace has no Docker API access.

**Allowed surface** (`POST=1` enables non-GET methods only for the sections switched on):

| Section | Setting | Used by the template for |
|---|---|---|
| `/containers` | `CONTAINERS=1` | list, inspect, create, start, stop, delete the workspace container |
| `/images` | `IMAGES=1` | inspect and pull `codercom/code-server` |
| `/volumes` | `VOLUMES=1` | create, inspect, delete the home volume |
| `/networks` | `NETWORKS=1` | connect the workspace to `coder_network` |
| `/_ping`, `/version`, `/events` | default on | provider health and version checks |

Everything else is denied with HTTP 403, including `/exec`, `/build`, `/commit`, `/info`, `/system`, `/auth`, `/plugins`, `/swarm`, `/services`, `/secrets`, `/configs`, `/nodes`, `/tasks`, `/distribution` and `/session`. The Docker provider calls `/info` and gets a 403, but that doesn't affect it. These sections were checked against a full workspace create, stop, start and delete cycle, and each one is used.

**Residual risk:** `CONTAINERS` + `POST` still let a caller create a privileged container or bind-mount host paths. The proxy keeps the socket out of Coder and out of every workspace, and it blocks exec, build, swarm and similar endpoints. Even so, a fully compromised Coder control plane can still create such a container and get root-equivalent access to the host. For stronger isolation, use rootless Docker, a runtime such as Sysbox, or the Kubernetes setup (Phase 2).

**Troubleshooting:** if creating a workspace fails with a `403` from Docker, the template is calling an API section that isn't on the allowlist. Find the denied path with `docker logs docker-socket-proxy | grep ' 403 '`, and only enable the matching section in `coder-docker-compose.yml` if the template really needs it.

## Phase 2: Azure Kubernetes Setup (Cloud Scale)

Use this method to deploy Coder to an Azure AKS cluster for production use.

### Prerequisites

- Azure CLI (`az`) installed and logged in (`az login`).
- `kubectl` installed.
- `helm` installed.
- Files present in directory: `setup_coder_aks.sh`, `k8s-template.tf`.

### Step 1: Provision Infrastructure

Run the setup script to create the Resource Group, AKS Cluster, and install the Coder Helm chart.

```bash
# Make the script executable
chmod +x setup_coder_aks.sh

# Run the script
./setup_coder_aks.sh
```

> **Note:** This process typically takes 10-15 minutes. The script will output the External IP and Admin Password upon completion.

### Step 2: Access & Login

1. Copy the External IP provided by the script output.
2. Open your browser to `http://<EXTERNAL-IP>`.
3. Log in using the password provided by the script.

### Step 3: Create the Kubernetes Template

First, create a zip file containing the template. You can either:

**Option A:** Use the helper script (if you haven't already):
```bash
chmod +x prepare-templates.sh
./prepare-templates.sh
```

**Option B:** Create the zip manually:
```bash
zip k8s-template.zip k8s-template.tf
```

Then in the Coder Dashboard:

1. Navigate to **Templates > Create > Upload**.
2. Upload the file: `k8s-template.zip`.
3. Click **Create Template**.

### Step 4: Launch a Cloud Workspace

1. Go to **Workspaces > Create**.
2. Select the Kubernetes template.
3. Enter your Git Repository URL.
4. Click **Create**.

Coder will now provision a Pod in your Azure cluster, attach a persistent Azure Disk for storage, and clone your repository.
