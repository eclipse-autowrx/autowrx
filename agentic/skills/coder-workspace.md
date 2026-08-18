# Skill: coder-workspace
> Debug or extend the Coder (VS Code in browser) integration: workspaces, templates, and the backend↔Coder link.

## When to use
- A change to the Coder integration: workspace templates, the runner image, entrypoint, or the backend↔Coder wiring.
- A workspace won't start, can't see the prototypes tree, or the Coder tab in the app is broken.
- You need to add/adjust a Terraform template (docker / k8s / AKS).

## Steps
1. **Locate the moving parts.**
   - `instance-setup/coder/` — `autowrx-runner` (runner image), `coder-docker-compose.yml` (Coder control plane on `:7080`), `coder-entrypoint.sh` (workspace entrypoint), `terraform-provider-mirror`.
   - `plans/` — Terraform templates: `docker-template.tf`, `docker-template.zip`, `k8s-template.tf`; `setup_coder_aks.sh`, `prepare-templates.sh`, `integration-plan.md`, `guide.md`, `cursor_webapp_and_coder_workspace_integ.md`.
   - Backend side: the app reaches Coder at `host.docker.internal:7080` via the `CODER_URL` site config (set in the admin panel / DB siteconfig).
2. **Understand the lifecycle.** Template (uploaded to Coder) → Workspace (created from template by a user) → workspace container bind-mounts the prototypes path so the editor sees the same tree the backend serves. The backend only talks to Coder's API; it does not manage workspace containers directly.
3. **Reproduce the symptom.**
   - Coder control plane down? `docker compose -f instance-setup/coder/coder-docker-compose.yml ps` and open `http://localhost:7080`.
   - Workspace won't create? Check Coder dashboard logs and the template's Terraform (`plans/*.tf`).
   - Workspace opens but prototypes tree is empty/wrong → the workspace bind-mount and the backend bind-mount **must be the same `${PROTOTYPES_PATH}`** (commits d6807b4, 6bd6ccb). Compare `docker compose -f docker-compose.prod.yml config | grep -A3 prototypes` with the workspace template's mount block.
   - App's Coder tab / actions fail → backend can't reach Coder: confirm `extra_hosts: ["host.docker.internal:host-gateway"]` on the `autowrx` service and that `CODER_URL` siteconfig points at `http://host.docker.internal:7080`. See `troubleshoot-deploy.md`.
4. **Make the change.** Edit the template/runner/entrypoint. If changing a Terraform template, re-zip with `prepare-templates.sh` (or `zip docker-template.zip docker-template.tf`) and re-upload via the Coder dashboard (Templates → Create → Upload). If changing the runner image, rebuild it.
5. **Test workspace create + teardown.** Create a workspace from the updated template, confirm the editor loads and the prototypes tree matches the backend's view, then delete the workspace. Don't leave orphaned workspaces.
6. **Update docs.** If the wiring or a template changed, update `plans/guide.md` / `plans/integration-plan.md` and `docs/` pointers (see `docs-update.md`).

## Guardrails
- Don't restart the `autowrx` (app) service for a Coder-only change if the backend is healthy — touch only the Coder control plane / templates / workspaces.
- Keep the prototypes bind-mount identical between Coder workspaces and the `autowrx` backend; divergence silently breaks the tree view.
- Never commit secrets (Coder admin password, tokens). `.env*` is gitignored.
- Test workspace create **and** teardown — a broken teardown leaks containers/volumes.
- Terraform template edits must be re-zipped and re-uploaded to Coder; an unzipped `.tf` alone does nothing.

## Exit criteria
- Workspace starts from the updated template, sees the correct prototypes tree, and tears down cleanly.
- Backend↔Coder link verified (Coder tab/actions work). Docs updated if wiring changed.

## Cross-links
- `deploy.md`, `troubleshoot-deploy.md`, `docs-update.md`.