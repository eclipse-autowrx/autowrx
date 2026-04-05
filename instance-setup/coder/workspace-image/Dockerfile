FROM codercom/code-server:4.110.1

USER root

# Install common dev tooling at build-time (fast workspace startup)
RUN apt-get update -qq && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential gcc g++ cmake \
  python3 python3-pip \
  git curl wget vim nano \
  rsync ca-certificates && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Python base dependencies (installed once at image build-time).
# No venv: this image is dedicated to the workspace; use system site-packages.
# PEP 668 requires --break-system-packages for non-venv pip on Debian/Ubuntu.
COPY requirements.base.txt /tmp/requirements.base.txt
RUN pip3 install --no-cache-dir --break-system-packages --upgrade pip setuptools wheel && \
    if [ -s /tmp/requirements.base.txt ]; then \
      pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.base.txt; \
    fi

# Seed content copied into the persistent /home/coder volume on first start
COPY home-seed/ /opt/autowrx-home-seed/
RUN chown -R coder:coder /opt/autowrx-home-seed

USER coder

# Install OpenCode CLI for the coder user at build-time
RUN curl -fsSL https://opencode.ai/install | bash

ENV PATH="/home/coder/.local/bin:${PATH}"

# VS Code extensions to pre-install in the image
COPY --chown=coder:coder extensions.base.txt /tmp/extensions.base.txt
RUN if [ -s /tmp/extensions.base.txt ]; then \
  while IFS= read -r ext || [ -n "$ext" ]; do \
  case "$ext" in \
  ""|\#*) continue ;; \
  esac; \
        code-server --install-extension "$ext" || echo "Warning: failed to install extension: $ext"; \
  done < /tmp/extensions.base.txt; \
  fi

COPY --chown=coder:coder autowrx-runner.vsix /tmp/autowrx-runner.vsix
RUN code-server --install-extension /tmp/autowrx-runner.vsix && rm /tmp/autowrx-runner.vsix
