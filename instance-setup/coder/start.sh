#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if ! bash "${SCRIPT_DIR}/populate-terraform-mirror.sh"; then
  echo "Warning: populate-terraform-mirror.sh failed (network/Docker?). Coder will download providers from the registry during builds."
fi

docker compose -f coder-docker-compose.yml up -d

echo "Waiting for Coder Server to start..."
docker exec -it coder /opt/coder login http://localhost:7080 \
  --first-user-username "admin" \
  --first-user-email "admin@coder.com" \
  --first-user-password "Admin@coder123" \
  --first-user-full-name "Admin User" \
  --first-user-trial=false

echo "Preparing Template files..."
(cd autowrx-runner && yarn install && yarn vsix -- -o ../workspace-image/autowrx-runner.vsix)
rm -rf ./my-template-dir template-python.tar template-cpp.tar template-rust.tar

mkdir -p ./my-template-dir/python ./my-template-dir/cpp ./my-template-dir/rust
cp .terraform.lock.hcl ./my-template-dir/python/
cp .terraform.lock.hcl ./my-template-dir/cpp/
cp .terraform.lock.hcl ./my-template-dir/rust/

echo "Building language-specific workspace images..."
docker build -f ./workspace-image/Dockerfile.python -t autowrx-workspace-python:debian ./workspace-image
docker build -f ./workspace-image/Dockerfile.cpp -t autowrx-workspace-cpp:debian ./workspace-image
docker build -f ./workspace-image/Dockerfile.rust -t autowrx-workspace-rust:debian ./workspace-image

echo "Preparing language-specific template manifests..."
sed 's/autowrx-workspace:debian/autowrx-workspace-python:debian/g' docker-template.tf > ./my-template-dir/python/docker-template.tf
sed 's/autowrx-workspace:debian/autowrx-workspace-cpp:debian/g' docker-template.tf > ./my-template-dir/cpp/docker-template.tf
sed 's/autowrx-workspace:debian/autowrx-workspace-rust:debian/g' docker-template.tf > ./my-template-dir/rust/docker-template.tf

tar -cf template-python.tar -C ./my-template-dir/python .
tar -cf template-cpp.tar -C ./my-template-dir/cpp .
tar -cf template-rust.tar -C ./my-template-dir/rust .

echo "Creating Coder templates..."
cat template-python.tar | docker exec -i coder /opt/coder templates push docker-template-python -d - --yes
cat template-cpp.tar | docker exec -i coder /opt/coder templates push docker-template-cpp -d - --yes
cat template-rust.tar | docker exec -i coder /opt/coder templates push docker-template-rust -d - --yes

# Apply template scheduling metadata (native Coder scheduling).
# Note: These settings are template metadata and cannot be configured inside docker-template.tf.
TEMPLATE_DEFAULT_TTL="${TEMPLATE_DEFAULT_TTL:-1h}"
TEMPLATE_ACTIVITY_BUMP="${TEMPLATE_ACTIVITY_BUMP:-1m}"
echo "Applying template scheduling defaults (default-ttl=${TEMPLATE_DEFAULT_TTL}, activity-bump=${TEMPLATE_ACTIVITY_BUMP})..."
docker exec -i coder /opt/coder templates edit docker-template-python --default-ttl "${TEMPLATE_DEFAULT_TTL}" --activity-bump "${TEMPLATE_ACTIVITY_BUMP}" --yes
docker exec -i coder /opt/coder templates edit docker-template-cpp --default-ttl "${TEMPLATE_DEFAULT_TTL}" --activity-bump "${TEMPLATE_ACTIVITY_BUMP}" --yes
docker exec -i coder /opt/coder templates edit docker-template-rust --default-ttl "${TEMPLATE_DEFAULT_TTL}" --activity-bump "${TEMPLATE_ACTIVITY_BUMP}" --yes

echo "Warming up Docker runtime cache..."
docker run --rm --name autowrx-workspace-python-cache-warmup --entrypoint /bin/true autowrx-workspace-python:debian
docker run --rm --name autowrx-workspace-cpp-cache-warmup --entrypoint /bin/true autowrx-workspace-cpp:debian
docker run --rm --name autowrx-workspace-rust-cache-warmup --entrypoint /bin/true autowrx-workspace-rust:debian

rm -f ./workspace-image/autowrx-runner.vsix
rm -rf ./my-template-dir template-python.tar template-cpp.tar template-rust.tar

echo "Creating Token..."
docker exec -it coder /opt/coder tokens create --name "auto-token" --lifetime 168h