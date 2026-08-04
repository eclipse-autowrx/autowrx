# Prototypes & Code

The prototype workspace — where a model's prototypes are authored, run, and staged. Backend: `routes/v2/vehicle-data/prototype.route.js`, `models/prototype.model.js`. Frontend: `pages/{PagePrototypeLibrary,PagePrototypeDetail}.tsx`, `layouts/NewPrototypeLayout.tsx`.

## Prototypes

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| Prototype library | List/portfolio views of a model's prototypes; search/sort/filter; create new (inline dialog or `/new-prototype` page when `ENABLE_NEW_PROTOTYPE_PAGE`); import from ZIP. | pages `/model/:id/library[/:tab[/:prototype_id]]` | View optional (`PUBLIC_VIEWING`); create/import `WRITE_MODEL` |
| New prototype layout | Full-page create flow that previews the model's (or default template's) prototype shell behind the dialog. | page `/new-prototype` | Auth (redirects to `/` if signed out) |
| Prototype CRUD | Create/update/delete; bulk create; recent (cached) & popular lists; execute-code counter. | `GET/POST /v2/prototypes[/bulk]`, `GET /v2/prototypes/{recent,popular}`, `GET/PATCH/DELETE /v2/prototypes/:id`, `POST /v2/prototypes/:id/execute-code` | Read optional; recent auth; write `WRITE_MODEL`; private models `READ_MODEL` |

## Prototype workspace tabs

The detail page (`/model/:id/library/prototype/:prototype_id[/:tab]`) has built-in tabs plus custom plugin (addon) tabs and configurable right-nav action buttons.

| Tab | What it does | Gating |
|---|---|---|
| Overview (`view`) | Edit metadata (name, problem/says-who/solution, complexity, status, tags, image); export ZIP; delete; toggle Editor's Choice (admin). | Read `READ_MODEL`; edit/delete `WRITE_MODEL` |
| Customer Journey (`journey`) | Edit a customer-journey table. | Read `READ_MODEL`; edit `WRITE_MODEL` |
| Code (`code`) | Monaco editor with auto-save; resizable Vehicle API panel; SDV ProtoPilot GenAI launcher; code diff (`SHOW_CODE_DIFF`); multi-file Project Editor when code is a JSON project. | Edit `WRITE_MODEL`; API panel `SHOW_CODE_API_PANEL`; ProtoPilot `SHOW_SDV_PROTOPILOT_BUTTON` + `USE_GEN_AI` |
| Dashboard (`dashboard`) | Run/edit a widget dashboard; place widgets, edit options, sync signals; apply templates; fullscreen; save as template (admin). | Edit `READ_MODEL`; save-as-template admin |
| Feedback (`feedback`) | Star-rated feedback (need addressed / relevance / ease of use); add/delete own; pagination. | Add requires sign-in; delete own only |
| Staging (`staging`) | Staging-frame visualization (SDV Mock / Virtual Vehicle / Lab HW / Test Fleet), standard component tree, per-stage deploy-target plugin picker. Reads `STAGING_FRAME` + `STANDARD_STAGE`. | Auth + prototype must have code |
| Plug (`plug`) | A custom plugin addon tab, identified by `?plugid=<slug>`. | Depends on plugin + parent model perms |

## Project editor & feedback

| Feature | What it does | Key files | Gating |
|---|---|---|---|
| Project editor (multi-file) | File-tree editor: create/rename/delete files & folders, tabs, unsaved-change tracking, save-all, import/export ZIP, per-file Monaco. Activated when prototype code is a JSON project descriptor. | `components/molecules/project_editor/` | Edit `WRITE_MODEL` |
| Feedback (backend) | Structured feedback with scores + interview metadata. | `GET/POST /v2/feedbacks`, `PATCH/DELETE /v2/feedbacks/:id` | List optional; write auth |

> Runtime execution (Run/Stop, signals, terminal) on the Code/Dashboard tabs is covered in [dashboards-widgets-runtime.md](./dashboards-widgets-runtime.md).