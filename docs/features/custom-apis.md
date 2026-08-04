# Custom APIs

Admin-defined API schemas and per-model API sets (Tree / List / Graph) — formerly the "API Plugin System" (PluginAPI/PluginApiInstance; those names no longer exist). Backend: `routes/v2/system/custom-api-schema.route.js`, `routes/v2/vehicle-data/custom-api-set.route.js`, `models/{customApiSchema,customApiSet}.model.js`. Frontend: `components/organisms/CustomApi*.tsx`.

## Custom API Schemas

Admin-defined templates describing the structure of an API set.

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Schema CRUD | Define schemas (`type` tree/list/graph, `schema` JSON string, `id_format`, `relationships`, `tree_config`, `display_mapping`); used to validate sets. | `GET /v2/custom-api-schema[/:id]`, `POST/PATCH/DELETE /v2/custom-api-schema[/:id]` | Read public; write `MANAGE_USERS` (admin) |

Mounted at both `/v2/system/custom-api-schema` (frontend) and the bare `/v2/custom-api-schema`.

## Custom API Sets

Instances of a schema, attachable to a model (`model.custom_api_sets`).

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Set CRUD | Create/list/get/update/delete sets; `scope` system (public) / user (owner-only). | `GET/POST /v2/custom-api-sets`, `GET/PATCH/DELETE /v2/custom-api-sets/:id` | Read optional (`PUBLIC_VIEWING`); write auth + ownership |
| Item operations | Add / update / remove an item in a set (body `{ item: {…} }`). | `POST /v2/custom-api-sets/:id/items`, `PATCH/DELETE /v2/custom-api-sets/:id/items/:itemId` | Auth |
| Custom API view | View a set attached to a model (tabbed alongside COVESA). | pages `/model/:id/api/:instance_id` | Hidden when `DISABLE_CUSTOM_API_SETS`; add set `WRITE_MODEL` |
| Schema & set management (admin) | Admin CRUD for schemas + sets; import/export; attach sets to models. | page `/admin/plugins?section=vehicle-api-schema` / `vehicle-api` | `MANAGE_USERS`; hidden when `DISABLE_CUSTOM_API_SETS` |

> **Permission note:** the set routes apply plain `auth()` for writes — there is **no admin gate** for system-scope sets, so any authenticated user can create/update/delete a system-scoped set (only user-scope is owner-gated). Schemas, by contrast, are admin-only for writes.