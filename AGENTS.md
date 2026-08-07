# AGENTS.md — AutoWRX

> Vendor-neutral entry point for any AI coding agent (Claude Code, opencode, openclaw, …). Read this first.

AutoWRX is a cloud-based rapid-prototyping environment for software-defined vehicle (SDV) apps. Stack: **Node.js/Express + MongoDB** backend, **React + Vite + TypeScript** frontend, **Playwright** E2E, **Docker Compose** deploy.

## Start here (always load)

- **Rules (must/must-not):** [`agentic/RULES.md`](./agentic/RULES.md)
- **Conventions:** [`agentic/CONVENTIONS.md`](./agentic/CONVENTIONS.md)

Key rules in one line:
- Commit with **your own ECA-signed identity** — every contributor uses their own GitHub/email account (the one they signed the ECA with). `git commit -s`.
- Never commit on `main`. PRs target `main`. Never commit secrets (`.env*`).
- Don't push/deploy unless explicitly asked. Run tests before declaring done. Self-review every diff.

## Understand the repo (before real work)

Don't re-scan the whole repo. Run the **`understand-the-repo`** skill: load [`agentic/map/INDEX.md`](./agentic/map/INDEX.md) + [`agentic/memory/MEMORY.md`](./agentic/memory/MEMORY.md), then deep-read only the module you'll touch.

Existing knowledge to lean on (do not duplicate):
- Architecture deep-dive → [`docs/architecture/`](./docs/architecture/)
- Capability catalog (code-grounded spec) → [`docs/capabilities/`](./docs/capabilities/)
- Pages & feature coverage → [`.agents/SITEMAP.md`](./.agents/SITEMAP.md)
- Getting started / local dev / contributing → [`docs/getting-started/`](./docs/getting-started/)
- Design principles → [`docs/principles/principle.md`](./docs/principles/principle.md)

## Skills (load on demand, by task)

Indexed in [`agentic/skills/README.md`](./agentic/skills/README.md). The core flow:

- [`understand-the-repo`](./agentic/skills/understand-the-repo.md) — orient cheaply (map + memory).
- [`implement-feature`](./agentic/skills/implement-feature.md) — branch → understand → implement → test → review → commit → PR.
- [`run-tests`](./agentic/skills/run-tests.md) — Jest (backend) + Playwright (`.agents/`).
- [`code-review`](./agentic/skills/code-review.md) — self-review before commit.
- [`security-review`](./agentic/skills/security-review.md) — for auth/data/runtime/plugin changes.
- [`commit-and-pr`](./agentic/skills/commit-and-pr.md) — ECA, sign-off, PR template.
- [`deploy`](./agentic/skills/deploy.md) — `instance-setup/` Docker Compose.
- [`docs-update`](./agentic/skills/docs-update.md) — keep map/capabilities in sync with code.
- [`learn-and-update`](./agentic/skills/learn-and-update.md) — capture best practices/trends/lessons.

## Quick commands

```bash
# Backend
cd backend && npm install && npm run dev          # dev server
cd backend && npm test                             # Jest
cd backend && npm run lint && npm run prettier     # lint/format

# Frontend
cd frontend && npm install && npm run dev          # Vite on :3210
cd frontend && npm run build                       # tsc + vite build
cd frontend && npm run lint                        # ESLint --max-warnings 0

# E2E
cd .agents && npm install && npx playwright install chromium
cd .agents && npx playwright test                  # all specs

# Deploy (instance)
cd instance-setup && ./up.sh                       # docker compose up -d (needs .env.prod)
```

## Memory & learning

- Repo-resident facts: [`agentic/memory/`](./agentic/memory/) (with `MEMORY.md` index).
- Continuous learning: [`agentic/learning/`](./agentic/learning/). Propose updates via PR; never auto-apply to rules.

## Adapters

- **Claude Code:** [`CLAUDE.md`](./CLAUDE.md) `@import`s this file. See [`agentic/SETUP.md`](./agentic/SETUP.md) to enable native skill invocation.
- **opencode / openclaw / others:** you're reading the canonical entry. Point your tool at `AGENTS.md`.