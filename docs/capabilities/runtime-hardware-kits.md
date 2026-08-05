# Cluster: Runtime & Hardware Kits

Executing prototype code on cloud/hardware runtimes. The frontend connects **directly** to the runtime/kit server; the backend reverse-proxies and issues asset tokens. Frontend: `components/molecules/{DaRuntimeControl,DaRuntimeConnector}.tsx`, `stores/runtimeStore.ts`. Backend: `app.js` (kit proxy), `controllers/asset.controller.js` (generateToken).

---

## Runtime control panel

- **Description:** Right-side panel on Code/Dashboard tabs: select/connect a runtime (cloud or hardware kit), Run/Stop, terminal output, signals watch, vars watch (C++), mock services, runtime usage, request pip install, rebuild/revert vehicle model, custom runtime URL, Rust remote compile; notifies widget iframes of run/stop.
- **Who uses it / value:** Prototype authors (run/test code); hardware-kit operators.
- **Acceptance criteria:**
  - Connect to a runtime → `subscribe_apis` over Socket.IO → signals/vars stream into the UI; Run → `run_python_app`/`run_rust_app`; Stop → `stop_python_app`; terminal + trace vars update.
  - Server URL from `RUNTIME_SERVER_URL`, options from `RUNTIME_SERVER_CONFIG`; custom runtime URL overrides (localStorage).
  - Read requires `READ_MODEL`.
- **Quality control:** Connect a cloud runtime → Run a Python prototype → terminal shows output + signals update; Stop → execution halts; pip install → dependency fetched; rebuild vehicle model → kit rebuilds.
- **Security:** Read `READ_MODEL`. Direct Socket.IO to external kit server (auth via asset token). Rust remote compile sends code to a remote compiler.
- **Data protection:** Runtime signal values are transient (`runtimeStore`); prototype code sent to the kit/remote compiler for execution.

## Runtime / asset manager

- **Description:** Dialog to create/list/share/edit/delete cloud-runtime and hardware-kit assets; select the active runtime.
- **Who uses it / value:** End users (manage their runtimes/kits); collaborators (shared access).
- **Acceptance criteria:**
  - Create/share/edit/delete assets; selecting an active runtime drives the control panel.
  - Auth required.
- **Quality control:** Create a cloud runtime asset → selectable in the control panel; share it → collaborator can select; delete → gone.
- **Security:** Auth required; sharing via `WRITE_ASSET` (see [assets-sharing.md](./assets-sharing.md)).
- **Data protection:** Asset `data` (e.g. endpoint config) stored in `assets`.

## Hardware kit manager

- **Description:** Configure a hardware-kit asset's identity/connection.
- **Who uses it / value:** Hardware-kit operators.
- **Acceptance criteria:**
  - Launched from My Assets for `HARDWARE_KIT` assets; auth required; configures the kit identity used by the connector.
- **Quality control:** Configure a kit → the connector can target it; signals/VSS ops (`fetchSignalMapping`, `replaceSignalMapping`, `fetchVss`, `replaceVss`) work against the kit.
- **Security:** Auth required; kit operations open their own Socket.IO to the kit server.
- **Data protection:** Kit connection config in the asset `data`; signal/VSS files read/written on the kit.

## Asset access tokens

- **Description:** Issues a JWT bound to an Asset (no refresh token) so external/runtime clients authenticate as the asset for kit-server/runtime access.
- **Who uses it / value:** DevOps/integrators (programmatic runtime access); the kit server (authenticating requests).
- **Acceptance criteria:**
  - `POST /v2/assets/:id/generate-token` (auth + `READ_ASSET`) → `200 { tokens: { access } }` (asset-scoped, no refresh).
  - The token is accepted by the kit server/runtime as the asset's identity.
- **Quality control:** Generate a token → use it against the kit server → authenticated as the asset; without it → unauthorized.
- **Security:** Requires auth + `READ_ASSET` on the asset. Asset tokens are access-only (short-lived), no refresh — reduces exposure if leaked.
- **Data protection:** Token is a bearer credential — treat as a secret; no persistence client-side beyond memory.

## Kit server proxy

- **Description:** Reverse-proxies `/kit-server/*` to the configured `KIT_SERVER_URL` (websocket-aware, path-rewrite).
- **Who uses it / value:** The frontend runtime connector (a same-origin entry point to the kit server); DevOps (centralize kit access).
- **Acceptance criteria:**
  - `ALL /kit-server/*` proxied to `KIT_SERVER_URL`; websockets upgraded.
  - Conditional on `KIT_SERVER_URL` being configured.
- **Quality control:** With `KIT_SERVER_URL` set, runtime connections via `/kit-server` succeed; without it, the route is inactive.
- **Security:** Passthrough — the kit server enforces its own auth (often via asset tokens). CSP/connect-src must allow the kit server.
- **Data protection:** Proxies runtime traffic; no storage on the backend.

## Runtime server config

- **Description:** Site-config `RUNTIME_SERVER_URL` + `RUNTIME_SERVER_CONFIG` (Socket.IO client options) drive frontend runtime connections; health-checked by the health endpoint.
- **Who uses it / value:** Admins/DevOps (point instances at a kit server).
- **Acceptance criteria:**
  - Site-config public read; admin write. Health endpoint reports runtime-server reachability.
- **Quality control:** Change `RUNTIME_SERVER_URL` → runtime connections use the new server; health check reflects status.
- **Security:** Public read (URL only, no secrets); admin write.
- **Data protection:** URL + Socket.IO options only; `RUNTIME_SERVER_CONFIG` should not hold secrets.