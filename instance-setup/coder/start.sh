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
rm -rf ./my-template-dir template.tar

mkdir -p ./my-template-dir
cp docker-template.tf .terraform.lock.hcl ./my-template-dir/
(cd autowrx-runner && yarn vsix -- -o ../workspace-image/autowrx-runner.vsix)
cp -rL workspace-image ./my-template-dir/

tar -cf template.tar -C ./my-template-dir .

echo "Creating Coder Template..."
cat template.tar | docker exec -i coder /opt/coder templates push docker-template -d - --yes

echo "Warming up Docker cache for better UX..."
docker build -t autowrx-workspace:debian ./my-template-dir/workspace-image
echo "Starting and removing dummy container to warm runtime cache..."
docker run --rm --name autowrx-workspace-cache-warmup --entrypoint /bin/true autowrx-workspace:debian

rm -f ./workspace-image/autowrx-runner.vsix
rm -rf ./my-template-dir template.tar

echo "Creating Token..."
docker exec -it coder /opt/coder tokens create --name "auto-token" --lifetime "7d"