# Plugin Development

A **plugin** is a standalone React component bundle that AutoWRX loads dynamically at runtime and renders inside a prototype or model tab. Plugins use a host-provided API (`PluginAPI`) to read and update vehicle data, manage assets, drive navigation, and talk to connected hardware kits — without being compiled into the core app.

This guide has three parts:

- **This page** — what a plugin is, quick start, how loading works, and the security model.
- [API Reference](./api-reference.md) — every method on `PluginAPI` (27 methods).
- [Deployment](./deployment.md) — hosting your built bundle (CORS, providers, cache headers).

> **Source of truth:** the `PluginAPI` interface in [`frontend/src/types/plugin.types.ts`](../../../frontend/src/types/plugin.types.ts). Where this guide and the code diverge, the code wins.

## Quick start

The fastest path is to copy the real sample plugin and build it with the same toolchain it uses (esbuild):

```bash
cp -r backend/static/plugin/sample-tsx my-plugin
cd my-plugin
./build.sh        # runs esbuild → produces index.js (+ index.js.map)
```

`build.sh` bundles `src/index.ts` to a single IIFE `index.js`, marking `react`, `react-dom/client`, and `react/jsx-runtime` as **external** because the host provides them at runtime. The host primes `window.React`, `window.ReactDOM`, and a `require()` shim before your script runs, so `import * as React from 'react'` resolves to the host's React (it is **not** bundled into your plugin) — and in components you can also read it directly via `globalThis.React`.

To serve the built bundle locally for testing:

```bash
npx serve .        # then register the URL http://localhost:3000/index.js
```

Then **register** the plugin in the admin panel (Name + Slug + URL of your hosted `index.js`) and **attach** it to a prototype or model by adding a custom tab whose `plugin` field is the plugin's slug. When that tab is opened, the host loads your bundle and renders your component.

### Hosting the bundle two ways

- **External URL** (default): host `index.js` on any static host (GitHub Pages, Netlify, S3+CloudFront, your own server) with CORS enabled. Set `is_internal: false` and put the full URL in the plugin's `url` field.
- **Internal zip** (served by the backend): upload a zip of the built plugin directory via `POST /v2/system/plugin/upload/:slug`. The backend extracts it to `backend/static/plugin/<slug>/`, auto-detects the entry file (`index.js` preferred, then `index.html`), and sets `url` to `/plugin/<slug>/<entry>` with `is_internal: true`.

See [Deployment](./deployment.md) for CORS headers and provider examples.

## From scratch

If you'd rather not copy the sample:

```bash
mkdir my-plugin && cd my-plugin
npm init -y
npm install esbuild --save-dev
```

`package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --format=iife --platform=browser --jsx=automatic --external:react --external:react-dom/client --external:react/jsx-runtime --sourcemap --outfile=index.js",
    "dev": "esbuild src/index.ts --bundle --format=iife --platform=browser --jsx=automatic --external:react --external:react-dom/client --external:react/jsx-runtime --sourcemap --outfile=index.js --watch"
  }
}
```

`src/index.ts` — the registration contract:

```ts
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import Page from './components/Page'

export const components = { Page }

export function mount(el: HTMLElement, props?: any) {
  const root = ReactDOM.createRoot(el)
  root.render(React.createElement(Page, props || {}))
  ;(el as any).__aw_root = root
}

export function unmount(el: HTMLElement) {
  ;(el as any).__aw_root?.unmount()
  delete (el as any).__aw_root
}

if (typeof window !== 'undefined') {
  ;(window as any).DAPlugins = (window as any).DAPlugins || {}
  ;(window as any).DAPlugins['page-plugin'] = { components, mount, unmount }
}
```

You can register just `components.Page` (the host renders it with React) **or** the imperative `mount`/`unmount` pair (the host wraps those in a React container). The registration key must be `'page-plugin'`.

## What the API can do

The host passes a `PluginAPI` object to your component as `props.api`. Every method is **optional** and only present when its context exists — always guard calls: `api.updateModel?.({ ... })`. The 27 methods fall into 7 categories:

- **Model & Prototype** (2) — update the current model/prototype.
- **Vehicle API** (6) — read computed APIs, API detail, VSS versions; replace APIs; get/set runtime values.
- **Navigation** (1) — switch the active prototype tab.
- **Wishlist APIs** (5) — CRUD on custom/extended vehicle signals.
- **Assets** (8) — CRUD on hardware kits / cloud runtimes + user lookup & sharing.
- **Files** (1) — upload a file (up to 50 MB, any type).
- **Kit / Runtime** (4) — read/replace signal-mapping and VSS files on a connected hardware kit.

Full signatures and when each is present: [API Reference](./api-reference.md).

## How loading works

The host component is `frontend/src/components/organisms/PluginPageRender.tsx`. When a tab referencing your plugin is opened:

1. **Fetch metadata** by slug (`getPluginBySlug`, fallback `getPluginById`) → needs the plugin's `url`.
2. **Prime globals** before your script runs: `window.React`, `window.ReactDOM`, `window.__PLUGIN_MODULES__`, a `require()` shim, and a fake `__webpack_require__.cache` so bundled plugins resolve host React synchronously.
3. **Inject `<script>`**: `src=url`, `async`, `crossOrigin="anonymous"`, `type="module"` first with a classic-script fallback.
4. **Wait for registration**: polls `window.DAPlugins['page-plugin']` up to **15 s** (every 100 ms). Registrations are cached per plugin slug and **reused across unmounts**, so switching tabs doesn't re-inject or re-download.
5. **Render**: your `components.Page` with props `{ data, editable, config, api }`, or a wrapper that calls `mount(el, props)` / `unmount(el)`.

Your component receives:

```ts
interface PluginPageProps {
  data?: any                // { model?, prototype?, ... } depending on context
  editable?: boolean        // whether the current user may edit (host WRITE_MODEL permission)
  config?: { plugin_id?: string; [k: string]: any }  // plugin config merged with PUBLIC site config
  api?: PluginAPI
}
```

`config` merges the plugin's stored `config` field with **public** site configs only — secrets are never exposed to plugins.

## Security model

- **No sandbox.** Your script runs in the host page's main origin with full `window`/`document` access. Iframe isolation is future work. Treat plugin code as trusted.
- **Narrow API surface.** `PluginAPI` deliberately exposes no direct store, router, auth token, or filesystem access. The only host state a plugin can touch is via the `api` methods.
- **Permission gating.** `editable` is derived from the host `WRITE_MODEL` permission for the current model. Write methods (`updateModel`, `updatePrototype`) are only attached when the user has that permission **and** the context (`model_id`/`prototype_id`) exists.
- **Ownership.** Editing/deleting a plugin record is gated to its creator or an admin. "System plugins" are those whose creator holds an admin role (there is no `is_admin` flag on the model).
- **Internal-zip upload.** The admin permission check on the upload route is currently commented out, so any authenticated user can upload (subject to the per-slug ownership check).

## Tips & patterns

- **Persist plugin state** in `model.extend` or `prototype.extend` via `api.updateModel({ extend: { ...data?.model?.extend, myKey: value } })`. These fields are the intended data sink for plugins.
- **Guard every optional API.** `api.updateModel?.(...)` — methods are `undefined` when their context is missing.
- **Wrap your component in an error boundary** (a class component using global `React`) so a render error in your plugin doesn't crash the host page.
- **Bundle non-React libraries** (e.g. `dayjs`, chart libs) into your plugin; **externalize** only `react`, `react-dom/client`, `react/jsx-runtime` (and any other host-provided global). Add more `--external` flags and matching host globals as needed.
- **Plugin-to-plugin communication**: write through `model.extend` (Plugin A writes, Plugin B reads), or broadcast `window` `CustomEvent`s.