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
