# Plugins

The loadable-plugin system: a plugin is a standalone React bundle AutoWRX loads dynamically at runtime and renders inside a model/prototype tab or a deploy/staging stage. Backend: `routes/v2/system/plugin.route.js`, `controllers/plugin.controller.js`. Frontend: `components/organisms/PluginPageRender.tsx`, `PluginForm.tsx`. See the [Plugin Development guide](../guides/plugin/README.md) for authoring.

## Plugin registry & hosting

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| Plugin CRUD | Catalog of plugins (`type` `prototype_function` or `deploy`); slug auto-generated; list admin plugins publicly; list own; ownership-gated edits. | `GET /v2/plugin[/{admin,id/:id,slug/:slug,mine}]`, `POST/PUT/DELETE /v2/plugin[/:id]` | Reads public; write auth + ownership/admin |
| Internal plugin upload | Upload a zip, extract to `backend/static/plugin/:slug`, auto-detect entry (`index.js`/`index.html`), serve at `/plugin/:slug/...`. | `POST /v2/plugin/upload/:slug` | Auth (ownership on existing slug) |

## Loading & rendering

| Feature | What it does | Key files | Gating |
|---|---|---|---|
| Plugin loader | Fetches the plugin URL, injects a `<script>` (module, classic fallback), primes `window.React`/`ReactDOM`/`require` shim, polls `window.DAPlugins['page-plugin']` (15 s), renders `components.Page` or wraps imperative `mount`/`unmount`; caches registrations per slug. | `PluginPageRender.tsx` | Render context: `WRITE_MODEL` / `useCanEditPrototype` for editing |
| Plugin preloader | Background-prefetches plugin scripts for tabs/staging. | `usePluginPreloader.ts` | — |
| Sample plugins | `sample-tsx` (esbuild) and `sample-esm` (no bundler) under `backend/static/plugin/`. | `backend/static/plugin/` | Public |

## Addon tabs & management

| Feature | What it does | Key files / pages | Gating |
|---|---|---|---|
| Addon select / custom tab editor | Pick a plugin addon to add as a custom tab; reorder/edit/hide tabs; set variant; configure sidebar plugin + right-nav action buttons (incl. built-in Staging). | `AddonSelect.tsx`, `CustomTabEditor.tsx` | `WRITE_MODEL` + `ALLOW_NON_ADMIN_ADDON_CONFIG` |
| My Plugins | Per-user plugin list + create/edit/delete. | page `/me/plugins` | Auth; shown to non-admins only when `ALLOW_NON_ADMIN_ADDON_CONFIG` |
| Plugin management (admin) | Four sections: Prototype Plugin, Deployment Plugin, Vehicle API Schema, Vehicle API (custom sets); configure deploy plugins per staging stage. | page `/admin/plugins` | `MANAGE_USERS`; custom API sections hidden when `DISABLE_CUSTOM_API_SETS` |

> Plugins run **same-origin, unsandboxed** (full DOM access) and interact with the platform only through the `PluginAPI` passed as `props.api`. See the [Plugin API reference](../guides/plugin/api-reference.md).