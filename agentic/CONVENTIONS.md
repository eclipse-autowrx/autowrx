# Conventions

Style and structure conventions for this repo. Load always (imported by `AGENTS.md` / `CLAUDE.md`). These reflect what the codebase already does — match it.

## Branches & commits

- **Branch naming:** `<type>/<short-descriptive>` or `<type>/<issue>-<slug>`. Types: `feat`, `docs`, `fix`, `chore`, `refactor`. Examples: `feat/612-agentic-coding-framework`, `docs/capabilities-improvements`, `fix/project-editor-move-guard`.
- **Commit message:** imperative summary ≤ ~72 chars; body explains the *why*. End with `Signed-off-by:` (via `git commit -s`) and, for agent-made commits, an attribution trailer — `Co-Authored-By: Claude <noreply@anthropic.com>` when running as Claude Code, or the tool's equivalent; omit if the tool has no such convention.
- **One logical change per commit** where practical; squashing is done at PR merge, not in commits.

## PRs

- PRs target **`main`**.
- Title: `<type>(<scope>): <summary>`.
- Body: **What / Why / How verified**. Note if the change touches security, data, runtime, or plugins. Link the issue (`Closes #nnn` / `Ref #nnn`).
- The PR pipeline currently runs the **ECA check only**; CI doesn't run tests on PRs, so the agent/author must run tests locally and state how it was verified.

## Backend (`backend/`, Node.js + Express + MongoDB)

- **Layering:** routes → controllers (thin) → services (logic) → models (Mongoose). Keep controllers thin; business logic lives in `services/`. See [`docs/principles/principle.md`](../docs/principles/principle.md).
- **Routes:** versioned under `routes/v2/`. Match existing grouping (e.g. `routes/v2/user-management/`, `routes/v2/vehicle-data/`).
- **Auth:** `auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING })` pattern for public-optional reads; writes require auth; resource checks via `checkPermission` (RBAC v1, owner bypass).
- **Tests:** Jest, colocated or under a tests dir. Run `npm test`. Match existing spec style.
- **Lint/format:** `npm run lint`, `npm run prettier` (ESLint + Prettier; Husky pre-commit).

## Frontend (`frontend/`, React + Vite + TypeScript)

- **Atomic design:** `components/{atoms,molecules,organisms}`, `pages/`, `layouts/`, `stores/`, `hooks/`. Don't put page logic in atoms.
- **State:** Zustand stores under `stores/` (`authStore.ts`, …). Permissions via `hooks/usePermissionHook.ts`.
- **Routing:** `configs/routes.tsx`.
- **Build/lint:** `npm run build` (`tsc && vite build`), `npm run lint` (ESLint, `--max-warnings 0`). Dev server on port **3210**.

## E2E (`.agents/`, Playwright)

- Specs in `.agents/tests/*.spec.ts`. Run `cd .agents && npx playwright test`.
- Keep `.agents/SITEMAP.md` coverage status in sync when adding/changing a page feature.
- Env via `.agents/.env` (gitignored; see `.agents/.env.example`).

## Docs

- All docs under `docs/`; index at [`docs/README.md`](../docs/README.md).
- **Capability catalog** (`docs/capabilities/`) is **code-grounded**: every endpoint/status/flag claim must match the code. Format per [`docs/capabilities/README.md`](../docs/capabilities/README.md).
- When code structure changes, update `agentic/map/` pointers and (if a capability changed) `docs/capabilities/`.

## Agent config (this framework)

- Canonical content in `agentic/`. Tool-specific adapters (e.g. `CLAUDE.md`) stay thin and import canonical files via `@path` (e.g. `@AGENTS.md`) — don't duplicate rules into adapters.
- Memory: one fact per file under `agentic/memory/` + a one-line index entry in `MEMORY.md`.
- Skills: one procedure per file; each has *When to use · Steps · Guardrails · Exit criteria*. Keep them concise.

## License (Eclipse / MIT)

- Repo license: **MIT**, copyright Eclipse Foundation. Every new `.js`/`.ts`/`.tsx` source file **must** start with the Eclipse/MIT header (`SPDX-License-Identifier: MIT`) — see [`skills/license-check.md`](./skills/license-check.md) for the exact block. `.sh`/`.yml`/`.md` files do not carry it (repo convention).
- Don't remove or alter existing `Copyright`/`SPDX-License-Identifier` headers.
- Don't introduce copyleft (GPL/AGPL/CDDL) or proprietary third-party code — MIT can't combine with it. Vendored code must be MIT-compatible and keep its original notice.
- CI: `scripts/check-license-headers.sh` + `.github/workflows/license-headers-check.yml` check changed source files for the header.