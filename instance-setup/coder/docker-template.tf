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

variable "docker_socket" {
  default     = ""
  description = "(Optional) Docker socket URI (e.g. unix:///var/run/docker.sock). Empty uses Terraform default."
  type        = string
}

provider "docker" {
  host = var.docker_socket != "" ? var.docker_socket : null
}

provider "coder" {}

# Workspace scheduling (default autostop/activity bump) is configured at template metadata level
# via `coder templates edit` (see instance-setup/coder/start.sh), not inside this Terraform file.
data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

data "coder_parameter" "prototypes_host_path" {
  name         = "prototypes_host_path"
  display_name = "Prototypes Host Path"
  description  = "Host path mounted to /home/coder/prototypes (must match AutoWRX PROTOTYPES_PATH layout)."
  default      = "/opt/autowrx/prototypes"
  mutable      = true
}

resource "coder_agent" "main" {
  arch = data.coder_provisioner.me.arch
  os   = "linux"

  startup_script = <<-EOT
    set -e

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

    mkdir -p /home/coder/prototypes
  EOT
}

# Use image-bundled code-server with an explicit bind address. The registry module only passes
# --port; code-server then listens on 127.0.0.1, while Coder's app proxy dials the workspace
# tailnet address → 502 "connection refused" (see https://github.com/coder/coder/issues/12790 ).
resource "coder_script" "code_server" {
  agent_id     = coder_agent.main.id
  display_name = "code-server"
  icon         = "/icon/code.svg"
  run_on_start = true
  script       = <<-EOT
    #!/bin/bash
    set -eu
    mkdir -p /home/coder/.config/code-server
    printf '%s\n' 'bind-addr: 0.0.0.0:13337' > /home/coder/.config/code-server/config.yaml

    CODE_SERVER_CMD=""
    if command -v code-server >/dev/null 2>&1; then
      CODE_SERVER_CMD="$(command -v code-server)"
    elif [ -x /usr/bin/code-server ]; then
      CODE_SERVER_CMD=/usr/bin/code-server
    elif [ -x /usr/local/bin/code-server ]; then
      CODE_SERVER_CMD=/usr/local/bin/code-server
    else
      echo "ERROR: code-server not found in workspace image."
      exit 1
    fi

    # Background like the official module so the script can exit; bind all interfaces for Coder app proxy.
    nohup "$CODE_SERVER_CMD" --auth none --bind-addr 0.0.0.0:13337 --port 13337 >> /tmp/code-server-autowrx.log 2>&1 &
    disown || true
  EOT
}

resource "coder_app" "code_server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  url          = "http://localhost:13337/"
  icon         = "/icon/code.svg"
  subdomain    = false
  share        = "owner"
  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 5
    threshold = 6
  }
}

resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
  lifecycle {
    ignore_changes = all
  }
  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }
  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }
  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }
  labels {
    label = "coder.workspace_name_at_creation"
    value = data.coder_workspace.me.name
  }
}

resource "docker_container" "workspace" {
  count    = data.coder_workspace.me.start_count
  image    = "autowrx-workspace:debian"
  name     = "coder-${data.coder_workspace_owner.me.name}-${lower(data.coder_workspace.me.name)}"
  hostname = data.coder_workspace.me.name

  # Agent must reach Coder API (compose service `coder`).
  entrypoint = ["sh", "-c", replace(
    replace(
      replace(
        replace(coder_agent.main.init_script, "localhost:7080", "coder:7080"),
        "127.0.0.1",
        "host.docker.internal",
      ),
      "http://localhost:",
      "http://host.docker.internal:",
    ),
    "https://localhost:",
    "https://host.docker.internal:",
  )]

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    "CODER_AGENT_URL=http://coder:7080/",
    "CODER_WORKSPACE_ID=${data.coder_workspace.me.id}",
    "AUTOWRX_RUNNER_WS_URL=ws://host.docker.internal:3200/v2/system/coder/runner/ws",
  ]

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  networks_advanced {
    name = "coder_network"
  }

  volumes {
    container_path = "/home/coder"
    volume_name      = docker_volume.home_volume.name
    read_only        = false
  }

  volumes {
    host_path      = data.coder_parameter.prototypes_host_path.value
    container_path = "/home/coder/prototypes"
    read_only      = false
  }

  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }
  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }
  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }
  labels {
    label = "coder.workspace_name"
    value = data.coder_workspace.me.name
  }
}
