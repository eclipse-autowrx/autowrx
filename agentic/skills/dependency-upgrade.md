# Skill: dependency-upgrade
> Safely upgrade an npm dependency in `backend/` or `frontend/` and verify it without breaking tests, license, or lint.

## When to use
- A Dependabot alert or `npm audit` flags a vulnerability to fix.
- A dep is blocking a Node/React/Vite feature or has a required security patch.
- A maintainer explicitly asks to bump a dep.

## Steps

### 1. Identify the target
- Get the alert: `cd backend && npm audit` (and `cd frontend && npm audit`), or open the Dependabot alert. Note the CVE/advisory ID and severity.
- Determine the **right** `package.json` — `backend/` and `frontend/` have separate manifests. Don't edit the wrong one.
- Check current vs target version and read the dependency's changelog/CHANGELOG for breaking changes between them. Note whether it's a patch/minor/major bump.

### 2. Upgrade
- Prefer the smallest bump that resolves the issue. For a major bump, check the migration guide and decide whether it belongs in its own PR.
- Edit the correct `package.json` (or use `npm install <pkg>@<version>`), then `npm install` to refresh the lockfile.
- Check **transitive** deps: if the vulnerable package is a sub-dependency, use `npm ls <pkg>` to find the parent and upgrade the parent, not the leaf.

### 3. Verify
- **Backend:** `cd backend && npm test` (Jest; start `autowrx-mongo-test` if a spec needs Mongo — see `run-tests`). Then `npm run lint && npm run prettier`.
- **Frontend:** `cd frontend && npm run tsc && npm run lint && npm run build` (tsc && vite build; ESLint `--max-warnings 0`). Inspect `rollup-plugin-visualizer` output if the dep affects bundle size.
- **E2E (if the dep affects runtime or UI):** `cd .agents && npx playwright test` for the affected flows.
- If tests can't be run (no DB/browser/env), say so explicitly and report what you did run (RULES.md).

### 4. License check
- Run the `license-check` skill for the new/changed dependency's license. Repo is **MIT** (Eclipse Foundation) — only MIT-compatible licenses allowed (MIT/ISC/Apache-2.0/BSD). Copyleft (GPL/AGPL/CDDL) or proprietary is **blocking**.
- Check transitive deps' licenses too if a major bump pulled in new sub-deps.

### 5. Commit & PR (only when asked)
- One dep per commit/PR when the bump is major or touches shared APIs; patch/minor bumps may be batched if low-risk.
- Branch off `main` (never commit on `main`), `git commit -s` with your ECA-signed identity, add the `Co-Authored-By` trailer for agent-made commits.
- PR targets `main`. Title: `chore(deps): bump <pkg> from X to Y` (or `fix(deps): ...` for a CVE). Body: **What / Why** (CVE ID + advisory link) / **How verified** (exact test + lint commands run) / note if it touches security or runtime. See `commit-and-pr`.

## Guardrails
- Don't `npm audit --fix --force` for major bumps blindly — it can break the app. Review each major upgrade individually.
- Never introduce copyleft or proprietary code (GPL/AGPL/CDDL/proprietary) — blocking; MIT can't combine with it.
- Don't upgrade a dep and skip verification because "it's just a patch" — still run the relevant suite + lint.
- Don't edit `package.json` in the wrong workspace (backend vs frontend).
- Don't commit lockfile drift unrelated to the upgrade.
- PR CI runs the **ECA check only** (no test CI on PRs) — local verification is mandatory and must be stated in the PR body.

## Exit criteria
- The dep is bumped in the correct manifest, lockfile updated, and the affected suites (backend Jest / frontend build+lint / Playwright if relevant) are green with commands cited.
- License verified MIT-compatible (transitive too for majors).
- CVE/advisory resolved (re-run `npm audit` to confirm) — or the unresolved remainder documented.
- Cross-link: `license-check`, `run-tests`, `commit-and-pr`.