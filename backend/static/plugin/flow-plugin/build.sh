#!/usr/bin/env bash
set -euo pipefail

# Build flow-plugin as IIFE bundle
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$ROOT_DIR"
mkdir -p "$OUT_DIR"

# Install dependencies if package.json exists
if [ -f "${ROOT_DIR}/package.json" ]; then
  echo "Installing plugin dependencies..."
  cd "${ROOT_DIR}"
  npm install --silent
fi

# Build CSS with Tailwind (PostCSS)
echo "Building Tailwind CSS..."
npx postcss "${ROOT_DIR}/src/flow-plugin.css" -o "${ROOT_DIR}/src/flow-plugin.generated.css"

# Build with esbuild
# External packages: react, react-dom/client, react/jsx-runtime (provided by host)
# All other dependencies will be bundled into the plugin
npx esbuild "${ROOT_DIR}/src/index.ts" \
  --bundle \
  --format=iife \
  --platform=browser \
  --jsx=automatic \
  --loader:.css=text \
  --external:react \
  --external:react-dom/client \
  --external:react/jsx-runtime \
  --sourcemap \
  --outfile="${OUT_DIR}/index.js"

echo "Built plugin to ${OUT_DIR}/index.js"
