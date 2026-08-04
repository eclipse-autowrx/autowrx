# Assets & Sharing

User-owned assets (cloud runtimes, hardware kits, GenAI configs) and the sharing/collaboration layer. Backend: `routes/v2/user-management/asset.route.js`, `models/asset.model.js`. Frontend: `pages/PageMyAssets.tsx`, `components/organisms/RuntimeAssetManager.tsx`.

## User assets

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| Asset CRUD | Create/list/get/update/delete assets of types enabled by `USER_ASSET_TYPES` (default `CLOUD_RUNTIME`, `HARDWARE_KIT`, `GENAI-PYTHON`) with arbitrary `data`. | `GET/POST /v2/assets`, `GET/PATCH/DELETE /v2/assets/:id` | Auth; get/update/delete gated by `READ_ASSET`/`WRITE_ASSET` |
| Admin asset view | List all assets. | `GET /v2/assets/manage` | `MANAGE_USERS` |
| My Assets | Manage your assets; GENAI-PYTHON asset editor configures a GenAI endpoint (method/URL/token/request/response). | page `/my-assets` | Auth |
| Asset access tokens | JWT bound to an Asset (no refresh token) for external/runtime clients. | `POST /v2/assets/:id/generate-token` | Auth + `READ_ASSET` |

## Sharing & collaborators

| Feature | What it does | Key endpoints / files | Gating |
|---|---|---|---|
| Asset sharing | Share an asset with users (by email lookup) with read/write roles; remove access. | `POST/DELETE /v2/assets/:id/permissions` (201 / 204; DELETE uses query `userId`+`role` enum `read_asset`/`write_asset`) | `WRITE_ASSET` |
| Model contributors | Add/remove contributors on a model. | `DaContributorList.tsx`, `POST/DELETE /v2/models/:id/permissions` | `WRITE_MODEL` |
| Access invitation | Reusable dialog to invite users to an object with access levels. | `AccessInvitation.tsx` | Object owner / authorized |
| User lookup by email | Find a user by exact email (for sharing flows). | `GET /v2/search/email/:email` | Optional (`PUBLIC_VIEWING`) |