# Skill: implement-feature
> The canonical flow tying the other skills together: scope → branch → understand → implement → test → review → commit → PR.

## When to use
- When asked to implement a feature, fix, or refactor that will land as one or more commits.
- When the task spans code in `backend/`, `frontend/`, and/or `.agents/`.

## Steps
1. **Confirm scope.** Restate what's being built/changed and where it lives. If unclear, ask before coding. Note whether it touches security-sensitive areas (auth, tokens, file ops, runtime, plugins) — those need `security-review`.
2. **Branch off `main`.** Never commit on `main`. Branch naming per `CONVENTIONS.md`: `<type>/<issue>-<slug>` or `<type>/<short-descriptive>` (types: `feat`, `fix`, `refactor`, `docs`, `chore`).
   ```bash
   git switch main && git pull --ff-only && git switch -c feat/<issue>-<slug>
   ```
3. **Orient.** Run [`./understand-the-repo.md`](./understand-the-repo.md) — load `agentic/map/INDEX.md` + `agentic/memory/MEMORY.md`, deep-read only the module you'll touch.
4. **Implement per `CONVENTIONS.md`.**
   - Backend: thin `controllers/` → logic in `services/` → Mongoose `models/`. Versioned routes under `routes/v2/`. Match existing auth pattern (`auth({ optional: ... })`, `checkPermission`).
   - Frontend: atomic design (`components/{atoms,molecules,organisms}`, `pages/`, `layouts/`, `stores/`, `hooks/`). State in Zustand `stores/`; permissions via `hooks/usePermissionHook.ts`; routes in `configs/routes.tsx`. Don't put page logic in atoms.
   - Match surrounding style; no drive-by reformatting outside the change's scope.
5. **Run tests.** Run [`./run-tests.md`](./run-tests.md) — backend Jest for affected code, Playwright for affected flows. Don't declare done if tests fail.
6. **Self-review.** Run [`./code-review.md`](./code-review.md) on your diff. If the change touches auth/data/runtime/plugins, also run [`./security-review.md`](./security-review.md). If it adds/modifies `.js`/`.ts`/`.tsx` or dependencies, also run [`./license-check.md`](./license-check.md).
7. **Keep docs in sync.** If code structure or a capability changed, run [`./docs-update.md`](./docs-update.md) (update `agentic/map/`, `docs/capabilities/`, `.agents/SITEMAP.md` as needed).
8. **Commit & PR (only when asked).** Run [`./commit-and-pr.md`](./commit-and-pr.md): `git commit -s` with your own ECA-signed identity, PR targets `main`, body = **What / Why / How verified**. CI runs only the ECA check, so state explicitly how tests were verified locally.

## Guardrails
- Do not push, PR, or deploy unless explicitly asked — each is a separate authorization.
- Never commit on `main`. Never commit secrets (`.env*`, tokens, keys).
- Never mark the task complete if tests fail or work is partial — report honestly.
- Don't fabricate endpoints/flags/paths — verify against code.

## Exit criteria
- Code implemented, lint + tests green (or honestly reported as unrun).
- Self-review (+ security-review where applicable) done.
- Docs/map/capabilities updated if structure changed.
- PR opened (when authorized) with What/Why/How-verified and the issue linked (`Closes #nnn`).