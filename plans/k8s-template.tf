terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 0.12"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "coder" {}

# Use the config from the environment where Coder is running
provider "kubernetes" {
  config_path = null 
}

data "coder_workspace" "me" {}

data "coder_parameter" "git_repo" {
  name         = "git_repo"
  display_name = "Git Repository URL"
  default      = "[https://github.com/coder/coder](https://github.com/coder/coder)"
}

# 1. Create PVC for persistent storage
resource "kubernetes_persistent_volume_claim" "home" {
  metadata {
    name      = "coder-${data.coder_workspace.me.owner}-${data.coder_workspace.me.name}-home"
    namespace = "coder"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "10Gi"
      }
    }
  }
}

# 2. Define the Pod
resource "kubernetes_pod" "main" {
  count = data.coder_workspace.me.start_count
  metadata {
    name      = "coder-${data.coder_workspace.me.owner}-${data.coder_workspace.me.name}"
    namespace = "coder"
  }
  spec {
    security_context {
      run_as_user = 1000
      fs_group    = 1000
    }
    
    container {
      name    = "dev"
      image   = "codercom/code-server:latest"
      command = ["sh", "-c", "code-server --auth none --port 13337"]
      
      env {
        name  = "CODER_AGENT_TOKEN"
        value = coder_agent.main.token
      }
      
      volume_mount {
        mount_path = "/home/coder"
        name       = "home"
        read_only  = false
      }
    }

    volume {
      name = "home"
      persistent_volume_claim {
        claim_name = kubernetes_persistent_volume_claim.home.metadata.0.name
      }
    }
  }
}

resource "coder_agent" "main" {
  arch           = "amd64"
  os             = "linux"
  startup_script = <<EOT
    #!/bin/bash
    mkdir -p ~/project
    cd ~/project
    if [ ! -d ".git" ]; then
      git clone ${data.coder_parameter.git_repo.value} .
    fi
  EOT
}

resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  url          = "http://localhost:13337/?folder=/home/coder/project"
  icon         = "/icon/code.svg"
  subdomain    = false  # Set to false for local development (no wildcard DNS needed)
  share        = "owner"
}
