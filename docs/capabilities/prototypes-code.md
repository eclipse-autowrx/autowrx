# Cluster: Prototypes & Code

Authoring and structuring a model's prototypes. Backend: `routes/v2/vehicle-data/prototype.route.js`, `models/prototype.model.js`. Frontend: `pages/{PagePrototypeLibrary,PagePrototypeDetail}.tsx`, `layouts/NewPrototypeLayout.tsx`.

---

## Prototype library

- **Description:** List/portfolio views of a model's prototypes; search, sort (Newest/Oldest/Name/Rating/Last/First viewed), filter; create a prototype (inline dialog, or the `/new-prototype` page when `ENABLE_NEW_PROTOTYPE_PAGE`); import from ZIP.
- **Who uses it / value:** Model owners/contributors (manage prototypes); end users (browse/portfolio).
- **Acceptance criteria:**
  - Routes `/model/:id/library[/:tab(list|portfolio)[/:prototype_id]]` render the library.
  - Create/import require `WRITE_MODEL`; viewing subject to `PUBLIC_VIEWING`.
  - Duplicate-name detection offers suggestions.
- **Quality control:** Create a prototype → appears in the list; switch list/portfolio; import a prototype ZIP → created; sort by name → ordered.
- **Security:** Create/import `WRITE_MODEL`; reads respect `PUBLIC_VIEWING` + `READ_MODEL` for private models.
- **Data protection:** Prototype metadata + code stored in `prototypes`; import reads archive contents.

## New prototype layout

- **Description:** Full-page create flow that previews the selected model's (or default template's) prototype shell — sidebar, tab bar, plugin preview — behind the create dialog, then navigates to the new prototype.
- **Who uses it / value:** Model owners (a guided create experience).
- **Acceptance criteria:**
  - Route `/new-prototype` (auth; redirects to `/` if signed out); feature-flagged on by `ENABLE_NEW_PROTOTYPE_PAGE` (default `false`).
  - Supports `?create-model` mode.
- **Quality control:** With the flag on, open `/new-prototype` → shell preview + create dialog → navigates to the new prototype detail; signed-out → redirected to `/`.
- **Security:** Auth required.
- **Data protection:** No extra data; reads model/template to preview.

## Prototype CRUD / bulk / recent / popular / execute-code

- **Description:** Create/update/delete prototypes; bulk create; recent (cached per-user activity) and popular (top-executed, released, public) lists; execute-code counter.
- **Who uses it / value:** Owners (lifecycle); end users (discover recent/popular); analytics (execution counts).
- **Acceptance criteria:**
  - `GET/POST /v2/prototypes` (read optional, write `WRITE_MODEL`); `POST /v2/prototypes/bulk` → `201`; `GET /v2/prototypes/recent` (auth) → `200`; `GET /v2/prototypes/popular` (optional) → `200`; `GET/PATCH/DELETE /v2/prototypes/:id` → `200`/`200`/`204`; `POST /v2/prototypes/:id/execute-code` → `200` increments counter.
  - Private models require `READ_MODEL` for reads.
- **Quality control:** Create → `201`; run code → execute counter increments; recent reflects your activity; popular shows released/public.
- **Security:** Write `WRITE_MODEL`; recent requires auth; reads respect `PUBLIC_VIEWING` + model access.
- **Data protection:** `last_viewed`, `executed_turns`, `rated_by` (Map), `state` stored per prototype.

## Prototype workspace (tabs)

- **Description:** The prototype detail page with built-in tabs plus custom plugin (addon) tabs and configurable right-nav action buttons; records `last_viewed` and recent-prototype.
- **Who uses it / value:** Authors (build); reviewers (feedback); operators (staging); end users (view).
- **Acceptance criteria:**
  - Routes `/model/:id/library/prototype/:pid[/:tab]` with tabs `view|journey|code|dashboard|feedback|staging|plug`.
  - Addon/tab management requires `WRITE_MODEL` + `ALLOW_NON_ADMIN_ADDON_CONFIG`; "Save as Template" requires admin; Staging requires auth + prototype code.
  - Plugin sidebar collapsible; addon add/manage + "Customize Layout" editor available.
- **Quality control:** Switch each tab → correct content renders; add an addon tab → it loads via `PluginPageRender`; reorder tabs → persists; Staging hidden for a code-less prototype.
- **Security:** Tab management `WRITE_MODEL` + addon flag; Staging auth-gated. Plugins unsandboxed.
- **Data protection:** Tab config + `extend` (plugin data sink) stored on the prototype; `last_viewed` updated on visit.

## Code editor

- **Description:** Monaco editor with auto-save; resizable Vehicle API panel; SDV ProtoPilot GenAI launcher; code diff view; language label; multi-file Project Editor when code is a JSON project.
- **Who uses it / value:** Prototype authors (write/edit SDV code); GenAI users (generate code).
- **Acceptance criteria:**
  - Edit requires `WRITE_MODEL`; API panel shown when `SHOW_CODE_API_PANEL=true`; SDV ProtoPilot button shown when `SHOW_SDV_PROTOPILOT_BUTTON=true` + `USE_GEN_AI`; diff when `SHOW_CODE_DIFF=true`.
  - Auto-save persists code; language label reflects Python/Rust.
- **Quality control:** Edit code → auto-saves; open API panel → signals list; run ProtoPilot → generated code preview → apply; toggle diff → shows changes.
- **Security:** Edit `WRITE_MODEL`; GenAI gated by `USE_GEN_AI` + flag.
- **Data protection:** Code (potentially large text) stored in `prototype.code`; auto-save writes frequently (throttled by `captureChange`).

## Project editor (multi-file)

- **Description:** File-tree editor with create/rename/delete files & folders, open tabs, unsaved-change tracking, save-all, import/export ZIP, per-file Monaco. Activated when prototype code is a JSON project descriptor.
- **Who uses it / value:** Authors of multi-file SDV projects.
- **Acceptance criteria:**
  - Activated when `prototype.code` is a JSON project; edit requires `WRITE_MODEL`.
  - File ops (create/rename/delete), tabs, save-all, import/export ZIP all functional.
- **Quality control:** Add a file → appears in tree; edit + save-all → persisted; export ZIP → valid archive containing files.
- **Security:** Edit `WRITE_MODEL`. GitHub auth wiring available for intended git sync (partial).
- **Data protection:** Whole project stored as JSON in `prototype.code`; export contains all files.

## Prototype feedback

- **Description:** Star-rated feedback (need addressed / relevance / ease of use, 1–5, averaged) with description and interview metadata; add/delete own; pagination.
- **Who uses it / value:** Reviewers (give feedback); owners (improve prototypes).
- **Acceptance criteria:**
  - `GET /v2/feedbacks` (optional auth) → `200` paginated; `POST` (auth) → `201`; `PATCH/DELETE /:id` → `200`/`204` (own feedback).
  - UI tab `feedback` lists feedback, add via form, delete own only.
- **Quality control:** Add feedback → appears with averaged score; delete another user's feedback → not allowed; pagination works.
- **Security:** Add requires sign-in; delete limited to own.
- **Data protection:** Feedback stores `interviewee` (name/organization), scores, `ref`/`model_id`; no secrets.

## Project templates

- **Description:** Admin-managed scaffolds for starter projects (code + widget_config + customer_journey); predefined templates seeded on startup; case-insensitive unique name.
- **Who uses it / value:** Admins (standardize starters); authors (quick-start).
- **Acceptance criteria:**
  - `GET /v2/project-template[/:id]` (public) → list/get; `POST` → `201` (admin); `PUT/DELETE /:id` → `200`/`204` (admin). Also at `/v2/system/project-template`.
  - Seeded via `predefinedProjectTemplates.js` (never overwriting admin edits).
- **Quality control:** Admin creates a template → selectable when creating a prototype; pick it → project pre-populated.
- **Security:** Read public; write `MANAGE_USERS`.
- **Data protection:** Template data (code/widget_config/journey) stored; no secrets.