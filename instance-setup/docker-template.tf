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

# 1. Ask for Git Repo
data "coder_parameter" "git_repo" {
  name         = "git_repo"
  display_name = "Git Repository URL"
  description  = "The URL of the git repo to clone (provided by app)"
  default      = "https://github.com/coder/coder"
  mutable      = true
}

# Optional GitHub token for external repositories
data "coder_parameter" "github_token" {
  name         = "github_token"
  display_name = "GitHub Personal Access Token"
  description  = "Optional GitHub PAT for accessing private repositories"
  type         = "string"
  default      = ""
  mutable      = true
}

# 2. Create a Volume for data persistence (survives container restart)
resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
}

# 3. Create the Workspace Container
resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  image = "codercom/code-server:latest"
  # Name must be unique per workspace
  name  = "coder-${data.coder_workspace_owner.me.id}-${data.coder_workspace.me.name}"
  
  # Hostname inside the container
  hostname = data.coder_workspace.me.name
  
  # Entrypoint: Use agent init script with URL replacements
  entrypoint = ["sh", "-c", <<EOT
${replace(replace(coder_agent.main.init_script, "localhost:7080", "coder:7080"), "linux-amd64", "linux-arm64")}
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

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }
}

# 4. The Agent (Connects container to Coder Dashboard)
resource "coder_agent" "main" {
  arch           = "arm64"  # ARM64 for Apple Silicon / aarch64
  os             = "linux"
  startup_script = <<EOT
    #!/bin/bash
    set -e
    
    # Install development tools (Python and C++)
    echo "Installing development tools..."
    sudo apt-get update
    sudo apt-get install -y \
      build-essential \
      g++ \
      gcc \
      python3 \
      python3-pip \
      python3-venv \
      cmake \
      git \
      curl \
      wget \
      vim \
      nano
    
    # Configure Git
    git config --global init.defaultBranch main
    git config --global credential.helper store
    
    # Configure GitHub token if provided
    if [ -n "${data.coder_parameter.github_token.value}" ]; then
      echo "Configuring GitHub credentials..."
      echo "https://oauth2:${data.coder_parameter.github_token.value}@github.com" > ~/.git-credentials
      chmod 600 ~/.git-credentials
    fi
    
    # Clone or update repository
    mkdir -p ~/project
    cd ~/project
    
    # Get the repository URL (may already have gitea:3000 and authentication)
    GIT_REPO_URL="${data.coder_parameter.git_repo.value}"
    
    # Replace localhost:3000 with gitea:3000 for Docker network access if not already replaced
    GIT_REPO_URL=$(echo "$GIT_REPO_URL" | sed 's|localhost:3000|gitea:3000|g')
    GIT_REPO_URL=$(echo "$GIT_REPO_URL" | sed 's|127\.0\.0\.1:3000|gitea:3000|g')
    
    if [ ! -d ".git" ]; then
      echo "Cloning repository: $GIT_REPO_URL"
      # Clone with authentication (credentials may be in URL)
      git clone "$GIT_REPO_URL" . || {
        echo "Error: Failed to clone repository. Trying fallback methods..."
        # Fallback 1: try using host.docker.internal if gitea service name doesn't work
        GIT_REPO_URL_FALLBACK=$(echo "$GIT_REPO_URL" | sed 's|gitea:3000|host.docker.internal:3000|g')
        git clone "$GIT_REPO_URL_FALLBACK" . || {
          echo "Warning: Could not clone repository with fallback URL"
          echo "Repository URL used: $GIT_REPO_URL"
        }
      }
    else
      echo "Repository already exists, pulling latest changes..."
      git remote set-url origin "$GIT_REPO_URL" 2>/dev/null || true
      git pull || echo "Warning: Could not pull latest changes"
    fi
    
    # Install Python dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
      echo "Installing Python dependencies..."
      python3 -m pip install --user -r requirements.txt || echo "Warning: Could not install Python dependencies"
    fi
    
    # Start code-server in the background (this runs after agent connects)
    # The codercom/code-server image already has code-server installed
    echo "Starting code-server on port 13337..."
    
    # Try to find code-server in common locations
    CODE_SERVER_CMD=""
    if command -v code-server &> /dev/null; then
      CODE_SERVER_CMD="code-server"
    elif [ -f "/usr/bin/code-server" ]; then
      CODE_SERVER_CMD="/usr/bin/code-server"
    elif [ -f "/usr/local/bin/code-server" ]; then
      CODE_SERVER_CMD="/usr/local/bin/code-server"
    else
      echo "Installing code-server..."
      curl -fsSL https://code-server.dev/install.sh | sh
      CODE_SERVER_CMD="code-server"
    fi
    
    # Start code-server in background with proper logging
    mkdir -p /tmp
    $CODE_SERVER_CMD --auth none --port 13337 --bind-addr 0.0.0.0:13337 --verbose > /tmp/code-server.log 2>&1 &
    CODE_SERVER_PID=$!
    echo "code-server started in background (PID: $CODE_SERVER_PID)"
    
    # Wait a moment and verify it's running
    sleep 3
    
    # Check if process is still running
    if kill -0 $CODE_SERVER_PID 2>/dev/null; then
      echo "✓ code-server is running (PID: $CODE_SERVER_PID)"
    else
      echo "⚠ Warning: code-server process died. Checking logs..."
      tail -20 /tmp/code-server.log || echo "No log file found"
      # Try to restart it
      echo "Attempting to restart code-server..."
      $CODE_SERVER_CMD --auth none --port 13337 --bind-addr 0.0.0.0:13337 > /tmp/code-server.log 2>&1 &
      sleep 2
    fi
    
    # Final verification
    if pgrep -f "code-server.*13337" > /dev/null || netstat -tuln 2>/dev/null | grep -q ":13337" || ss -tuln 2>/dev/null | grep -q ":13337"; then
      echo "✓ code-server is listening on port 13337"
    else
      echo "⚠ Warning: code-server may not be accessible on port 13337"
      echo "Log output:"
      tail -10 /tmp/code-server.log 2>/dev/null || echo "No logs available"
    fi
  EOT
}

# 5. The App (VS Code Web UI)
resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  url          = "http://localhost:13337/?folder=/home/coder/project"
  icon         = "/icon/code.svg"
  subdomain    = false  # Set to false for local development (no wildcard DNS needed)
  share        = "authenticated"  # Allow authenticated users to access (changed from "owner")
}
