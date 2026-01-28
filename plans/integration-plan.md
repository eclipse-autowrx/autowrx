# Coder Integration Plan: "White-Labeled" IDE Engine

This document outlines the architectural blueprint and implementation steps to integrate Coder v2 as a backend "IDE Engine" for your web application. The goal is to provide a seamless "Idea to Code" experience where the user never explicitly interacts with the Coder dashboard, but instead uses a specific "Code Tab" within your application.

## 1. High-Level Architecture

The system operates on a "Headless" model where your Webapp controls Coder via API.

```mermaid
graph TD
    User[End User] --> WebApp[Your Web Application]
    WebApp -- 1. Login (JWT) --> Backend[Your Backend]
    
    subgraph "Your Backend"
        API[Orchestration Service]
    end
    
    subgraph "Git Services"
        Gitea[Internal Gitea (Default)]
        GitHub[External GitHub (Optional)]
    end
    
    Backend -- 2. Create/Check Repo --> Gitea
    Backend -- 3. Request Token (Impersonation) --> Coder[Coder Control Plane]
    Coder -- 4. Session Token --> Backend
    Backend -- 5. Pass Token + Iframe URL --> User
    
    subgraph "Frontend Browser"
        IFrame[Code Tab (Iframe)]
    end
    
    User -- 6. Auth w/ Token --> IFrame
    Coder -- 7. Serve VS Code --> IFrame
    IFrame -- 8. Git Pull/Push --> Gitea
    IFrame -. 9. Git Pull/Push (Token) .-> GitHub
```

## 2. Phase 1: Authentication & Identity (The "Vouching" Method)

Since we are operating in an **Offline LAN** environment and want to maintain the existing lightweight JWT authentication system, we will use **Impersonation**.

### Strategy: "The Trusted Bridge"
Your backend acts as a Trusted Admin that "vouches" for the user to Coder.

1.  **Trust:** Create a highly privileged API Token for Coder (`CODER_ADMIN_TOKEN`).
2.  **Mapping:** Map your Webapp User ID to a Coder Username (e.g., `User(id=5)` -> `coder_user: "user5"`).
3.  **Exchange:**
    *   User logs into **Your Webapp**.
    *   Webapp backend requests a **Session Token** from Coder API for that specific username.
    *   Webapp frontend uses this token to authenticate the iframe.

### Implementation Checklist
- [ ] **Generate Admin Token:** Run `coder tokens create --user admin_user` in the Coder CLI to get a long-lived admin key.
- [ ] **Config:** Add this key to your Backend `.env` file (`CODER_ADMIN_API_KEY`).
- [ ] **User Sync (Lazy Loading):**
    *   When `createWorkspace()` is called, first check if the user exists in Coder.
    *   If not, call `POST /api/v2/users` to create them (password can be random/hidden as they will never use it).

## 3. Phase 2: Template Design (The Blueprint)

We need a flexible template that accepts the Git repository URL dynamically from your application.

### Modifications to `docker-template.tf`

We will add an auto-stop policy (to save resources) and ensure the Git repo parameter is mutable.

**Key Changes:**
1.  **Auto-Stop:** Shut down workspace after 1 hour of inactivity.
2.  **Language Support:** Ensure the underlying Docker image supports both Python and C++.

```hcl
# ... providers ...

data "coder_parameter" "git_repo" {
  name         = "git_repo"
  display_name = "Git Repository URL"
  description  = "The URL of the git repo to clone (provided by app)"
  mutable      = true # Allow changing repo if needed
}

resource "docker_container" "workspace" {
  # ... existing config ...
  
  # Use a heavier image with Python/C++ pre-installed, or install in startup_script
  # Recommendation: Build a custom image "my-custom-coder-image" with gcc, python3, etc.
  image = "codercom/code-server:latest" 
  
  # ... envs ...
}

# Add Auto-Stop Metadata (Cost Control)
resource "coder_metadata" "workspace_info" {
  count       = data.coder_workspace.me.start_count
  resource_id = docker_container.workspace[0].id
  item {
    key   = "ttl"
    value = "1h" # Display only, actual enforcement handled by Coder TTL settings
  }
}
```

## 4. Phase 3: Backend Orchestration (The Brain)

Your application backend will handle the lifecycle logic. When a user opens the "Code" tab:

### Logic Flow

1.  **Check Status:** Query Coder API for a workspace named `proj-{projectId}` for the current user.
2.  **Scenario A: Does not exist**
    *   Call `POST /api/v2/organizations/{org}/members/{user}/workspaces`
    *   Payload: `{ "template_id": "...", "name": "proj-123", "rich_parameter_values": [{"name":"git_repo", "value": "https://git.myapp.com/repo.git"}] }`
3.  **Scenario B: Exists but Stopped**
    *   Call `POST /api/v2/workspaces/{workspace_id}/builds`
    *   Payload: `{ "transition": "start" }`
4.  **Scenario C: Running**
    *   Retrieve the specific app URL from the workspace resources.

### API Reference (Pseudocode)

```javascript
// POST /api/v2/tokens (Impersonation Step)
const tokenResponse = await axios.post(
  `${CODER_URL}/api/v2/tokens`,
  { user: "username_of_target_user" }, // The user we want to be
  { headers: { "Coder-Session-Token": ADMIN_API_KEY } }
);
const userSessionToken = tokenResponse.data.key;

// Use this token for subsequent calls OR send to frontend
```

## 5. Phase 4: Frontend Integration (The Face)

Embedding the IDE into your application.

### Iframe Implementation

Once the backend confirms the workspace is `running`, it returns the authenticated URL to the frontend.

```html
<!-- The workspace URL format usually follows: -->
<!-- https://coder.example.com/@{username}/{workspace_name}.{agent_name}/apps/code-server -->

<iframe 
  src="https://coder.example.com/@nhan/project-alpha/apps/code-server?folder=/home/coder/project"
  style="width: 100%; height: 800px; border: none;"
  allow="clipboard-read; clipboard-write;"
></iframe>
```

### User Experience Polish
*   **Loading State:** While Coder is provisioning (transitioning from `starting` to `running`), show a "Booting up your environment..." spinner in your app instead of the raw Coder loading screen.
*   **File Context:** Append `?folder=/home/coder/project/src` to the URL to open specific folders deep in the project structure.

## 6. Phase 5: Python & C++ Specifics

Since your users need Python or C++, the default `code-server` image might be too lightweight.

### Option A: Startup Script (Easier, Slower boot)
Modify the `startup_script` in `docker-template.tf` to install dependencies every time.

```bash
# In docker-template.tf
startup_script = <<EOT
  #!/bin/bash
  sudo apt-get update && sudo apt-get install -y build-essential python3-pip cmake
  # ... clone repo ...
EOT
```

### Option B: Custom Image (Recommended for Production)
Build a Docker image containing all your dev tools and use that in the `docker_container` resource.

```dockerfile
# Dockerfile
FROM codercom/code-server:latest
USER root
RUN apt-get update && apt-get install -y build-essential g++ python3 python3-pip
USER coder
```

## 7. Phase 5: Git Integration (Hybrid Strategy)

We will support **Internal Git (Gitea)** as the default for offline capability, while allowing users to optionally connect to **GitHub** via Personal Access Tokens (PAT).

### A. Internal Git (Gitea) - The "Default"
1.  **Deployment:** Run a Gitea container alongside Coder in `coder-docker-compose.yml`.
2.  **Automation:** When a workspace is created, your Backend automatically creates a repository in Gitea for that project.
3.  **Auth:** Pre-configure the workspace to authenticate with Gitea using a system bot account or an OAuth link.

### B. External Git (GitHub) - The "Optional"
1.  **User Action:** User pastes a GitHub PAT into their User Settings in your Webapp (or directly in Coder).
2.  **Injection:** Pass this token into the workspace via `rich_parameter_values` or Environment Variables (`GITHUB_TOKEN`).
3.  **Usage:** The startup script configures git credential helper to use this token for `github.com` domains.

```bash
# Example Startup Script addition
git config --global credential.helper store
if [ -n "$GITHUB_TOKEN" ]; then
  echo "https://oauth2:$GITHUB_TOKEN@github.com" > ~/.git-credentials
fi
```

## 9. Phase 6: Collaboration & Permissions (Mapping Strategy)

We map your application's hierarchy directly to Gitea's structure to handle permissions automatically.

### Hierarchy Mapping

| Your App Entity | Gitea Entity | Coder Entity |
| :--- | :--- | :--- |
| **Model** (Project Group) | **Organization** | (N/A - Logical Grouping) |
| **User (Contributor)** | **Team (Write Access)** | **User** |
| **User (Reader)** | **Team (Read Access)** | **User** |
| **Prototype** (Project) | **Repository** | **Workspace** |

### Implementation Logic (Backend Orchestrator)

When a user performs actions in your App, the Backend triggers the corresponding Gitea API calls:

1.  **Create Model:**
    *   `POST /api/v1/orgs` (Create Organization in Gitea)
    *   `POST /api/v1/orgs/{org}/teams` (Create "Contributors" and "Readers" teams)
2.  **Add User to Model:**
    *   `PUT /api/v1/teams/{id}/members/{username}` (Add user to appropriate team)
3.  **Create Prototype:**
    *   `POST /api/v1/orgs/{org}/repos` (Create Repo in Gitea)
    *   `POST /api/v2/workspaces` (Create Coder Workspace for the creator)

### Syncing Strategy
*   **Lazy Sync:** When a user opens a "Prototype", check if they are in the Gitea team. If not, add them (self-healing).
*   **Event Driven:** If possible, use hooks or service calls in your `ModelController` to push updates to Gitea immediately.
