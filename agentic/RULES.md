# Rules (must / must-not)

Hard rules for any agent working in this repo. Load always (imported by `AGENTS.md` / `CLAUDE.md`). Violating these is a defect, not a style choice.

## Git & contributions

- **ECA is mandatory.** Every commit author must have signed the [Eclipse Contributor Agreement](https://www.eclipse.org/legal/eca/) and commit with that email. For this repo: `NhanLuongBGSV` / `nhan.luongnguyen@vn.bosch.com`. Do **not** use any other identity.
- **Sign off commits:** `git commit -s` (adds `Signed-off-by:`).
- **Never commit on `main`.** Branch off `main` first; PRs target `main`.
- **Never force-push to shared branches.** Rebase your own feature branch only.
- **Never commit secrets** (`.env`, `.env.prod`, tokens, keys, cookies). They are gitignored; keep them out.
- **Co-author / attribution:** when an agent makes commits, end the message with `Co-Authored-By: Claude <noreply@anthropic.com>` (or the tool's equivalent). See `commit-and-pr` skill.

## Code changes

- **Do not push or deploy unless explicitly asked.** Commit only when asked; push/PR only when asked; deploy only when asked. Each is a separate authorization.
- **Never mark a task complete if tests fail or work is partial.** Report failures honestly with output.
- **Before deleting/overwriting a file, look at it.** If it contradicts how it was described or you didn't create it, surface that instead of proceeding.
- **Match surrounding code:** naming, comment density, idioms. No drive-by reformatting outside the change's scope.
- **Backend:** thin controllers, logic in services (see [`docs/principles/principle.md`](../docs/principles/principle.md)).
- **Frontend:** atomic design (components/molecules/organisms/pages). Do not bypass the existing layering.

## Verification

- **Run tests before declaring done:** `backend: npm test` (Jest) and/or `cd .agents && npx playwright test` for affected flows. If you can't run them, say so.
- **Lint where it exists:** `backend: npm run lint && npm run prettier`; `frontend: npm run lint`. Fix your own lint errors; don't disable rules silently.
- **Self-review your diff before commit** (see `code-review` skill). Security-sensitive changes (auth, tokens, file ops, runtime, plugins) also run `security-review`.

## Agent context discipline (token efficiency)

- **Load the map + memory first,** not the whole repo. Use the `understand-the-repo` skill.
- **Deep-read only the module you're touching.** Don't dump files into context you won't use.
- **Skills are load-on-demand.** Don't preload all skills; load the one matching the task.
- **When you learn a durable fact, write it to `agentic/memory/` or `agentic/learning/`** (propose via PR) so the next session doesn't re-learn it.

## Must-not

- Don't fabricate endpoints, statuses, flags, or file paths. If unsure, read the code.
- Don't edit `docs/capabilities/*` technical claims without verifying against the route/controller code (the catalog is code-grounded).
- Don't change the ECA/git identity rules.
- Don't run destructive commands (`rm -rf`, `git reset --hard` on shared refs, `down.sh` on a prod env) without explicit confirmation.