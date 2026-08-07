# Gotchas

Repo-specific traps and known gaps. Verify before acting; if a gap is closed, move it to `verified-facts.md` or delete it.

- **Login is unthrottled.** `authLimiter` is defined and exported in `backend/src/middlewares/rateLimiter.js` but is **not** applied to any route (grep finds only the definition + export, no import sites). Treat login/credential endpoints as unprotected against brute force until this is wired in.
- **PR CI runs the ECA check only.** `.github/workflows/` has no test job on PRs — `build-docker.yml` and `deploy-dev-stage.yml` run on push/merge paths, not PR open. Agents/authors must run `npm test` (backend) and Playwright (`.agents/`) locally and state how it was verified in the PR body.
- **Plugins execute unsandboxed in the browser.** Plugin code runs with page-level privileges, not in an iframe/Web Worker sandbox. Treat plugin input as trusted-but-audited, not untrusted.
- **`.env*` is gitignored but easy to leak.** Don't paste values into PRs, logs, or commit messages. `.agents/.env` and `instance-setup/.env.prod` are both gitignored.
- **`down.sh` is destructive on prod.** It tears down the Compose stack; never run it against a production instance without explicit confirmation (see `RULES.md`).