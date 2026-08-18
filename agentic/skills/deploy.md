# Skill: deploy
> Stand up (or restart) a local/instance AutoWRX deployment via Docker Compose.

## When to use
- When the user explicitly asks to deploy, restart, or bring up the instance.
- After a change that must be verified on a running stack (when local dev isn't enough).
- When asked to stop the instance (use `down.sh`).

## Steps
1. **Confirm the target env.** Ask if unclear. Default target is a local/instance env via `instance-setup/`. **Never** treat an env as prod without explicit confirmation from the user. Note that the staging/prod deploy workflows (`.github/workflows/deploy-dev-stage.yml`'s staging/prod stages) are `.disabled` — there is currently no active CD pipeline.
2. **Ensure `.env.prod` exists.** It is gitignored and required by `up.sh`. Check for `instance-setup/.env.prod`:
   - If missing, do **not** create or commit secrets. Ask the user to copy `.env.prod.sample` and fill it in (`cp .env.prod.sample .env.prod`). Required keys include `JWT_SECRET`, `CORS_ORIGINS`, `ADMIN_EMAILS`, `ADMIN_PASSWORD`, `FRONTEND_PORT`, `NAME` (see `instance-setup-guide.md`).
   - If present, proceed.
3. **Bring the stack up.** From `instance-setup/`:
   ```bash
   cd instance-setup && ./up.sh
   # equivalent to: docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```
   Services: `autowrx`, `autowrx-db`, `autowrx-dbdata`, `autowrx-network`. First build takes 5–10 min. To override builtin widgets from the host, add `-f docker-compose.widgets.yml` (see `instance-setup-guide.md`).
4. **Verify health.**
   ```bash
   docker compose -f instance-setup/docker-compose.prod.yml ps
   docker logs autowrx --tail 50
   ```
   Confirm the app responds at `http://<host>:${FRONTEND_PORT}`. If containers fail, check `.env.prod` syntax (no spaces around `=`), port conflicts (`lsof -i :${FRONTEND_PORT}`), and `docker compose ... logs autowrx-db` for Mongo readiness.
5. **To stop** (only when asked): `cd instance-setup && ./down.sh`.
6. **Coder / VS Code workspaces.** If the task involves the Coder integration, the workspaces live under `instance-setup/coder/` with plan files under `plans/` — handle those separately from the core stack and don't restart the `autowrx` service for a Coder-only change.

## Guardrails
- Deploy ONLY when explicitly asked — separate authorization from commit/push (see `RULES.md`).
- Never run `down.sh` against a prod env without explicit confirmation.
- Never create, edit, or commit `.env.prod` or any secret. They are gitignored on purpose.
- Don't push images or trigger remote deploy workflows; the active CI (`.github/workflows/build-docker.yml`) builds only — staging/prod stages are disabled.
- Backend `npm run docker:prod` and pm2 (`npm start`) are alternative local runners; prefer `instance-setup/up.sh` for an instance deploy unless the user asked for a specific runner.

## Exit criteria
- Services up and healthy (`docker compose ps` shows them running; app responds on `${FRONTEND_PORT}`), **or** a failure reported honestly with the relevant logs and the likely cause.
- No secrets committed or printed.