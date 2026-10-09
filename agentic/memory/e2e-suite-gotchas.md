---
name: e2e-suite-gotchas
description: Non-obvious E2E (.agents Playwright) environment facts — PUBLIC_VIEWING gates guest tests, nodemon must ignore static/, no direct internet for Chromium, editor code shape
metadata:
  type: reference
---

Facts learned debugging the 2026-10-07 E2E failures (12 → 0):

- **Guest-flow E2E tests require site-config `PUBLIC_VIEWING=true`** on the target instance. The flag lives in site config (category auth); `req.authConfig.PUBLIC_VIEWING` (backend/src/middlewares/authConfig.js) gates optional-auth routes like `GET /v2/models`. With it false, guests get "Sign in required" pages and ~6 suites fail. No spec mutates this key, so if it is false, someone set it manually — flip it back on test instances.
- **Backend dev script must not restart on plugin deploys**: `npm run dev` uses `nodemon --ignore 'data/*' --ignore 'static/*'`. Plugin ZIP uploads and `deployInternalPluginFixture` write into `backend/static/plugin/` — without the static ignore, nodemon restarts mid-test and API calls fail with "socket hang up".
- **Headless Chromium has no internet on this host** (proxy-only via 127.0.0.1:3128; Chromium ignores env proxy). Specs must not assert real external navigations — intercept the URL with `context.route(...fulfill)` instead (see home-sections.spec.ts example.com).
- **Monaco is served locally, not from a CDN** (fixed 2026-10-07): `frontend/src/lib/monacoSetup.ts` points `@monaco-editor/loader` at `/monaco/vs`, and `frontend/scripts/vendor-monaco.mjs` (postinstall) copies `node_modules/monaco-editor/min/vs` → `frontend/public/monaco/vs`. Before this, offline hosts got a forever-"Loading…" project editor and a blank plain-code editor. Never statically `import 'monaco-editor'` in app code — the ESM graph is huge and its per-module dev serving stalls unrelated pages; use the vendored `min/vs` loader path.
- **Playwright `error-context.md` can show a stale/unrelated page** — don't diagnose navigation bugs from it alone; check `test-failed-*.png` (screenshot of the actual page object) and log `page.url()` over time in the spec.
- **Project editor `code` shape**: the editor renders the file tree only from `fsData[0].items` when `fsData[0].type === 'folder'` — seed `[{type:'folder',name:'root',items:[...]}]`, never a flat file array.
- **Default card images are instance-configurable**: site-config keys `DEFAULT_MODEL_IMAGE` / `DEFAULT_PROTOTYPE_IMAGE` override the built-in `/imgs/...` paths; image-fallback specs resolve the effective value via `GET /v2/site-config/public/<key>` (helper `getEffectiveDefaultImage`).
- **Prototype `description` is an object** in backend validation (`{problem, says_who, solution, status, text}`), not a string.
- The home lists' sort dropdowns are Radix DropdownMenus — drive them with `getByRole('menuitem', ...)` (helpers `selectHomeModelSort` / `selectHomePrototypeSort`).
