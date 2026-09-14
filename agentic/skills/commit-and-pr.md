# Skill: Commit & PR
> Stage, sign off, push, and open a PR against `main` for the finished change.

## When to use
When the work is verified (tests pass per `./run-tests.md`, self-reviewed per `./code-review.md`, and security-sensitive changes cleared per `./security-review.md`) and the user has asked to commit and/or push and/or open a PR. Each of commit / push / PR is a **separate authorization** — do none unless asked (see `RULES.md`).

## Steps
1. **Verify identity first.** `git config user.name` / `git config user.email` must read **your own** ECA-signed identity — the email you signed the ECA with. Each contributor uses their own account; there is no repo-wide identity. Ensure `user.email` matches your ECA sign-up email, or the `eclipsefdn/eca` check will fail.
2. **Confirm you're not on `main`.** `git branch --show-current` — if it's `main`, branch off first: `git switch -c <type>/<slug>` (types: `feat`, `docs`, `fix`, `chore`, `refactor`; see `CONVENTIONS.md`). Branch naming: `<type>/<issue>-<slug>` or `<type>/<slug>`.
3. **Stage only intended files.** `git add <explicit paths>`. Never `git add -A`/`.` blindly. **Never stage `.env*`**, tokens, keys, or cookies — confirm via `git diff --cached --name-only` before committing. If a secret slipped in, unstage it; if already committed, that's a separate incident (rotate the secret).
4. **Commit with sign-off + attribution.** `git commit -s -m "<imperative summary ≤~72 chars>" -m "<body explaining *why*>..."` and an attribution trailer when the tool uses one — Claude Code: `-m "Co-Authored-By: Claude <noreply@anthropic.com>"`; other tools: their equivalent, or omit. The `-s` adds the `Signed-off-by:` line required by the Eclipse ECA. One logical change per commit where practical.
5. **Re-read the commit before pushing.** `git show --stat HEAD` and skim the message. Confirm summary is imperative, body explains the why, sign-off + co-author trailers are present, and the staged file list matches intent.
6. **Push the branch** (only if asked). `git push -u origin <branch>`. Never force-push shared refs; force-push only your own unshared feature branch and only when necessary.
7. **Open the PR against `main`** (only if asked) via `gh pr create --base main`. Title: `<type>(<scope>): <summary>`. Body sections:
   - **What:** what changed (1-3 lines).
   - **Why:** the motivation / issue context.
   - **How verified:** the exact commands you ran (`backend: npm test`, `cd .agents && npx playwright test ...`, `npm run lint`, manual steps) — the PR pipeline runs the **ECA check only**, so CI won't run tests; state how you verified it. If security-sensitive, note `./security-review.md` result.
   - Issue link: `Closes #nnn` or `Ref #nnn`.
8. **Note the ECA requirement** in the PR body or comment if the author/committers might not be signed: every commit author must have signed the ECA (https://accounts.eclipse.org/) with the commit email, or the ECA check fails. Don't commit under an unsigned identity.
9. **Return the PR URL** to the caller. If you only committed (no PR asked), return the short SHA + branch name.

## Guardrails
- **Commit only when asked; push only when asked; PR only when asked.** Each is separate (RULES.md).
- **Never commit on `main`.** Never force-push `main` or any shared branch.
- **Never commit secrets** (`.env*`, tokens, keys, cookies) — they're gitignored; keep them out.
- Don't rebase/rewrite history that's already pushed to a shared branch.
- If pre-commit hooks (Husky) fail on lint/format, fix your own errors; don't disable rules or `--no-verify` past them silently.
- Don't bundle unrelated changes into one PR to ship faster — split per `CONVENTIONS.md`.

## Exit criteria
- PR opened against `main`: return the **PR URL** and confirm ECA check is required/pending. Or, if only a commit was authorized: return the **SHA + branch** and state that push/PR still needs explicit ask. Verify `git log -1 --format='%an <%ae>%n%(trailers:key=Signed-off-by)'` shows the correct identity and a `Signed-off-by:` trailer (and the tool's attribution trailer if you added one).