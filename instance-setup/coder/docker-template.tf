terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 0.12"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  # We connect to the same Docker socket that Coder is running on
  host = "unix:///var/run/docker.sock"
}

provider "coder" {}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# 1. Ask for Git Repo (DISABLED - Gitea disabled, using prototypes folder mount)
# data "coder_parameter" "git_repo" {
#   name         = "git_repo"
#   display_name = "Git Repository URL"
#   description  = "The URL of the git repo to clone (provided by app)"
#   default      = "https://github.com/coder/coder"
#   mutable      = true
# }

# # Optional GitHub token for external repositories (DISABLED - Gitea disabled)
# data "coder_parameter" "github_token" {
#   name         = "github_token"
#   display_name = "GitHub Personal Access Token"
#   description  = "Optional GitHub PAT for accessing private repositories"
#   type         = "string"
#   default      = ""
#   mutable      = true
# }

# Prototypes host path - bind-mount from host (provided by backend)
data "coder_parameter" "prototypes_host_path" {
  name         = "prototypes_host_path"
  display_name = "Prototypes Host Path"
  description  = "Host path to prototypes folder (bind-mount into workspace)"
  default      = "/var/lib/autowrx/prototypes"
  mutable      = true
}

# 2. Create a Volume for data persistence (survives container restart)
resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
}

# 3. Create the Workspace Container
resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  image = docker_image.autowrx_workspace.image_id
  # Name must be unique per workspace
  name  = "coder-${data.coder_workspace_owner.me.id}-${data.coder_workspace.me.name}"
  
  # Hostname inside the container
  hostname = data.coder_workspace.me.name
  
  # Entrypoint: Use agent init script with URL replacements (amd64 Linux - no arch replacement)
  entrypoint = ["sh", "-c", <<EOT
${replace(coder_agent.main.init_script, "localhost:7080", "coder:7080")}
  EOT
  ]

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    # Set the Coder server URL - use container name since we're on the same network
    "CODER_AGENT_URL=http://coder:7080/"
  ]
  
  # Connect to the same network as Coder
  networks_advanced {
    name = "coder_network"
  }
  
  # Mount the persistent volume
  volumes {
    container_path = "/home/coder"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }

  # Bind-mount prototypes folder from host (path from backend)
  volumes {
    host_path      = data.coder_parameter.prototypes_host_path.value
    container_path = "/home/coder/prototypes"
    read_only      = false
  }

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }
}

# 3b. Build a pinned "golden" workspace image (fast startup)
resource "docker_image" "autowrx_workspace" {
  name         = "autowrx-workspace:1"
  keep_locally = true

  build {
    context    = "./workspace-image"
    dockerfile = "Dockerfile"
  }
}

# 4. The Agent (Connects container to Coder Dashboard)
resource "coder_agent" "main" {
  arch = "amd64"  # x86_64 Linux (change to "arm64" for Apple Silicon)
  os   = "linux"
  # startup_script only does setup - code-server is managed by coder_script below
  startup_script = <<EOT
    #!/bin/bash
    # Do NOT use set -e: any failed command would kill the script

    # Seed home directory once for fast new-workspace readiness
    if [ ! -f "/home/coder/.autowrx_seeded" ]; then
      if [ -d "/opt/autowrx-home-seed" ]; then
        echo "Seeding /home/coder from /opt/autowrx-home-seed ..."
        if command -v rsync >/dev/null 2>&1; then
          rsync -a "/opt/autowrx-home-seed/" "/home/coder/" || true
        else
          cp -a "/opt/autowrx-home-seed/." "/home/coder/" 2>/dev/null || true
        fi
      fi
      touch "/home/coder/.autowrx_seeded" 2>/dev/null || true
    fi

    # Configure Git
    git config --global init.defaultBranch main
    git config --global credential.helper store

    # --- GITEA / GIT CLONE (DISABLED) ---
    # Re-enable when Gitea is back. Also re-enable coder_parameter git_repo and github_token above.
    #
    # if [ -n "$${data.coder_parameter.github_token.value}" ]; then
    #   echo "Configuring GitHub credentials..."
    #   echo "https://oauth2:$${data.coder_parameter.github_token.value}@github.com" > ~/.git-credentials
    #   chmod 600 ~/.git-credentials
    # fi
    #
    # mkdir -p ~/project
    # cd ~/project
    # GIT_REPO_URL="$${data.coder_parameter.git_repo.value}"
    # GIT_REPO_URL=$(echo "$GIT_REPO_URL" | sed 's|localhost:3000|gitea:3000|g')
    # GIT_REPO_URL=$(echo "$GIT_REPO_URL" | sed 's|127\.0\.0\.1:3000|gitea:3000|g')
    # if [ ! -d ".git" ]; then
    #   echo "Cloning repository: $GIT_REPO_URL"
    #   git clone "$GIT_REPO_URL" . || {
    #     GIT_REPO_URL_FALLBACK=$(echo "$GIT_REPO_URL" | sed 's|gitea:3000|host.docker.internal:3000|g')
    #     git clone "$GIT_REPO_URL_FALLBACK" . || echo "Warning: Could not clone repository"
    #   }
    # else
    #   echo "Repository already exists, pulling latest changes..."
    #   git remote set-url origin "$GIT_REPO_URL" 2>/dev/null || true
    #   git pull || echo "Warning: Could not pull latest changes"
    # fi
    #
    # if [ -f "requirements.txt" ]; then
    #   echo "Installing Python dependencies..."
    #   python3 -m pip install --user -r requirements.txt || echo "Warning: Could not install Python dependencies"
    # fi
    # --- END GITEA / GIT CLONE ---

    # Ensure prototypes mount dir exists (fallback if backend didn't create it)
    mkdir -p /home/coder/prototypes

    echo "Setup complete."
  EOT
}

# 4b. Run code-server as a managed coder_script (survives agent lifecycle properly)
# Using exec so Coder manages the process and captures all logs including
# "Session server listening on ..." which the frontend polls for.
resource "coder_script" "code_server" {
  agent_id     = coder_agent.main.id
  display_name = "code-server"
  icon         = "/icon/code.svg"
  script = <<EOT
    #!/bin/bash

    # Find code-server binary
    CODE_SERVER_CMD=""
    if command -v code-server &>/dev/null; then
      CODE_SERVER_CMD="code-server"
    elif [ -f "/usr/bin/code-server" ]; then
      CODE_SERVER_CMD="/usr/bin/code-server"
    elif [ -f "/usr/local/bin/code-server" ]; then
      CODE_SERVER_CMD="/usr/local/bin/code-server"
    else
      echo "ERROR: code-server not found in image."
      exit 1
    fi

    echo "Starting code-server on port 13337..."
    # exec replaces shell with code-server so Coder owns the process lifecycle
    exec $CODE_SERVER_CMD --auth none --port 13337 --bind-addr 0.0.0.0:13337
  EOT
  run_on_start = true
}

# 5. The App (VS Code Web UI)
resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  # folder is set per-prototype by frontend via ?folder=; default to prototypes root
  url          = "http://localhost:13337/?folder=/home/coder/prototypes"
  icon         = "/icon/code.svg"
  subdomain    = false  # Set to false for local development (no wildcard DNS needed)
  share        = "owner"  # Only owner can access
}
