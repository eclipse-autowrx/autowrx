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
(cd autowrx-runner && yarn vsix -- -o ../workspace-image/autowrx-runner.vsix)
rm -rf ./my-template-dir template-python.tar template-cpp.tar

mkdir -p ./my-template-dir/python ./my-template-dir/cpp
cp .terraform.lock.hcl ./my-template-dir/python/
cp .terraform.lock.hcl ./my-template-dir/cpp/

echo "Building language-specific workspace images..."
docker build -f ./workspace-image/Dockerfile.python -t autowrx-workspace-python:debian ./workspace-image
docker build -f ./workspace-image/Dockerfile.cpp -t autowrx-workspace-cpp:debian ./workspace-image

echo "Preparing language-specific template manifests..."
sed 's/autowrx-workspace:debian/autowrx-workspace-python:debian/g' docker-template.tf > ./my-template-dir/python/docker-template.tf
sed 's/autowrx-workspace:debian/autowrx-workspace-cpp:debian/g' docker-template.tf > ./my-template-dir/cpp/docker-template.tf

tar -cf template-python.tar -C ./my-template-dir/python .
tar -cf template-cpp.tar -C ./my-template-dir/cpp .

echo "Creating Coder templates..."
cat template-python.tar | docker exec -i coder /opt/coder templates push docker-template-python -d - --yes
cat template-cpp.tar | docker exec -i coder /opt/coder templates push docker-template-cpp -d - --yes

echo "Warming up Docker runtime cache..."
docker run --rm --name autowrx-workspace-python-cache-warmup --entrypoint /bin/true autowrx-workspace-python:debian
docker run --rm --name autowrx-workspace-cpp-cache-warmup --entrypoint /bin/true autowrx-workspace-cpp:debian

rm -f ./workspace-image/autowrx-runner.vsix
rm -rf ./my-template-dir template-python.tar template-cpp.tar

echo "Creating Token..."
docker exec -it coder /opt/coder tokens create --name "auto-token" --lifetime 168h