# Coder integration flow

Runtime behavior for the VS Code tab, Coder workspace APIs, and the dashboard **Run** action. Configuration comes from **site config in MongoDB** (keys below), not from `.env` — see `backend/src/utils/coderConfig.js`.

## Actors

- **User** — opens a prototype and uses the VS Code tab or Run while that tab is active.
- **Frontend** — `PrototypeTabVSCode`, `DaRuntimeControl`, `coder.service.ts`; stores last-known workspace state in `coderWorkspaceStore` (Zustand) to resume faster when switching tabs.
- **Backend** — `coder.controller.js`, `orchestrator.service.js`, `coder.service.js`; enforces `VSCODE_ENABLE`, `READ_MODEL`, and calls Coder’s HTTP API (`/api/v2`).
- **MongoDB** — users (e.g. `coder_username`, `coder_workspace_id`), prototypes, models.
- **Host filesystem** — `PROTOTYPES_PATH/{userId}/{prototypeFolder}`; seeded when empty; same tree is bind-mounted into the workspace (container path under `/home/coder/prototypes/...`).
- **Coder** — template `docker-template`, one workspace per AutoWRX user (reused across prototypes), app slug `code-server`.
- **Workspace container** — code-server + **autowrx-runner** extension (watches `.autowrx_run` for Run-from-dashboard).

## HTTP API (authenticated)

Base path (with default frontend client): **`/v2/system/coder`** (see `backend/src/routes/v2/system/coder.route.js`).

| Method | Path | Role |
|--------|------|------|
| `POST` | `/workspace/:prototypeId/prepare` | Idempotent prepare: ensure Coder user, host folder + seed, workspace, start if needed, resolve `appUrl` / token when possible. |
| `GET` | `/workspace/:prototypeId` | Same orchestration as prepare (full `prepareWorkspaceForPrototype`); used to refresh **app URL + session token** for the iframe. |
| `GET` | `/workspace/:prototypeId/status` | Workspace build status for the current user’s Coder workspace. |
| `GET` | `/workspace/:prototypeId/logs` | Agent logs; supports `after`, `before`, `format=json\|text`, etc. |
| `GET` | `/workspace/:prototypeId/timings` | Build timing details. |
| `POST` | `/workspace/:prototypeId/trigger-run` | Body: `{ runKind }`. Writes `.autowrx_run` on the host prototype folder (see Run phase). |
| `GET` | `/workspace/:prototypeId/run-output` | Returns `{ content, mtimeMs }` for `.autowrx_out` (allowlisted runs use `tee`). Used by the dashboard Output panel on the VS Code tab (~700ms polling). |
| `GET` | `/workspaceagents/:workspaceAgentId/logs` | Stricter agent log access (validates agent id vs user workspace). |

All of the above require auth and **VSCode integration enabled**; prototype routes also require **READ_MODEL** on the prototype’s model.

## Phase 1 — Open VS Code tab

1. **User → Frontend** — Opens prototype detail and selects the VS Code tab (tab is shown when `VSCODE_ENABLE` is on — see site config).
2. **Frontend** — Checks **READ_MODEL** before calling Coder APIs.
3. **Cache (optional)** — If `coderWorkspaceStore` already has this prototype in a “ready” state (workspace **running** and logs previously showed **`Setup complete.`**), the UI hydrates from cache, then calls **`GET /workspace/:prototypeId`** to refresh URL/token, and starts **idle** polling only (see Phase 4).
4. **Cold path** — **`POST .../prepare`**; on **409** from prepare, the client continues into polling (see `PrototypeTabVSCode.tsx`).

## Phase 2 — Config and authorization (backend)

On each relevant request the backend:

1. Loads Coder settings from site config: **`VSCODE_ENABLE`**, **`CODER_URL`**, **`CODER_ADMIN_API_KEY`**, **`PROTOTYPES_PATH`** (cached ~10s, refresh on demand).
2. If disabled → **403** (`VSCode integration is disabled`).
3. Loads prototype; checks **READ_MODEL** for `prototype.model_id` → **403** if denied.

## Phase 3 — Prepare / get workspace (orchestration)

Rough order inside `prepareWorkspaceForPrototype` (shared by **prepare** and **GET workspace**):

1. **Coder user** — ensure/find user; persist `coder_username` on first use.
2. **Tokens** — user-scoped (and workspace-scoped after a workspace exists) Coder API tokens; admin key is used only inside server-side helpers.
3. **Host folder** — `PROTOTYPES_PATH/{userId}/{sanitizedPrototypeFolder}`; create if needed; **seed** from prototype if directory is empty.
4. **Template** — resolve template id for **`docker-template`**; create workspace with rich parameter **`prototypes_host_path`** (must align with `PROTOTYPES_PATH`).
5. **One workspace per user** — reuse `user.coder_workspace_id` when valid; otherwise create and save id on the user document.
6. **Start** — start workspace if not **running**; resolve **code-server** `appUrl` when available (may still be pending right after start).
7. **Response fields** — `workspaceId`, `workspaceName`, `status`, `appUrl`, `sessionToken`, `repoUrl` (currently unused / null in this flow), **`folderPath`** (container path to open, e.g. under `/home/coder/prototypes/...`).

Git clone integration in the template is **disabled**; prototypes are **folder-mounted**, not cloned from a remote in this path.

## Phase 4 — Readiness polling (frontend)

Implemented in **`PrototypeTabVSCode.tsx`**:

- **Fast poll** — about **1 second** between ticks until ready.
- **Idle poll** — after ready, about **5 seconds** for status/logs (and token refresh policy).
- Each tick: **`GET .../status`**, then **`GET .../logs?after={lastLogId}&format=json`** (incremental logs).
- **Ready for iframe** when workspace **status is `running`** **and** at least one log line contains **`Setup complete.`**
- When ready, **`GET .../workspace/:prototypeId`** runs so **session token and app URL** match the server (avoids stale query-param auth). While the iframe is shown, the client refreshes credentials on a **~10 minute** cadence (and when retrying after a failed refresh).
- **Tab inactive** — polling intervals are cleared; state remains in **`coderWorkspaceStore`** for quicker return.
- **Failures** — `failed` / `canceled` / missing workspace (**404** while polling) surface as errors in the status UI.

## Phase 5 — Embedded editor

1. Build iframe URL from `appUrl` + query params: **`folder`**, **`token`**, **`coder_session_token`** (when `sessionToken` is present) — embedding avoids relying on browser cookies inside the iframe.
2. Browser loads **code-server** inside the iframe; workspace folder is the mounted prototype directory.

## Phase 6 — Run from dashboard (VS Code tab only)

When the prototype **VS Code** tab is active and the user clicks **Run** in the runtime sidebar:

1. **Frontend** — `POST .../trigger-run` with **`runKind`**: **`python-main`** or **`c-main`** (from prototype language).
2. **Backend** — maps `runKind` to a **fixed** shell command (`RUN_KIND_COMMANDS` in `orchestrator.service.js`); writes **`.autowrx_run`** with that command into the prototype folder on the host (same path visible in the container). Commands use **`tee .autowrx_out`** so combined stdout/stderr are mirrored to the terminal and captured in **`.autowrx_out`** for tooling to read.
3. **Extension** — **autowrx-runner** watches `.autowrx_run`, reads the command, opens/focuses terminal **AutoWRX Console**, runs the command, then clears the file.

Raw shell commands are **never** accepted from the client — only the allowlisted `runKind` values.

## Diagrams

- VS Code tab sequence (Mermaid): [`coder-flow-diagram.md`](./coder-flow-diagram.md)
- Run / trigger sequence: [`coder-trigger-run-sequence.md`](./coder-trigger-run-sequence.md)
- Older bitmap (may be stale): [`coder-flow-diagram.png`](./coder-flow-diagram.png)

## Code pointers

- Frontend tab: `frontend/src/components/organisms/PrototypeTabVSCode.tsx`
- API client: `frontend/src/services/coder.service.ts`
- Run button: `frontend/src/components/molecules/dashboard/DaRuntimeControl.tsx` (`handlePlayClick` when `tab === 'vscode'`)
- Orchestration: `backend/src/services/orchestrator.service.js`
- Coder HTTP client: `backend/src/services/coder.service.js`
- VS Code extension (workspace image): `instance-setup/coder/autowrx-runner/`
