# Skill: plugin-authoring
> Write, package, and upload an AutoWRX plugin (micro-frontend that runs same-origin and unsandboxed in the browser).

## When to use
- Building a new plugin (tab/addon) for a model or prototype page.
- Extending or refactoring an existing plugin's `PluginAPI` usage.
- Reviewing a plugin PR for correctness against the loader contract.

## Steps
1. **Study the contract.** Read `docs/architecture/plugin-system.md` (code-grounded) and `docs/guides/plugin/`. The loader (`frontend/src/components/organisms/PluginPageRender.tsx`) injects the plugin's `url` as a `<script>` and waits up to **15 s** for the plugin to set:
   ```js
   window.DAPlugins['page-plugin'] = { components: { Page }, mount?, unmount? };
   ```
   The host provides `window.React` / `window.ReactDOM` and a `require`/`__webpack_require__` shim — **externalize React** in your bundle; do not ship your own copy.
2. **Define the manifest/shape.** Types live in `frontend/src/types/plugin.types.ts` (`PluginAPI`, the registration object, props `{ data, editable, config, api }`). Match the field names exactly; the loader reads `registration.components.Page` (or `mount`/`unmount`).
3. **Use `PluginAPI` correctly.** `api` is a deliberately narrow surface (model/prototype updates, vehicle API, runtime values, wishlist, assets, file upload, navigation). Write methods are permission-gated via `editable`. `config` merges **public** site config with the plugin's own config — **secrets are never exposed** to plugins, so never design a plugin that needs one.
4. **Start from the fixture.** Copy `.agents/tests/fixtures/e2e-simple-plugin/` (`index.js` + the zipped artifact) as a starter; it shows the registration handshake and is used by the E2E suite, so a deviating plugin is easy to diff.
5. **Package as a zip.** Entry file is auto-detected on upload (`index.js` preferred, then `index.html`). Zip the plugin so the entry is at the root:
   ```bash
   cd my-plugin && zip -r my-plugin.zip index.js
   ```
6. **Upload.** `POST /v2/plugin/upload/:slug` (multipart) via `routes/v2/system/plugin.route.js`; the controller (`controllers/plugin.controller.js`, ~line 140) extracts with `spawn('unzip', …)` into `backend/static/plugin/<slug>/`. The public `url` becomes `/plugin/<slug>/<entry>` with `is_internal: true`. Alternatively create an **external** plugin pointing at a hosted `url`.
7. **Attach.** Via `AddonSelect` in the UI, the plugin's slug is written into a model's `custom_template.model_tabs` / `prototype_tabs`. Navigating to the tab mounts `PluginPageRender` with `plugin_id = <slug>`.
8. **Test.** Author an E2E spec under `.agents/tests/` (see `add-test.md`) using the `e2e-simple-plugin` fixture as a pattern. Verify render, the `PluginAPI` calls you rely on, and unmount/remount (tab switching uses a per-slug registration cache).
9. **Security review.** Any new `PluginAPI` surface, new config field, or new data passed to plugins requires `security-review.md` (see Guardrails).

## Guardrails
- **UNSANDBED, same-origin**: assume a plugin can read the DOM, cookies, and `window`. Treat plugins as trusted-but-audited code. Never pass auth tokens, user PII, or non-public data into `PluginAPI`, plugin `config`, or plugin `data`.
- Only **public** site configs flow into plugin `config`. If a feature seems to need a secret in config, redesign — don't widen the surface.
- Don't ship your own React; use the host-provided globals (the loader primes `window.React`/`ReactDOM`).
- Registration must happen within 15 s of script load or the loader gives up. Keep bundle init synchronous where possible.
- Any new `PluginAPI` method or config exposure gets `security-review.md` before merge.
- The admin gate on the upload route is currently commented out — do not assume upload is admin-only; surface this if it matters to the change.

## Exit criteria
- Plugin registers under `window.DAPlugins['page-plugin']`, renders as a tab, and the `PluginAPI` calls it depends on work under both read and write permissions.
- An E2E test covers the flow; `security-review.md` run if the API surface or config shape changed.
- No secrets in plugin config/data. Docs under `docs/guides/plugin/` updated if the authoring contract changed.

## Cross-links
- `security-review.md`, `add-test.md`, `add-frontend-feature.md`, `docs-update.md`.