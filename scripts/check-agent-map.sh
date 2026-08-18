#!/usr/bin/env bash
# check-agent-map.sh — verify that paths/links referenced by the agentic
# framework's map + entry files still resolve in the repo. Run in CI to
# catch drift when docs/structure move. Exits non-zero on any broken ref.
#
# Usage: scripts/check-agent-map.sh  (from repo root)

set -euo pipefail

if [ ! -f AGENTS.md ]; then
  echo "ERROR: run from repo root (AGENTS.md not found)" >&2
  exit 2
fi

python3 - <<'PY'
import os, re, sys

ROOT = os.getcwd()
broken = []

# Files whose links/paths we verify.
SOURCES = [
    "AGENTS.md",
    "CLAUDE.md",
    "agentic/README.md",
    "agentic/RULES.md",
    "agentic/CONVENTIONS.md",
    "agentic/SETUP.md",
    "agentic/skills/README.md",
]
# plus every skill + memory + map + learning markdown
for sub in ("agentic/skills", "agentic/memory", "agentic/map", "agentic/learning"):
    for f in sorted(os.listdir(sub)) if os.path.isdir(sub) else []:
        if f.endswith(".md"):
            SOURCES.append(f"{sub}/{f}")

# Capture markdown links:  [text](target)  — these are the navigable refs we verify.
link_re = re.compile(r'\[[^\]]*\]\(([^)]+)\)')

def skip(t):
    return (t.startswith("#") or t.startswith("http")
            or t.startswith("mailto:") or t.startswith("data:"))

def check_link(target, src):
    """Markdown link targets are source-relative (web semantics)."""
    if skip(target):
        return
    target = target.split("#", 1)[0]
    if not target or "/" not in target:
        return
    base = os.path.dirname(src)
    resolved = os.path.normpath(os.path.join(base, target))
    if not os.path.exists(resolved):
        broken.append(f"{src}: broken link -> {target}  (resolved {resolved})")

for src in SOURCES:
    if not os.path.exists(src):
        broken.append(f"(missing source file) {src}")
        continue
    text = open(src, encoding="utf-8").read()
    for m in link_re.finditer(text):
        check_link(m.group(1), src)

if broken:
    print(f"agent-map drift: {len(broken)} broken reference(s):", file=sys.stderr)
    for b in broken:
        print("  - " + b, file=sys.stderr)
    sys.exit(1)
print(f"agent-map OK: all references in {len(SOURCES)} framework file(s) resolve.")
PY