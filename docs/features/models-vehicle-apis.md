# Models & Vehicle APIs

The vehicle-data domain: models, their computed VSS/COVESA APIs, and per-model API extensions. Backend: `routes/v2/vehicle-data/{model,api,extendedApi}.route.js`, `models/{model,api,extendedApi}.model.js`. Frontend: `pages/{PageModelList,PageModelDetail,PageVehicleApi}.tsx`.

## Models

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| Model list | Browse models in three sections — My Models, My Contributions, Public; create/import (ZIP) models. | `GET /v2/models`, `GET /v2/models/all`, page `/model` | Optional (`PUBLIC_VIEWING`); create/import require auth + `WRITE_MODEL` |
| Model detail | Edit name/image/visibility/state/contributors; export ZIP; download computed VSS; delete. | `GET/PATCH/DELETE /v2/models/:id`, page `/model/:id` | Read `READ_MODEL`; edit/delete `WRITE_MODEL` |
| Model tabs & addons | Tabbed model layout (Overview / Prototype Library / Vehicle API + custom plugin tabs); owners add/reorder addon tabs; save layout as a Model Template. | `ModelDetailLayout`, `CustomTabEditor`, `AddonSelect` | Tab management `WRITE_MODEL` + `ALLOW_NON_ADMIN_ADDON_CONFIG` |
| Model permissions | Add/remove authorized users on a model. | `POST/DELETE /v2/models/:id/permissions` (201 / 204, query params) | `WRITE_MODEL` |
| Model stats | Stats summary (prototype counts, etc.) by IDs. | `POST /v2/models/stats` (body `{ ids: [...] }`) | Optional (`PUBLIC_VIEWING`) |

## Vehicle APIs (VSS / COVESA)

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| VSS versions & trees | Lists VSS versions from `backend/data/*.json`; serves a version's CVI tree (also static at `/vss/:version/:filename`). | `GET /v2/apis/vss`, `GET /v2/apis/vss/:name` | Public |
| Per-model API CRUD | `Api` documents holding a model's computed VSS; merge of VSS + extended APIs. | `POST/GET/PATCH/DELETE /v2/apis[/:id]`, `GET /v2/apis/model_id/:modelId` | Read optional; write auth |
| Computed model API | The merged VSS+ExtendedApi tree for a model; replace all APIs from a VSS spec URL. | `GET /v2/models/:id/api[/:apiName]`, `POST /v2/models/:id/replace-api` | Read optional; replace `WRITE_MODEL` |
| Vehicle API view | List / Tree / Hierarchical / Compare(VSS comparator) views; download VSS; upload/replace VSS; switch VSS version. | pages `/model/:id/api`, `/model/:id/api/covesa/:api` | View optional; replace `WRITE_MODEL` |

## Extended APIs (wishlist signals)

Custom per-model signals layered on top of the VSS tree; merged into the computed API.

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Extended API CRUD | Create/list/get/update/delete custom signals; unique per `(apiName, model)`. | `GET/POST /v2/extendedApis`, `GET /v2/extendedApis/by-api-and-model`, `GET/PATCH/DELETE /v2/extendedApis/:id` | Read optional; write auth (caller must have model access) |

> `GET /v2/extendedApis` and `/by-api-and-model` require a `model` query param (the latter also `apiName`); the caller must have access to the model.