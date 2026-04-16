#!/usr/bin/env bash
# One-time (or after provider version bumps): download linux_amd64 provider zips into
# ./terraform-provider-mirror for Coder's embedded Terraform to use offline via
# filesystem_mirror (see coder-docker-compose.yml). Requires Docker + network.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIRROR="${SCRIPT_DIR}/terraform-provider-mirror"
WORK="${SCRIPT_DIR}/.mirror-work"
LOCK="${SCRIPT_DIR}/.terraform.lock.hcl"
TF_FILE="${SCRIPT_DIR}/docker-template.tf"
# Pin CLI used only to build the mirror layout (must support your template's syntax).
TERRAFORM_IMAGE="${TERRAFORM_IMAGE:-hashicorp/terraform:1.9.8}"

if [ ! -f "$LOCK" ] || [ ! -f "$TF_FILE" ]; then
  echo "Missing docker-template.tf or .terraform.lock.hcl in ${SCRIPT_DIR}" >&2
  exit 1
fi

if ls "${MIRROR}"/registry.terraform.io/*/*/terraform-provider-*_linux_amd64.zip >/dev/null 2>&1; then
  echo "Terraform provider mirror already present under ${MIRROR}"
  exit 0
fi

echo "Populating Terraform provider mirror (downloads ~28MB once)..."
rm -rf "$WORK"
mkdir -p "$WORK" "$MIRROR"
cp "$TF_FILE" "$LOCK" "$WORK/"

docker run --rm \
  -v "${WORK}:/work:ro" \
  -v "${MIRROR}:/mirror" \
  -w /work \
  "$TERRAFORM_IMAGE" \
  providers mirror -platform=linux_amd64 /mirror

rm -rf "$WORK"
echo "Done. Mirror at ${MIRROR}"
