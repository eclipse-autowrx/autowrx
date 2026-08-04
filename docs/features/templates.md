# Templates

Admin-managed scaffolds for creating models, dashboards, and projects. Backend: `routes/v2/system/{modelTemplate,dashboardTemplate,projectTemplate}.route.js`, `models/{modelTemplate,dashboardTemplate,projectTemplate}.model.js`. All: read public, write `MANAGE_USERS`.

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| Model templates | Preset `custom_template` (model tabs / prototype tabs / sidebar) for creating models; a single `default` template. | `GET/POST /v2/model-template[/:id]`, `PUT/DELETE /v2/model-template/:id`; page `/admin/templates` | Read public; write `MANAGE_USERS` |
| Dashboard templates | Named `widget_config` presets for dashboards; a single `is_default` template; public/private visibility. | `GET/POST /v2/dashboard-template[/:id]`, `PUT/DELETE /v2/dashboard-template/:id`; page `/admin/dashboard-templates` | Read public; write `MANAGE_USERS` |
| Project templates | Project scaffolding data (e.g. default SDV Python app: code + widget_config + customer_journey); predefined templates seeded on startup; case-insensitive unique name. | `GET/POST /v2/project-template[/:id]`, `PUT/DELETE /v2/project-template/:id`; page `/admin/project-templates` | Read public; write `MANAGE_USERS` |

> Templates are also mounted at the compat paths `/v2/system/{model,dashboard,project}-template`. Project templates seed the prototype create flow; dashboard templates auto-apply on the Dashboard tab; model templates seed the model layout and the "Save as Template" action (admin).