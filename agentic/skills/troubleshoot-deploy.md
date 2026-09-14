# Skill: troubleshoot-deploy
> Diagnose and fix an AutoWRX instance that won't come up or behave (the unhappy path; `deploy.md` is the happy path).

## When to use
- `./up.sh` ran but containers are unhealthy, the app won't load, or a feature (prototypes, Coder) is broken.
- A user reports the instance is down or misbehaving after a deploy/change.
- Not for a clean first-time deploy — use `deploy.md`. Not for Coder-only issues unless the backend can't reach Coder.

## Steps
1. **Get the symptom precisely.** Which container, which URL, which page? "App won't load" vs "container exits" vs "empty workspace tree" vs "Coder tab blank" each branch differently.
2. **Inspect container state.**
   ```bash
   cd instance-setup
   docker compose -f docker-compose.prod.yml ps
   docker logs autowrx --tail 100
   docker logs autowrx-db --tail 100
   ```
   Map symptom → cause:
   - **Container fails to start / exits** → read `docker logs <service>`; most often `.env.prod` syntax or a missing required key.
   - **App won't load / 500 / CORS error** → `.env.prod` syntax (no spaces around `=`), or a missing/empty `JWT_SECRET`, `CORS_ORIGINS`, `ADMIN_EMAILS`, `ADMIN_PASSWORD`, `FRONTEND_PORT`, `NAME`. Compare against `.env.prod.sample`.
   - **Port conflict / address in use** → `lsof -i :${FRONTEND_PORT}`; free the port or change `FRONTEND_PORT` and restart.
   - **Empty `/workspace-tree` or Coder can't see prototypes** → the backend is missing the prototypes bind-mount. `docker compose -f docker-compose.prod.yml config | grep -A3 prototypes` must show `${PROTOTYPES_PATH}:${PROTOTYPES_PATH}` on the `autowrx` service (commit d6807b4). The Coder workspace must mount the **same** path.
   - **Backend can't reach Coder (`CODER_URL` errors, workspace actions 404/connection refused)** → the `autowrx` service needs `extra_hosts: ["host.docker.internal:host-gateway"]` so `CODER_URL` (e.g. `http://host.docker.internal:7080`) resolves. Verify the siteconfig `CODER_URL` is set in the admin panel.
   - **Mongo not ready / ECONNREFUSED on boot** → `autowrx-db` healthcheck hasn't passed; wait 15–30s or `docker compose ... restart autowrx-db` then `autowrx`.
3. **Apply the minimal fix.** Prefer editing `instance-setup/.env.prod` (user-owned, gitignored) or the compose file; never hardcode secrets. Recreate affected containers: `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d <service>`.
4. **Re-verify health.** `docker compose ps` shows running/healthy; app responds at `http://<host>:${FRONTEND_PORT}`; the previously-broken feature works. Tail logs to confirm no new errors.
5. **Record the incident.** If a non-trivial fix (bind-mount, extra_hosts), note it in `agentic/learning/lessons.md` so the next deploy doesn't regress.

## Guardrails
- Never run `down.sh` against a prod env without explicit confirmation (`RULES.md`). Prefer `restart` or recreating a single service.
- Never create, edit-commit, or print `.env.prod` secret values. Edit the file only to fix syntax/keys; don't paste values into logs, PRs, or chat.
- Don't restart the `autowrx` service for a Coder-only change if the backend is healthy — see `coder-workspace.md`.
- Don't claim fixed without re-running the failing request and watching logs.

## Exit criteria
- Root cause identified and the previously-failing action works, with the relevant log lines cited.
- No secrets exposed. Any compose/env fix is documented (commit or `lessons.md`), not left as silent local edits.

## Cross-links
- `deploy.md` (happy path), `debug.md`, `coder-workspace.md`, `security-review.md` (if a secret was logged during the incident).