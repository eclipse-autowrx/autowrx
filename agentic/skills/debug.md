# Skill: Debug
> Symptom → where-to-look decision tree for this repo (backend, frontend, realtime, E2E).

## When to use
Run this when diagnosing any unexpected behavior, error, or flake in the app or its tests. Pick the lane that matches the symptom and follow its branches. Cross-link `./find-race-conditions.md` for concurrency-shaped bugs, `./run-tests.md` for reproducing, `./troubleshoot-deploy.md` for deployed-env issues.

## Steps

### 0. Reproduce first
Get a minimal repro before touching code. Note the exact request/event/user/environment. For flaky behavior, run it 5–10×; if it only fails under load or parallel clicks, switch to `./find-race-conditions.md`.

### 1. Backend lane
- **Logs (winston):** `backend/src/config/logger.js` is the source. Dev: `cd backend && npm run dev` (nodemon) → stdout. PM2: `pm2 logs`. Docker: `docker logs autowrx` / `docker logs -f autowrx`. External aggregation: backend proxies to `LOG_URL` (`config/config.js`, `config/axios.js`) — if a log line never reaches the external UI, check that proxy + `LOG_URL` reachability.
- **HTTP layer:** morgan logs requests + status (`app.js:37` morgan.errorHandler). A 500 here means an exception escaped the route handler.
- **Centralized error path:** `middlewares/error.js` (ApiError, errorConverter, errorHandler) wired at `app.js:292`. If an error returns the wrong status or shape, verify it reaches `errorHandler` (throw `ApiError` / pass `next(err)`, don't swallow). If a route returns raw `Error`, it bypassed conversion.
- **Node inspector:** `node --inspect` / `--inspect-brk` on the backend process; chrome://inspect. Step through the suspect service. With nodemon, set `NODE_OPTIONS=--inspect`.
- **Mongo query inspection:** enable Mongoose debug (`mongoose.set('debug', true)`) or log in the service to see the actual query/filter/update. Confirm indexes used (`explain`). Many bugs here are a missing filter or a stale field after a schema change (see `./db-schema-change.md`).

### 2. Frontend lane
- **No ErrorBoundary:** `frontend/src/main.tsx` wraps in `React.StrictMode` only. Unhandled render errors surface in the **browser console** — that is the primary signal. In StrictMode, effects run twice in dev; don't chase a "double call" that only happens in dev.
- **Dev tools:** Vite dev server on port **3210** (`cd frontend && npm run dev`). Use React DevTools (components tree, hooks state) + Vite/Chrome DevTools.
- **Network tab:** inspect failing API calls (status, payload, `Set-Cookie`). For auth issues, check the refresh-token 401 replay path (see table below) and whether the httpOnly refresh cookie is present.
- **Socket.IO frames:** Network → WS filter; inspect frames for event names + payload ordering. `subscribe_apis` must precede `run_*` events (see Realtime lane).
- **Type errors:** `cd frontend && npm run build` runs `tsc && vite build` — surface silent type drift that dev HMR hides.

### 3. Realtime lane (Socket.IO)
- Server: `backend/src/config/socket.js` (Socket.IO server; JWT auth via `handshake.query.access_token`). Events: `subscribe_apis`, `run_python_app`, `run_rust_app`, `stop_python_app`, `run_until_complete`, `fetchSignalMapping`, `replaceSignalMapping`, `fetchVss`, `replaceVss`, `replaceApi`.
- Runtime exec is **REMOTE** via `RUNTIME_SERVER_URL` (external kit/runtime server), NOT local `child_process`. The only local spawn is `spawn('unzip', …)` in `controllers/plugin.controller.js`. If "run app" fails, check the kit server reachability + event ordering, not `child_process`.
- Trace ordering: log on both emit and receive. A missing `subscribe_apis` before `run_*` is a common silent failure. Concurrent `run`/`stop` and `replaceSignalMapping`/`replaceVss` racing → `./find-race-conditions.md`.
- Reconnect: check `RUNTIME_SERVER_CONFIG` reconnectionAttempts/backoff on the kit-client side.

### 4. E2E lane (Playwright)
- `cd .agents && npx playwright test`. On failure: `npx playwright show-report`, `--headed`, `--trace=on`, `--screenshot=only-on-failure`. Trace > screenshot > video for pinning the cause. Keep `.agents/SITEMAP.md` coverage in sync if the failure reflects a real page change.
- Env via `.agents/.env` (gitignored; see `.agents/.env.example`) — a missing var produces confusing auth/nav failures.

## Common symptoms → root cause
| Symptom | Likely cause | First look |
|---|---|---|
| 401 loop on the frontend | refresh-token single-flight broken / refresh failure → `logOut` | `stores/authStore.ts`, queued-request replay on 401 |
| Empty workspace / file tree | prototypes bind-mount / `CODER_URL` / orchestrator not prepared | `services/orchestrator.service.js`, prototype seed (commit `6bd6ccb`) |
| 503 / health-check degraded | a dependent service (kit/runtime, `CACHE_URL`, `LOG_URL`, Mongo) down | `troubleshoot-deploy.md`, `config/axios.js`, health route |
| Recent prototypes missing in UI but exist in DB | `CACHE_URL` eventual consistency — list comes from `${CACHE_URL}/get-recent-activities/:userId`, not DB | `services/prototype.service.js` ~line 260; wait/cache-bust |
| New prototype has no README/main.* templates | seed-vs-save race (fixed by `6bd6ccb`); regression if seed moved out of `createPrototype` | `services/prototype.service.js` createPrototype |
| 500 with wrong status/shape | error bypassed `middlewares/error.js` | route handler: use `next(err)` / throw `ApiError` |
| "double API call" in dev only | `React.StrictMode` double-render | not a bug; verify in `npm run build` preview |
| Playwright flake | timing / async wait missing | `--trace=on`, re-run 5× |
| `run_*` event silently does nothing | missing `subscribe_apis` first, or kit server unreachable | WS frames tab, `RUNTIME_SERVER_URL` |

## Guardrails
- Reproduce before fixing; never "fix" a symptom you haven't seen.
- Don't silence an error (empty catch, swallow `next`) to make it disappear — that hides it from `middlewares/error.js` and from future debugging. If you must handle, log it.
- Don't edit `docs/capabilities/*` claims during a debug pass unless the code now contradicts the doc (then do it via `./docs-update.md`).
- No secrets in logs/screenshots/traces you share.

## Exit criteria
Return: **repro steps**, the **root cause** with `file:line`, the **fix** (or a pointer to the skill that should implement it, e.g. `./find-race-conditions.md`), and how it was **verified** (test run / manual repro cleared). If you cannot pin the cause, say so and list the remaining hypotheses ranked by likelihood.