# Skill: Realtime Event
> Add a new Socket.IO realtime event end-to-end (backend → kit server → frontend).

## When to use
Run this when you need a new realtime event: streaming a value from the kit/runtime, pushing status from a running app, or any new server-pushed/round-tripped signal over the existing Socket.IO channel. Don't use this for plain REST endpoints (use `./add-endpoint.md`) or for frontend-only state (use `./add-frontend-feature.md`). The realtime server is `backend/src/config/socket.js`; runtime exec is **REMOTE** via `RUNTIME_SERVER_URL` (an external kit/runtime server), not local `child_process`.

## Steps

### 1. Define the event contract
Write down before coding: **event name**, **direction** (client→server, server→client, or relayed to the kit server), **payload shape**, **who emits**, **who listens**, and **ack/error semantics**. Match existing event naming (`subscribe_apis`, `run_python_app`, `run_rust_app`, `stop_python_app`, `run_until_complete`, `fetchSignalMapping`, `replaceSignalMapping`, `fetchVss`, `replaceVss`, `replaceApi`). Pick a verb+noun name that reads as an action.

### 2. Wire the backend socket layer
In `backend/src/config/socket.js` (and the handlers it delegates to): register the listener/relay. The socket middleware already authenticates via `socket.handshake.query.access_token` (JWT verify → `socket.user`) — rely on `socket.user` for identity; do not re-auth from the payload. If the event is relayed to the kit/runtime server, emit it over the existing `RUNTIME_SERVER_URL` client with `RUNTIME_SERVER_CONFIG` (reconnectionAttempts, etc.), and pipe the kit server's ack/error back to the frontend socket.

### 3. Follow the subscribe → run → stop pattern
If the event drives runtime execution, mirror the established lifecycle:
- a `subscribe_apis` must happen before any `run_*`;
- `run_*` starts a remote app; `stop_*` stops it;
- status/streams are emitted server→client while running.
For a new `run_*`-style event, also add the matching `stop_*` (or ensure an existing stop covers it). Serialize per-app run/stop to avoid races (see `./find-race-conditions.md`, step 4) — use a per-id in-flight guard.

### 4. Wire the frontend listener
In `frontend/src/`, add the `socket.on('<event>', …)` listener in the component/store that owns that state. Clean up the listener on unmount/logout (`socket.off('<event>')`) to avoid duplicate-handler leaks across reconnects. Emit from the frontend with the agreed payload; if the event requires a prior subscribe, emit subscribe first and await its ack before emitting the new event. Keep tokens out of the payload — auth is on the handshake query, not per-event.

### 5. Handle reconnect
The kit client uses `RUNTIME_SERVER_CONFIG` reconnectionAttempts/backoff. On reconnect, re-establish required subscriptions (e.g. re-`subscribe_apis`) before re-issuing `run_*`, or surface a "reconnecting" state to the user. On the frontend, confirm the socket reconnect re-binds your new listener exactly once.

### 6. Document the capability
Update `docs/capabilities/runtime-hardware-kits.md` with the new event name, direction, payload, and the lifecycle it belongs to (keep it code-grounded per `./docs-update.md`). If the event changes a documented capability cluster, update that file too.

## Guardrails
- **Validate event origin and payload.** Don't trust arbitrary socket input: confirm `socket.user`, validate the payload shape/ranges, and reject early. Never accept a user id / owner from the payload — take it from `socket.user`.
- **Rate-limit** event emission for high-frequency or runtime-driving events; a runaway client shouldn't DoS the kit server. Reuse the existing limiter style if present.
- **No secrets over the channel.** No tokens, cookies, passwords, or `clientSecret`s in payloads or acks. Auth stays in the handshake.
- **No local `child_process` for runtime.** The only sanctioned local spawn is `spawn('unzip', …)` in `controllers/plugin.controller.js` (plugin upload). New runtime exec must go through the kit server via `RUNTIME_SERVER_URL`.
- **Don't block the event loop** in a socket handler — relay async, await the kit ack, and surface errors via the ack callback or an error event.
- **Serialize racing events** (run/stop, replace*) — see `./find-race-conditions.md`.

## Exit criteria
Return: the **event contract** (name/direction/payload/ack), the **backend wiring** (`config/socket.js` + handler, kit-server relay path), the **frontend listener** (`file:line`), the **reconnect behavior**, the **docs update** (`docs/capabilities/runtime-hardware-kits.md`), and how it was **verified** (manual round-trip + a test under `./add-test.md` if the event is runtime-driving). Confirm no secrets are sent and payload validation is in place. Run `./security-review.md` if the event touches auth, runtime, or user data.