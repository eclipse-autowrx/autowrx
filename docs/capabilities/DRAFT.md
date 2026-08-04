# Capability Catalog — DRAFT (cluster grouping for review)

> **Status: draft for review.** This proposes how to group the platform's capabilities into **clusters** — each cluster becomes one file `docs/capabilities/<cluster>.md`. Nothing here is final until the grouping is agreed. The grouping is derived from an audit of the actual code (routes, pages, models, services, site-config flags).

Each cluster file will list its capabilities as: **name — what it does — key endpoints/components — gating — status (implemented / partial / roadmap)**.

---

## Proposed clusters (10)

### 1. Identity & Access
Authentication, identity, and authorization.
- Login / logout / token refresh (JWT access + httpOnly refresh cookie)
- Registration (gated by `SELF_REGISTRATION`)
- Password reset (6-digit code, primary) & email verification (gated by `PASSWORD_MANAGEMENT`)
- SSO — OIDC ID-token login + GitHub OAuth (gated by `SSO_AUTO_REGISTRATION`)
- User profile (name / avatar / password)
- User management (admin CRUD)
- RBAC v1 (resource-scoped roles → permissions; owners bypass) — primary
- Casbin RBAC v2 (`/authorize`) — partial
- Manage Users + Manage Features (admin)
*Key files:* `routes/v2/user-management/auth.route.js`, `services/auth.service.js`, `services/token.service.js`, `config/passport.js`, `config/roles.js`, `pages/PageManageUsers.tsx`, `hooks/usePermissionHook.ts`

### 2. Models
The vehicle-model domain and its layout.
- Model list / create / import (ZIP)
- Model detail / edit (visibility, state, contributors, images, export)
- Model tabs & addons (custom plugin tabs, layout editor, save as Model Template)
- Model contributors & permissions (add/remove authorized users)
- Model stats (by IDs)
- **Model templates** (admin scaffolds for model layouts)
*Key files:* `routes/v2/vehicle-data/model.route.js`, `models/model.model.js`, `pages/PageModelList.tsx`, `layouts/ModelDetailLayout.tsx`, `routes/v2/system/modelTemplate.route.js`

### 3. Vehicle APIs
The signal/API layer over models.
- VSS versions & CVI trees (from `backend/data/*.json`)
- Per-model VSS/COVESA API CRUD + computed (VSS + extended) tree
- Replace APIs from a VSS spec
- Vehicle API view (List / Tree / Hierarchical / Compare)
- Extended APIs (wishlist/custom signals per model)
- **Custom API schemas** (admin-defined tree/list/graph templates)
- **Custom API sets** (schema instances attached to models; system/user scope; item ops)
*Key files:* `routes/v2/vehicle-data/{api,extendedApi,custom-api-set}.route.js`, `routes/v2/system/custom-api-schema.route.js`, `pages/PageVehicleApi.tsx`, `components/organisms/CustomApi*.tsx`
> Note: Custom API sets are **not** admin-gated for system scope — any authenticated user can create/update/delete a system-scoped set.

### 4. Prototypes & Code
Authoring and structuring a model's prototypes.
- Prototype library (list/portfolio, search/sort, create, import)
- New-prototype full-page create flow (`ENABLE_NEW_PROTOTYPE_PAGE`)
- Prototype CRUD / bulk / recent / popular / execute-code
- Prototype workspace tabs: Overview, Customer Journey, Code, Dashboard, Feedback, Staging, Plug
- Code editor (Monaco, auto-save, API panel, code diff, SDV ProtoPilot)
- Project editor (multi-file, file tree, import/export ZIP) — when code is a JSON project
- Prototype feedback (star ratings)
- **Project templates** (admin scaffolds for starter projects)
*Key files:* `routes/v2/vehicle-data/prototype.route.js`, `pages/{PagePrototypeLibrary,PagePrototypeDetail}.tsx`, `layouts/NewPrototypeLayout.tsx`, `components/molecules/project_editor/`

### 5. Dashboards & Widgets
Visual run-time dashboards.
- Dashboard renderer (widget iframes fed runtime signals)
- Dashboard editor (5×2 grid, place/move/edit/delete, options/boxes)
- Widget sources: Built-in, Marketplace (`DEFAULT_MARKETPLACE_URL`), by URL
- Builtin widgets hosting (`/builtin-widgets`)
- **Dashboard templates** (named `widget_config` presets, default flag)
- Widget ProtoPilot (GenAI widget generation) — **roadmap**
*Key files:* `components/molecules/dashboard/`, `data/builtinWidgets.ts`, `routes/v2/system/dashboardTemplate.route.js`

### 6. Runtime & Hardware Kits
Executing prototype code on cloud/hardware runtimes.
- Runtime control panel (connect, Run/Stop, terminal, signals/vars watch, mock services, pip install, rebuild/revert model, Rust remote compile)
- Runtime / asset manager (create/list/share/edit/delete runtimes & kits, select active)
- Hardware kit manager (configure a kit asset)
- Asset access tokens (JWT bound to an asset for external/runtime clients)
- Kit server reverse proxy (`/kit-server/*` → `KIT_SERVER_URL`)
- Runtime server config (`RUNTIME_SERVER_URL`, `RUNTIME_SERVER_CONFIG`)
*Key files:* `components/molecules/{DaRuntimeControl,DaRuntimeConnector}.tsx`, `stores/runtimeStore.ts`, `controllers/asset.controller.js` (generateToken), `app.js` (kit proxy)

### 7. Assets & Sharing
User-owned resources and collaboration.
- User assets CRUD (types from `USER_ASSET_TYPES`: CLOUD_RUNTIME / HARDWARE_KIT / GENAI-PYTHON)
- Admin "all assets" view
- My Assets page
- Asset sharing (add/remove users with read/write roles)
- Model contributors
- Access invitation dialog
- User lookup by email (for sharing)
*Key files:* `routes/v2/user-management/asset.route.js`, `pages/PageMyAssets.tsx`, `components/organisms/RuntimeAssetManager.tsx`, `components/molecules/ShareAssetPanel.tsx`

### 8. Plugins
The loadable-plugin system.
- Plugin registry & CRUD (prototype_function / deploy types; slug auto-gen; ownership-gated)
- Internal plugin upload & static hosting (`/plugin/:slug/…`)
- Plugin loader (inject `<script>`, prime globals, poll `window.DAPlugins['page-plugin']`, render)
- Plugin preloading
- Sample plugins (sample-tsx esbuild, sample-esm)
- Addon select / custom tab editor (tabs, sidebar plugin, right-nav buttons)
- My Plugins (per-user) & Plugin management (admin, 4 sections)
*Key files:* `routes/v2/system/plugin.route.js`, `components/organisms/{PluginPageRender,PluginForm}.tsx`, `pages/{PluginList,PluginManagement}.tsx`
> Plugins run same-origin, unsandboxed; interact only via `PluginAPI`.

### 9. Site Configuration & Theming
The configuration layer driving most behavior/branding/toggles.
- Site config CRUD (scoped key/value, types, secrets, categories, unique `(key,scope,target_id)`)
- Public config read; admin CRUD; Site Config management page (11 sections + edit history)
- Global CSS theming (`/static/global.css`, get/update/restore-default)
- Home config editor (`CFG_HOME_CONTENT` blocks)
- Branding (`SITE_TITLE`, logos, favicon, theme color)
- Auth config flags (`PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, `PASSWORD_MANAGEMENT`)
- SSO provider config (encrypted secrets) + Email config (resend/smtp, test send)
- Site config snapshots & restore
- Privacy policy (public page + admin editor)
*Key files:* `routes/v2/system/site-management.route.js`, `services/siteConfig.service.js`, `config/predefinedSiteConfigs.js`, `pages/SiteConfigManagement.tsx`

### 10. Integrations & Platform
External integrations, search/content, and system capabilities.
- SDV ProtoPilot (GenAI code gen) + GenAI service proxy (`/v2/genai/*`)
- GitHub OAuth (linking + SSO)
- Email service (Resend/SMTP, transactional)
- Learning mode (embedded iframe)
- Web Studio widget creation
- Search (cross-resource, user-by-email, prototypes-by-signal) + Global search UI
- Discussions (threaded comments) — partial
- Feedback service
- Health check, File upload (image-scaled, `/d/...`), Change logs/audit (`captureChange`)
- Static & SPA serving, VSS static, CORS/Helmet CSP, Socket.IO, log/cache service clients
*Key files:* `routes/v2/system/{genai,search,health,file,changeLog}.route.js`, `services/{email,log}.service.js`, `components/molecules/genAI/`

---

## Cross-cutting (will live in the index `README.md`, not per-cluster)
- Auth-gating pattern (`auth({ optional: PUBLIC_VIEWING })`)
- Permission constants table (`READ_MODEL`, `WRITE_MODEL`, `MANAGE_USERS`, `USE_GEN_AI`, …)
- Global feature-flags reference (with verified defaults)

## Open questions for review
1. **Cluster count (10) — too many / too few?** Candidates to merge: Runtime & Hardware Kits into Dashboards & Widgets? Search/Discussions/Feedback out of Integrations into a "Content" cluster? Templates as their own cluster (currently folded into Models / Prototypes / Dashboards)?
2. **Templates** — keep folded into their domain clusters (current proposal), or break out a separate **Templates** cluster?
3. **Custom APIs** — a sub-section of "Vehicle APIs" (current), or its own cluster?
4. **Naming** — `docs/capabilities/<cluster-slug>.md` file names. Proposed slugs: `identity-access`, `models`, `vehicle-apis`, `prototypes-code`, `dashboards-widgets`, `runtime-hardware-kits`, `assets-sharing`, `plugins`, `site-config-theming`, `integrations-platform`.

Once you confirm/adjust the clusters, I'll write each `docs/capabilities/<cluster>.md` with the per-capability details (what / endpoints / gating / status).