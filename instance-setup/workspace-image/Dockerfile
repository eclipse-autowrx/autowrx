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

# Seed content copied into the persistent /home/coder volume on first start
COPY home-seed/ /opt/autowrx-home-seed/
RUN chown -R coder:coder /opt/autowrx-home-seed

USER coder
