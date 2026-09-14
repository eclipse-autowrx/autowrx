#!/usr/bin/env bash
# check-license-headers.sh — verify that .js/.ts/.tsx source files CHANGED
# vs the base ref carry the repo's Eclipse/MIT SPDX header. Fails only on
# changed files, so pre-existing header debt elsewhere doesn't block PRs.
#
# Usage: scripts/check-license-headers.sh [base_ref]
#   base_ref defaults to origin/main.

set -euo pipefail

if [ ! -f AGENTS.md ]; then
  echo "ERROR: run from repo root (AGENTS.md not found)" >&2
  exit 2
fi

BASE="${1:-origin/main}"
if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  echo "WARN: base ref '$BASE' not found; falling back to HEAD~1" >&2
  BASE="HEAD~1"
fi

mapfile -t FILES < <(git diff --name-only --diff-filter=ACM "$BASE...HEAD" -- '*.js' '*.ts' '*.tsx' | grep -vE '\.d\.ts$')

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "license-headers OK: no changed .js/.ts/.tsx source files."
  exit 0
fi

missing=()
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  # Header must be in the first 12 lines.
  if ! head -12 "$f" | grep -q 'SPDX-License-Identifier: MIT'; then
    missing+=("$f")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "license-headers FAIL: ${#missing[@]} changed source file(s) missing the Eclipse/MIT SPDX header:" >&2
  for f in "${missing[@]}"; do echo "  - $f" >&2; done
  echo "Add this header at the top:" >&2
  cat >&2 <<'HDR'
// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
HDR
  exit 1
fi
echo "license-headers OK: ${#FILES[@]} changed source file(s) all carry the MIT SPDX header."