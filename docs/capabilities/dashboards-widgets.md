# Cluster: Dashboards & Widgets

Visual run-time dashboards of widget iframes fed runtime signal values. Frontend: `components/molecules/dashboard/`. Backend: builtin-widget static hosting + dashboard template routes.

---

## Dashboard renderer

- **Description:** Renders a prototype's widget dashboard: widget iframes fed runtime signal values from the connected runtime; supports fullscreen mode and notifies widget iframes of run/stop.
- **Who uses it / value:** End users (visualize prototype behavior); demo audiences.
- **Acceptance criteria:**
  - Renders `widget_config` widgets; signals flow from `runtimeStore` to widget iframes via postMessage/runtime values; run/stop events broadcast to widgets.
  - Fullscreen toolbar (logo + branding from site config).
- **Quality control:** Run a prototype with a dashboard → widgets render and update as signals change; toggle fullscreen → immersive view; stop → widgets reflect stopped state.
- **Security:** Read `READ_MODEL`. Widgets are third-party iframes — same-origin policy depends on the widget URL.
- **Data protection:** `widget_config` (widget definitions/options) stored in `prototype.widget_config`; signal values are runtime/transient.

## Dashboard editor

- **Description:** Visual 5×2 grid editor: place/move/edit/delete widgets; add from Built-in / Marketplace / by URL; edit options (JSON), boxes, URL/path; "used signals" helper; open in Web Studio; auto-applies the default dashboard template.
- **Who uses it / value:** Prototype authors (compose dashboards).
- **Acceptance criteria:**
  - Edit requires `READ_MODEL`; auto-applies the default dashboard template on first open.
  - Add widget from Built-in / Marketplace / URL; edit options/boxes; move/delete on the grid; "Save as Template" requires admin.
- **Quality control:** Add a builtin widget → renders on the grid; edit options → widget reflects them; save-as-template (admin) → appears in dashboard templates.
- **Security:** Edit `READ_MODEL`; save-as-template admin. Marketplace widgets from `DEFAULT_MARKETPLACE_URL` (third-party).
- **Data protection:** Widget config (URLs/options) stored in `prototype.widget_config`; options may reference runtime signals.

## Widget sources (Built-in / Marketplace / URL)

- **Description:** Three sources to add widgets: Built-in library (`data/builtinWidgets.ts`), Marketplace (`useListMarketplaceWidgets` from `DEFAULT_MARKETPLACE_URL`), and by direct URL.
- **Who uses it / value:** Authors (pick widgets); marketplace providers (distribute widgets).
- **Acceptance criteria:**
  - Built-in widgets render from `data/builtinWidgets.ts`; marketplace widgets fetched from `DEFAULT_MARKETPLACE_URL`; URL widgets load from the given URL.
- **Quality control:** Add a builtin widget → renders; browse marketplace → list loads (if URL configured); add by URL → loads.
- **Security:** Marketplace/URL widgets are remote third-party content — render in iframes; verify URLs are trusted.
- **Data protection:** No PII; widget URLs/options stored in widget config.

## Builtin widgets hosting

- **Description:** Prebuilt widget bundles (3d-car, chart-signals, image-by-api-value, signal-list-settable with vss.json, simple-fan, simple-wiper, single-api, terminal) plus shared libs (chart.min.js, tailwind/font-awesome, syncer.js), served from `/builtin-widgets`.
- **Who uses it / value:** Authors (ready-made widgets); end users (visualizations).
- **Acceptance criteria:**
  - Static `GET /builtin-widgets/...` serves the bundles; the editor's Built-in tab lists them.
- **Quality control:** Request a builtin widget asset → served with correct MIME; add one to a dashboard → renders.
- **Security:** Public static; no auth.
- **Data protection:** Static assets only.

## Dashboard templates

- **Description:** Named `widget_config` presets with a single `is_default` template and public/private visibility; admin CRUD.
- **Who uses it / value:** Admins (standardize dashboards); authors (quick-start).
- **Acceptance criteria:**
  - `GET /v2/dashboard-template[/:id]` (public) → list/get; `POST` → `201` (admin); `PUT/DELETE /:id` → `200`/`204` (admin). Also at `/v2/system/dashboard-template`.
  - The default template auto-applies on dashboard open.
- **Quality control:** Admin creates a template → appears in the manager; it auto-applies on new dashboards.
- **Security:** Read public; write `MANAGE_USERS`.
- **Data protection:** Template `widget_config` stored; no secrets.

## Widget ProtoPilot (GenAI widgets) — roadmap

- **Description:** GenAI-based widget generation from a prompt.
- **Who uses it / value:** Authors (generate widgets without coding).
- **Acceptance criteria:**
  - Currently a placeholder ("coming soon") in the widget library UI — not implemented.
- **Quality control:** N/A (not functional).
- **Security:** N/A.
- **Data protection:** N/A.