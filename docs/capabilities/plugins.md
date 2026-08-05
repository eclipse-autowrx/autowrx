# Cluster: Plugins

The loadable-plugin system: a plugin is a standalone React bundle AutoWRX loads dynamically at runtime and renders inside a model/prototype tab or a deploy/staging stage. Backend: `routes/v2/system/plugin.route.js`, `controllers/plugin.controller.js`. Frontend: `components/organisms/{PluginPageRender,PluginForm}.tsx`. See the [Plugin Development guide](../guides/plugin/README.md) for authoring.

---

## Plugin registry & CRUD

- **Description:** Catalog of plugins (`type` `prototype_function` or `deploy`) with slug, image, description, internal/external flag, URL, config; slug auto-generated from name; ownership-gated edits.
- **Who uses it / value:** Plugin authors (publish plugins); model owners/admins (attach plugins as addon tabs).
- **Acceptance criteria:**
  - `GET /v2/plugin` (public) → list; `GET /v2/plugin/{admin,id/:id,slug/:slug}` → admin/own/by-id/by-slug; `GET /v2/plugin/mine` (auth) → own; `POST /v2/plugin` (auth) → `201`; `PUT /v2/plugin/:id` (auth + ownership/admin) → `200`; `DELETE /v2/plugin/:id` (auth + ownership/admin) → `204`.
  - `slug` forbidden on update (immutable); auto-generated on create (unique with auto-suffix).
- **Quality control:** Create a plugin → slug generated; list shows it (public read); edit your own → ok; edit another user's → `403`; delete → `204`.
- **Security:** Reads public; writes require auth + ownership (or admin). ⚠️ `checkPermission(ADMIN)` on the upload route is commented out — any authenticated user can upload (subject to per-slug ownership).
- **Data protection:** Plugin metadata + `config` (Mixed) stored in `plugins` with `created_by`/`updated_by`.

## Internal plugin upload & static hosting

- **Description:** Upload a plugin zip, extract via system `unzip` into `backend/static/plugin/:slug`, auto-detect entry (`index.js`/`index.html`), serve at `/plugin/:slug/...`.
- **Who uses it / value:** Plugin authors (host plugins without an external CDN); admins (bundle system plugins).
- **Acceptance criteria:**
  - `POST /v2/plugin/upload/:slug` (auth; multipart `file`) → `200 { plugin, url }`; extracted to `backend/static/plugin/<slug>/`; served at `/plugin/<slug>/<entry>` with `is_internal=true`.
  - Existing slug owned by another non-admin → `403`.
- **Quality control:** Upload a zip → extracted + served; re-upload same slug (owner) → updates; upload to another user's slug → `403`.
- **Security:** Auth required; ownership enforced on existing slug. Upload accepts any file type (50 MB limit) and runs system `unzip` — treat as trusted code. Admin gate commented out (see above).
- **Data protection:** Plugin bundle served publicly from `/plugin/<slug>/`; the bundle can contain arbitrary JS (executes in users' browsers).

## Plugin loader

- **Description:** Fetches the plugin URL, injects a `<script>` (module first, classic fallback), primes `window.React`/`ReactDOM`/`require` shim + `__webpack_require__.cache`, polls `window.DAPlugins['page-plugin']` up to 15 s, renders `components.Page` or wraps imperative `mount`/`unmount`; caches registrations per slug.
- **Who uses it / value:** End users (plugin renders in tabs); plugin authors (the load contract).
- **Acceptance criteria:**
  - A tab referencing a plugin slug → host fetches metadata, injects script, plugin registers on `window.DAPlugins['page-plugin']`, renders with `{ data, editable, config, api }`.
  - Registrations cached across unmounts (switching tabs doesn't re-inject). 15 s timeout on registration.
- **Quality control:** Open a plugin tab → plugin renders; switch tabs and back → no reload (cached); a plugin that fails to register in 15 s → timeout.
- **Security:** ⚠️ Same-origin, **unsandboxed** — full DOM/window access. Only **public** site configs surfaced (secrets never exposed). `editable` from `WRITE_MODEL` permission; advisory only (plugin can ignore).
- **Data protection:** Plugin receives `data` (model/prototype), public site `config`, and the `PluginAPI`; no auth tokens/secrets passed.

## Plugin preloading

- **Description:** Background-prefetches plugin scripts for tabs/staging via `<link rel=prefetch>` + `fetch(priority=low)`.
- **Who uses it / value:** End users (faster tab loads).
- **Acceptance criteria:**
  - Collects plugin slugs from prototype tabs + staging; prefetches on idle (`requestIdleCallback`, configurable delay).
- **Quality control:** Open a model with plugin tabs → scripts prefetched → tab open is instant.
- **Security:** Prefetches external URLs with `credentials:'omit'`.
- **Data protection:** Only fetches public bundle URLs.

## Sample plugins

- **Description:** `sample-tsx` (esbuild IIFE bundle) and `sample-esm` (no bundler) under `backend/static/plugin/`, demonstrating the registration contract.
- **Who uses it / value:** Plugin authors (reference implementations).
- **Acceptance criteria:**
  - Both register on `window.DAPlugins['page-plugin']`; `sample-tsx/build.sh` builds with esbuild (externalizes React).
- **Quality control:** Build sample-tsx → `index.js`; load via the test page → renders.
- **Security:** Same as any plugin (unsandboxed).
- **Data protection:** Static sample assets.

## Addon select / custom tab editor

- **Description:** Pick a plugin addon to add as a custom tab; reorder/edit/hide tabs; set variant; configure a sidebar plugin + right-nav action buttons (incl. built-in Staging); choose open mode (dialog/page).
- **Who uses it / value:** Model owners (customize workspace); admins.
- **Acceptance criteria:**
  - Tab management requires `WRITE_MODEL` + `ALLOW_NON_ADMIN_ADDON_CONFIG` (admins always allowed).
  - Tab config stored on `model.custom_template` (`model_tabs`/`prototype_tabs`/`prototype_sidebar_plugin`/`prototype_right_nav_buttons`).
- **Quality control:** Add an addon tab → it renders via `PluginPageRender`; reorder/hide → persists; configure Staging right-nav button → appears.
- **Security:** `WRITE_MODEL` + addon flag. Plugins unsandboxed.
- **Data protection:** Tab/layout config on the model document.

## My Plugins & admin Plugin management

- **Description:** Per-user plugin list (`/me/plugins`) + create/edit/delete; admin management (`/admin/plugins`) with four sections (Prototype Plugin, Deployment Plugin, Vehicle API Schema, Vehicle API/custom sets); configure deploy plugins per staging stage.
- **Who uses it / value:** Plugin authors (manage own plugins); admins (manage all + custom APIs).
- **Acceptance criteria:**
  - `/me/plugins` (auth; shown to non-admins only when `ALLOW_NON_ADMIN_ADDON_CONFIG`) → CRUD own plugins.
  - `/admin/plugins` (`MANAGE_USERS`) → 4 sections; custom API sections hidden when `DISABLE_CUSTOM_API_SETS`.
- **Quality control:** Author creates a plugin via `/me/plugins` → usable as an addon; admin configures a deploy plugin per staging stage → it launches from Staging.
- **Security:** My Plugins auth; admin `MANAGE_USERS`; non-admin visibility gated by addon flag.
- **Data protection:** Plugin records + per-stage config (`STAGING_FRAME` site config holds stage → plugin mapping).