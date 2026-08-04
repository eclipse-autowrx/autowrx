# Dashboards, Widgets & Runtime

The runtime side of a prototype: widget dashboards, the widget marketplace, and the hardware-kit/cloud runtime that executes prototype code. Frontend: `components/molecules/dashboard/`, `components/molecules/DaRuntimeConnector.tsx`, `stores/runtimeStore.ts`. Backend: kit-server reverse proxy + asset tokens.

## Dashboards & widgets

| Feature | What it does | Key files | Gating |
|---|---|---|---|
| Dashboard renderer | Runs a widget dashboard for a prototype (widget iframes fed runtime signal values). | `DaDashboard.tsx` | Read `READ_MODEL` |
| Dashboard editor | Visual 5×2 grid editor: place/move/edit/delete widgets; add from Built-in / Marketplace / URL; edit options (JSON) and boxes; "used signals" helper; open in Web Studio; auto-applies the default dashboard template. | `DaDashboardEditor.tsx`, `DaDashboardGrid.tsx`, `data/builtinWidgets.ts` | Edit `READ_MODEL`; marketplace via `DEFAULT_MARKETPLACE_URL` |
| Builtin widgets | Prebuilt widget bundles (3d-car, chart-signals, image-by-api-value, signal-list-settable, simple-fan, simple-wiper, single-api, terminal) + shared libs, served from `/builtin-widgets`. | `backend/static/builtin-widgets/` | Public |
| Widget marketplace | Browse/add marketplace widgets. | `useListMarketplaceWidgets`, `widget.service` | `DEFAULT_MARKETPLACE_URL` |
| Widget ProtoPilot (GenAI widgets) | GenAI widget generation. | `DaWidgetSetup.tsx` | *Roadmap* (placeholder "coming soon") |

## Runtime & hardware kit

The frontend connects **directly** to the runtime/kit server (`RUNTIME_SERVER_URL`, default `https://kit.digitalauto.tech`); the backend reverse-proxies `/kit-server/*` to it (websocket-aware) and issues asset tokens for authentication.

| Feature | What it does | Key files / endpoints | Gating |
|---|---|---|---|
| Runtime control panel | Select/connect a runtime (cloud or hardware kit); Run/Stop prototype; terminal; signals watch; vars watch (C++); mock services; pip install; rebuild/revert vehicle model; custom runtime URL; Rust remote compile; notifies widget iframes of run/stop. | `DaRuntimeControl.tsx`, `DaRuntimeConnector.tsx` | Read `READ_MODEL`; server URL from `RUNTIME_SERVER_URL`, options `RUNTIME_SERVER_CONFIG` |
| Runtime / asset manager | Create/list/share/edit/delete cloud-runtime and hardware-kit assets; select active runtime. | `RuntimeAssetManager.tsx`, `useAssets` | Auth |
| Hardware kit manager | Configure a hardware kit asset's identity/connection. | `FormHardwareKitManager.tsx` | Auth; launched from My Assets for `HARDWARE_KIT` assets |
| Asset access tokens | Issues a JWT bound to an Asset (no refresh token) so external/runtime clients authenticate as the asset. | `POST /v2/assets/:id/generate-token` | Auth + `READ_ASSET` |
| Kit server proxy | Reverse-proxies `/kit-server/*` to `KIT_SERVER_URL`. | `backend/src/app.js`, `config/config.js` | Passthrough (kit server enforces its own auth) |

> Realtime signal flow is detailed in [realtime-signals.md](../architecture/realtime-signals.md). Managing runtime/kit assets is in [assets-sharing.md](./assets-sharing.md).