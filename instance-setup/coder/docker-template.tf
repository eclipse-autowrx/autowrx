terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "= 2.15.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "= 4.0.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

provider "coder" {}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

data "coder_parameter" "prototypes_host_path" {
  name         = "prototypes_host_path"
  display_name = "Prototypes Host Path"
  description  = "Host path mounted to /home/coder/prototypes"
  default      = "/var/lib/autowrx/prototypes"
  mutable      = true
}

resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
}

resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count
  image = "autowrx-workspace:1"
  name  = "coder-${data.coder_workspace_owner.me.id}-${data.coder_workspace.me.name}"
  hostname = data.coder_workspace.me.name

  entrypoint = ["sh", "-c", <<EOT
${replace(coder_agent.main.init_script, "localhost:7080", "coder:7080")}
  EOT
  ]

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    "CODER_AGENT_URL=http://coder:7080/"
  ]

  networks_advanced {
    name = "coder_network"
  }

  volumes {
    container_path = "/home/coder"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }

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

resource "coder_agent" "main" {
  arch = "amd64"
  os   = "linux"
  startup_script = <<EOT
    #!/bin/bash
    if [ ! -f "/home/coder/.autowrx_seeded" ]; then
      if [ -d "/opt/autowrx-home-seed" ]; then
        if command -v rsync >/dev/null 2>&1; then
          rsync -a "/opt/autowrx-home-seed/" "/home/coder/" || true
        else
          cp -a "/opt/autowrx-home-seed/." "/home/coder/" 2>/dev/null || true
        fi
      fi
      touch "/home/coder/.autowrx_seeded" 2>/dev/null || true
    fi

    git config --global init.defaultBranch main
    git config --global credential.helper store
    mkdir -p /home/coder/prototypes
  EOT
}

resource "coder_script" "code_server" {
  agent_id     = coder_agent.main.id
  display_name = "code-server"
  icon         = "/icon/code.svg"
  script = <<EOT
    #!/bin/bash

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

    exec $CODE_SERVER_CMD --auth none --port 13337 --bind-addr 0.0.0.0:13337
  EOT
  run_on_start = true
}

resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  url          = "http://localhost:13337/?folder=/home/coder/prototypes"
  icon         = "/icon/code.svg"
  subdomain    = false
  share        = "owner"
}
