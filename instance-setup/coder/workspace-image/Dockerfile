FROM codercom/code-server:4.110.1

USER root

# Install common dev tooling at build-time (fast workspace startup)
RUN apt-get update -qq && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential gcc g++ cmake \
  python3 python3-pip python3-venv \
  git curl wget vim nano \
  rsync ca-certificates && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Python base dependencies (installed once at image build-time)
COPY requirements.base.txt /tmp/requirements.base.txt
#
# PEP 668: some base images mark the system Python as "externally managed",
# which blocks system-wide pip installs. Install into a dedicated venv.
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip setuptools wheel && \
    if [ -s /tmp/requirements.base.txt ]; then \
      /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.base.txt; \
    fi

# Make venv Python/pip default (so users can run `pip`, `python` directly)
RUN ln -sf /opt/venv/bin/python /usr/local/bin/python3 && \
    ln -sf /opt/venv/bin/python /usr/local/bin/python && \
    ln -sf /opt/venv/bin/pip /usr/local/bin/pip

# Seed content copied into the persistent /home/coder volume on first start
COPY home-seed/ /opt/autowrx-home-seed/
RUN chown -R coder:coder /opt/autowrx-home-seed

USER coder

# Install OpenCode CLI for the coder user at build-time
RUN curl -fsSL https://opencode.ai/install | bash

# Use the venv Python by default for all subsequent processes
ENV VIRTUAL_ENV="/opt/venv"
ENV PATH="/home/coder/.local/bin:/opt/venv/bin:${PATH}"

# Auto-activate venv in interactive shells (if shell reads /etc/profile.d)
USER root
RUN printf '%s\n' \
  'export VIRTUAL_ENV="/opt/venv"' \
  'export PATH="/opt/venv/bin:$PATH"' \
  > /etc/profile.d/autowrx-venv.sh && \
  chmod 0644 /etc/profile.d/autowrx-venv.sh
USER coder

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
