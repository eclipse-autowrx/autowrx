# Coder Integration Testing Guide

This guide walks you through testing the Coder workspace integration with AutoWRX.

## Prerequisites

- Docker and Docker Compose installed
- Access to the AutoWRX backend codebase
- Coder CLI installed (optional, for template management)
- Basic understanding of Git and Docker

## Step 1: Start Coder and Gitea Services

### 1.1 Start the Infrastructure

```bash
cd instance-setup
docker compose -f coder-docker-compose.yml up -d
```

### 1.1.1 Docker socket permissions (important)

If template creation fails with `permission denied` on `unix:///var/run/docker.sock`, make sure the Coder container joins the Docker socket group.

In `instance-setup/coder-docker-compose.yml`, set `group_add` on the `coder` service to either:

- `group_add: ["998"]` (fixed GID example), or
- `group_add: ["${DOCKER_GID}"]` (recommended, dynamic)

If using `DOCKER_GID`, export it before starting compose:

```bash
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
docker compose -f coder-docker-compose.yml up -d
```

### 1.2 Verify Services are Running

```bash
docker compose -f coder-docker-compose.yml ps
```

You should see:
- `coder` container running on port 7080
- `gitea` container running on port 3000

### 1.3 Check Service Logs

```bash
# Check Coder logs
docker compose -f coder-docker-compose.yml logs coder

# Check Gitea logs
docker compose -f coder-docker-compose.yml logs gitea
```

## Step 2: Initial Coder Setup

### 2.1 Access Coder Dashboard

Open your browser and navigate to:
```
http://localhost:7080
```

### 2.2 Create Coder Admin User

On first access, Coder will prompt you to create an admin user:
- **Username**: `admin` (or your choice)
- **Email**: `admin@example.com`
- **Password**: Choose a strong password

**Important**: Save these credentials - you'll need the admin API token.

### 2.3 Generate Admin API Token

After logging in:

1. Click on your profile (top right)
2. Go to **Account** → **Tokens**
3. Click **Create Token**
4. Give it a name (e.g., "AutoWRX Integration")
5. Copy the token immediately (you won't see it again)

**Save this token** - you'll need it for backend configuration.

### 2.4 Create Template in Coder

1. In Coder dashboard, go to **Templates**
2. Click **Create Template**
3. Name it: `docker-template`
4. Upload or paste the content from `instance-setup/docker-template.tf`
5. Click **Create**

**Note**: The template will be used to create workspaces automatically.

## Step 3: Initial Gitea Setup

### 3.1 Automated Setup (Recommended)

**Option A: Use the automated setup script**

```bash
cd instance-setup

# Set admin credentials (optional, defaults are provided)
export GITEA_ADMIN_USER=gitea-admin
export GITEA_ADMIN_PASSWORD=your-secure-password
export GITEA_ADMIN_EMAIL=admin@example.com

# Run automated setup
./setup-gitea-auto.sh
```

The script will:
- Wait for Gitea to start
- Automatically complete the installation
- Create the admin user
- Set up all required configuration

**If automated setup fails**, use Option B below.

### 3.2 Manual Setup (Alternative)

**Option B: Manual installation via web interface**

Open your browser and navigate to:
```
http://localhost:3000
```

On first access, Gitea will show an installation page:

1. **Database Type**: SQLite3 (default, already configured)
2. **General Settings**:
   - **Site Title**: AutoWRX Git
   - **Repository Root Path**: `/data/git/repositories`
   - **Git LFS Root Path**: `/data/git/lfs`
   - **Run As**: `git`
   - **SSH Server Domain**: `localhost`
   - **SSH Port**: `2222`
   - **HTTP Port**: `3000`
   - **Gitea Base URL**: `http://localhost:3000`
3. **Optional Settings**:
   - **Disable Self-Registration**: ✅ Check this (we'll manage users via API)
4. **Admin Account Settings**:
   - **Admin Username**: `gitea-admin` (or match your backend config)
   - **Admin Password**: Choose a strong password
   - **Admin Email**: `admin@example.com`
5. Click **Install Gitea**

**Note**: If installation crashes/restarts (known Gitea issue), wait a few seconds and refresh the page. The installation should complete.

### 3.3 Generate Gitea Admin Token

After logging in:

1. Click on your profile (top right)
2. Go to **Settings** → **Applications**
3. Under **Generate New Token**:
   - **Token Name**: `autowrx-integration`
   - **Expiration**: Leave empty (no expiration) or set a date
4. Click **Generate Token**
5. **Copy the token immediately**

**Save this token** - you'll need it for backend configuration.

## Step 4: Configure Backend

### 4.1 Update Backend Environment Variables

Edit `backend/.env` (or create from `.env.example`) and add:

```bash
# Coder Configuration
CODER_URL=http://localhost:7080
CODER_ADMIN_API_KEY=your-coder-admin-token-here

# Prototypes HostPath (bind-mounted into workspace)
PROTOTYPES_PATH=/var/lib/autowrx/prototypes
PROTOTYPES_LINUX_UID=1000
PROTOTYPES_LINUX_GID=1000

# Gitea Configuration
GITEA_URL=http://localhost:3000
GITEA_ADMIN_USERNAME=gitea-admin
GITEA_ADMIN_PASSWORD=your-gitea-admin-password
GITEA_ADMIN_TOKEN=your-gitea-admin-token-here
```

**Important**: Replace the placeholder values with your actual tokens and credentials.

### 4.2 Restart Backend

If your backend is running, restart it to load the new environment variables:

```bash
# If using npm/yarn
cd backend
npm restart  # or yarn restart

# If using Docker
docker compose restart autowrx
```

### 4.3 Prepare and Verify HostPath (critical)

Create the prototypes host directory once:

```bash
sudo mkdir -p /var/lib/autowrx/prototypes
```

For local testing, normalize permissions so workspace users can read/write without manual chmod per prototype:

```bash
sudo chmod -R a+rwX /var/lib/autowrx/prototypes
```

Verify permissions:

```bash
stat -c "%a %u:%g %n" /var/lib/autowrx/prototypes
```

Expected (local/dev):
- Mode is writable (`777` is acceptable in local testing)
- Path exists before opening VS Code tab

## Step 5: Test the Integration

### 5.1 Test Backend API Endpoints

#### 5.1.1 Check Workspace Status (Before Creation)

```bash
# Replace PROTOTYPE_ID with an actual prototype ID from your database
curl -X GET "http://localhost:3200/v2/system/coder/workspace/PROTOTYPE_ID/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response if workspace doesn't exist:
```json
{
  "exists": false,
  "status": "not_created"
}
```

#### 5.1.2 Prepare Workspace (Create if Needed)

```bash
curl -X POST "http://localhost:3200/v2/system/coder/workspace/PROTOTYPE_ID/prepare" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "workspaceId": "workspace-id-here",
  "workspaceName": "prototype-PROTOTYPE_ID",
  "status": "starting",
  "appUrl": "http://localhost:7080/@username/workspace-name/apps/code-server",
  "sessionToken": "session-token-here",
  "repoUrl": "http://localhost:3000/org-name/repo-name.git"
}
```

**Note**: The workspace creation may take 1-2 minutes. The status will be `starting` initially.

#### 5.1.3 Get Workspace URL

```bash
curl -X GET "http://localhost:3200/v2/system/coder/workspace/PROTOTYPE_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

This should return the workspace URL and session token.

### 5.2 Test Frontend Integration

1. **Start the frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev  # or yarn dev
   ```

2. **Navigate to a Prototype**:
   - Log into AutoWRX
   - Go to a Model
   - Open a Prototype
   - Click on the **Code** tab

3. **Expected Behavior**:
   - You should see a loading state: "Creating workspace..." or "Starting workspace..."
   - After 1-2 minutes, the Coder workspace (VS Code) should load in an iframe
   - The workspace should expose prototypes under `/home/coder/prototypes`

4. **HostPath verification inside workspace terminal**:
   ```bash
   ls -la /home/coder/prototypes
   ls -la /home/coder/prototypes/<prototype-folder>
   ```
   You should be able to create/edit files under your prototype folder.

### 5.3 Verify Gitea Integration

1. **Check Gitea Organizations**:
   - Go to `http://localhost:3000`
   - Log in as admin
   - You should see organizations created for each Model

2. **Check Gitea Repositories**:
   - Navigate to an organization
   - You should see repositories for each Prototype

3. **Verify Permissions**:
   - Check that users are added to appropriate teams (Contributors/Readers)
   - Teams should have correct permissions (write/read)

## Step 6: Test Git Operations

### 6.1 Test Git Clone in Workspace

1. Open a workspace in the Code tab
2. Open the terminal in VS Code (inside the iframe)
3. Run:
   ```bash
   cd ~/project
   git status
   git log
   ```

### 6.2 Test Git Push

1. Make a change to a file in the workspace
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test commit"
   git push origin main
   ```

3. Verify in Gitea:
   - Go to the repository in Gitea
   - Check that the commit appears

### 6.3 Test GitHub Integration (Optional)

1. **Add GitHub Token**:
   - Go to User Profile in AutoWRX
   - Scroll to "GitHub Personal Access Token"
   - Enter your GitHub PAT
   - Save

2. **Create a New Workspace**:
   - The GitHub token should be automatically injected
   - Test cloning a private GitHub repository

## Step 7: Test Permission Sync

### 7.1 Add User to Model

1. In AutoWRX, add a user to a Model with "Contributor" role
2. Check Gitea:
   - Go to the Model's organization
   - Check Teams → Contributors
   - Verify the user is added

### 7.2 Remove User from Model

1. Remove a user from a Model
2. Check Gitea:
   - Verify the user is removed from teams

### 7.3 Test Lazy Sync

1. Create a user with Model permissions
2. Open the Code tab for a Prototype in that Model
3. The system should automatically sync permissions if they're missing

## Troubleshooting

### Issue: Coder workspace fails to start

**Symptoms**: Workspace status stays at "starting" or shows "failed"

**Solutions**:
1. Check Coder logs:
   ```bash
   docker compose -f coder-docker-compose.yml logs coder
   ```

2. Check workspace build logs in Coder dashboard:
   - Go to Workspaces → Select workspace → View build logs

3. Verify Docker socket is accessible:
   ```bash
   docker exec -it coder docker ps
   ```

4. Check template is correct:
   - Verify `docker-template.tf` is uploaded correctly
   - Check for syntax errors

5. If you see `permission denied` for `/var/run/docker.sock`, update `group_add` in `coder-docker-compose.yml`:
   - `group_add: ["998"]`, or
   - `group_add: ["${DOCKER_GID}"]` with:
     ```bash
     export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
     docker compose -f coder-docker-compose.yml down
     docker compose -f coder-docker-compose.yml up -d
     ```

### Issue: Gitea API errors

**Symptoms**: Backend logs show Gitea API errors

**Solutions**:
1. Verify Gitea is running:
   ```bash
   docker compose -f coder-docker-compose.yml ps gitea
   ```

2. Check Gitea logs:
   ```bash
   docker compose -f coder-docker-compose.yml logs gitea
   ```

3. Verify admin token:
   - Test token manually:
     ```bash
     curl -H "Authorization: token YOUR_TOKEN" http://localhost:3000/api/v1/user
     ```

4. Check network connectivity:
   - Ensure backend can reach `http://localhost:3000`

### Issue: Workspace iframe doesn't load

**Symptoms**: Code tab shows error or blank screen

**Solutions**:
1. Check browser console for errors
2. Verify CORS/iframe settings:
   - Check `CODER_BROWSER_ONLY=true` is set in Coder environment
3. Verify session token is valid
4. Check workspace URL is correct:
   - Format: `http://localhost:7080/@username/workspace-name/apps/code-server`

### Issue: `EACCES` / permission denied under `/home/coder/prototypes/...`

**Symptoms**:
- VS Code popup: `EACCES: permission denied, scandir ...`
- Cannot create or edit files in prototype folder

**Root cause**:
- HostPath permissions are too restrictive for the workspace user

**Fix**:
1. Normalize host permissions:
   ```bash
   sudo chmod -R a+rwX /var/lib/autowrx/prototypes
   ```
2. Restart backend and reopen VS Code tab.
3. Re-test by creating a file in `/home/coder/prototypes/<prototype-folder>`.

### Issue: "Workspace does not exist"

**Symptoms**:
- App popup says workspace does not exist, even though folder exists on host

**Root cause**:
- User is reusing an old Coder workspace created with stale mount/template values

**Fix**:
1. Delete that user's old workspace in Coder UI.
2. Reopen VS Code tab so backend creates a fresh workspace from current template.
3. Confirm mount path from workspace terminal:
   ```bash
   ls -la /home/coder/prototypes
   ```

### Issue: Git operations fail

**Symptoms**: Can't clone, push, or pull

**Solutions**:
1. Verify repository exists in Gitea
2. Check user permissions in Gitea teams
3. Verify Git credentials are configured in workspace
4. Check network connectivity from workspace to Gitea

### Issue: Permission sync not working

**Symptoms**: Users can't access repositories they should have access to

**Solutions**:
1. Check backend logs for sync errors
2. Manually trigger sync:
   - Remove and re-add user to Model
3. Verify UserRole records exist in database
4. Check Gitea API token has admin permissions

## Verification Checklist

- [ ] Coder and Gitea services are running
- [ ] Coder admin user created and API token generated
- [ ] Gitea admin user created and API token generated
- [ ] Backend environment variables configured
- [ ] Coder template created and uploaded
- [ ] Backend API endpoints respond correctly
- [ ] Frontend Code tab loads workspace
- [ ] Workspace can read/write `/home/coder/prototypes/<prototype-folder>`
- [ ] Git operations work (clone, commit, push)
- [ ] Gitea organizations and repositories are created
- [ ] User permissions sync to Gitea teams
- [ ] GitHub token integration works (if tested)

## Next Steps

After successful testing:

1. **Production Deployment**:
   - Update URLs to production domains
   - Use HTTPS for all services
   - Configure proper firewall rules
   - Set up SSL certificates

2. **Monitoring**:
   - Set up logging and monitoring
   - Configure alerts for workspace failures
   - Monitor Gitea and Coder resource usage

3. **Backup**:
   - Set up regular backups of:
     - Coder data volume
     - Gitea data volume
     - MongoDB (for AutoWRX data)

4. **Security**:
   - Rotate API tokens regularly
   - Review and restrict network access
   - Enable Gitea and Coder security features
   - Configure proper CORS settings

## Additional Resources

- [Coder Documentation](https://coder.com/docs)
- [Gitea API Documentation](https://docs.gitea.com/api)
- [Coder Terraform Provider](https://registry.terraform.io/providers/coder/coder/latest/docs)
