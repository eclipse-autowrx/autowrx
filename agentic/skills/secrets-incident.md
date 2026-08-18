# Skill: secrets-incident
> Respond when a secret may have leaked (committed, logged, or otherwise exposed). Rotation is the primary response.

## When to use
- A secret was committed, pushed, pasted into a PR/issue/chat, printed in logs, or otherwise exposed.
- A container image, artifact, or terminal transcript containing a secret was published.
- You suspect exposure but aren't sure (e.g. a `.env` line appeared in a diff).

## Steps
1. **Identify the secret.** Which value, from which source? Known sensitive items in this repo:
   - `JWT_SECRET` (`.env.prod`) — signs all access/refresh tokens.
   - `ADMIN_PASSWORD` / `ADMIN_EMAILS` (`.env.prod`) — bootstrap admin login.
   - SSO `clientSecret` (SSO provider config / siteconfig).
   - `CORS_ORIGINS` is not secret but mis-disclosure can matter.
   - Any `.env*` contents: `instance-setup/.env.prod`, `.agents/.env` (gitignored).
   - Coder admin password / tokens; third-party API keys.
2. **Assess blast radius.**
   - `JWT_SECRET` leaked → **all sessions/tokens are forgeable**. Rotate → all existing access and refresh tokens immediately invalid; every user is logged out. The `Token` collection stores refresh tokens server-side with **no TTL**, so rotation is what enforces revocation.
   - `ADMIN_PASSWORD` leaked → admin login compromised until rotated (changes the admin login only).
   - SSO `clientSecret` leaked → an attacker can impersonate the app to the IdP; rotate at the IdP.
   - Full `.env.prod` leaked → treat every contained secret as compromised; rotate each.
3. **Rotate at the source (primary response).** Assume a leaked secret is compromised **forever** — do not rely on history scrubbing alone.
   - `JWT_SECRET`: generate new (`openssl rand -base64 32`), update `instance-setup/.env.prod`, recreate the `autowrx` service (`docker compose -f docker-compose.prod.yml --env-file .env.prod up -d autowrx`). Confirm all users must re-authenticate.
   - `ADMIN_PASSWORD`: change in `.env.prod` and recreate `autowrx`; or change via the admin panel (updates the admin user).
   - SSO `clientSecret`: rotate at the IdP, update siteconfig, restart `autowrx`.
   - Never commit the new secret. Never paste the new value into chat/PRs.
4. **Scrub exposure.**
   - **Logs/CI/PRs:** scan for the literal value (`grep -r "<value>" .agents/ .github/ docs/` and any log stores). Redact or delete where found.
   - **Git history:** coordinate before any rewrite. `git filter-repo` + force-push is disruptive (rewrites SHAs, breaks contributor branches, can re-open on rebase). Often **rotate + force-push with maintainer sign-off** is the pragmatic choice; a full history rewrite is not automatic. Get explicit confirmation first (`RULES.md`: no force-push to shared branches without authorization; no destructive commands without confirmation).
   - **Published images/artifacts:** if a secret reached a pushed Docker image or release artifact, rotate regardless — you cannot reliably recall images.
5. **Verify rotation.** Confirm the new secret is in effect (app boots, tokens issued after rotation validate, old tokens rejected), and that the old value no longer appears in the live config or recent logs.
6. **File an incident note.** Append a short entry to `agentic/learning/lessons.md`: what leaked, how, blast radius, rotation steps taken, scrub action, and a prevention item. Do **not** record any secret value — reference it by name only.
7. **Prevention.** Propose a guard if useful (e.g. a pre-commit hook for `.env*`, a CI grep for known secret patterns, redaction in logging). Open a follow-up issue/PR — don't fold unrelated changes into the incident response.

## Guardrails
- Rotation is the primary response; history scrubbing is secondary and optional. Never treat "removed from the current diff" as sufficient.
- Never commit the new secret (`.env*` is gitignored — keep it that way).
- Never paste secret **values** into chat, PR descriptions, commit messages, or `lessons.md`; refer by name only.
- Get explicit confirmation before any `git filter-repo` / force-push / history rewrite. Never force-push to `main` or other shared branches without maintainer sign-off.
- Don't expand scope mid-incident: rotate, scrub, record. Prevention work is a separate change.
- If the leak is a third-party secret (IdP, cloud key), rotate at that provider — updating only the local env does not invalidate the old key.

## Exit criteria
- Every compromised secret rotated at the source and confirmed live; old values no longer functional.
- Exposure scrubbed from logs/PRs; git history action decided and (if chosen) executed with sign-off.
- Incident note in `agentic/learning/lessons.md` (no secret values). Prevention follow-up filed.

## Cross-links
- `security-review.md`, `commit-and-pr.md`, `debug.md`, `troubleshoot-deploy.md` (if rotation required recreating the stack).