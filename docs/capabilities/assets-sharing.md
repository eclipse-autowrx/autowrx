# Cluster: Assets & Sharing

User-owned resources (cloud runtimes, hardware kits, GenAI configs) and the sharing/collaboration layer. Backend: `routes/v2/user-management/asset.route.js`, `models/asset.model.js`. Frontend: `pages/PageMyAssets.tsx`, `components/organisms/RuntimeAssetManager.tsx`, `components/molecules/ShareAssetPanel.tsx`.

---

## User assets CRUD

- **Description:** Create/list/get/update/delete assets of types enabled by `USER_ASSET_TYPES` (default `CLOUD_RUNTIME`, `HARDWARE_KIT`, `GENAI-PYTHON`) with arbitrary `data`.
- **Who uses it / value:** End users (manage their runtimes/kits/GenAI configs); admins (oversight).
- **Acceptance criteria:**
  - `GET /v2/assets` (auth) → `200` the user's assets (+ shared with them); `POST` (auth) → `200` create; `GET /v2/assets/:id` (auth + `READ_ASSET`) → `200`; `PATCH` (auth + `WRITE_ASSET`) → `200` (empty body); `DELETE` (auth + `WRITE_ASSET`) → `200`.
  - Asset types restricted to `USER_ASSET_TYPES`.
- **Quality control:** Create a `CLOUD_RUNTIME` asset → appears in My Assets; edit → persists; delete → gone; access another user's asset without sharing → `403`.
- **Security:** All routes auth; get/update/delete gated by `READ_ASSET`/`WRITE_ASSET` permission on the asset; types gated by `USER_ASSET_TYPES`.
- **Data protection:** Asset `data` (arbitrary config — endpoint URLs, tokens, kit identity) stored in `assets` with `created_by`.

## Admin all-assets view

- **Description:** Admin view of all assets across users.
- **Who uses it / value:** Admins (oversight/support).
- **Acceptance criteria:**
  - `GET /v2/assets/manage` (auth + `MANAGE_USERS`) → `200` all assets.
- **Quality control:** As admin → see all assets; as non-admin → `403`.
- **Security:** `MANAGE_USERS` required.
- **Data protection:** Exposes all asset records to admins (incl. `data` which may hold tokens — admin-only).

## My Assets

- **Description:** UI page to manage the current user's assets; the `GENAI-PYTHON` asset editor configures a GenAI endpoint (method/URL/token/request/response fields).
- **Who uses it / value:** End users (manage assets); GenAI integrators (configure endpoints).
- **Acceptance criteria:**
  - Route `/my-assets` (auth) lists the user's assets; create/edit/delete/share; `GENAI-PYTHON` editor captures endpoint config.
- **Quality control:** Open `/my-assets` → your assets listed; configure a GenAI asset → its endpoint used by GenAI flows.
- **Security:** Auth required.
- **Data protection:** `GENAI-PYTHON` asset `data` may hold an auth token — stored in asset `data` (not encrypted at rest; access `READ_ASSET`/`WRITE_ASSET` gated).

## Asset sharing

- **Description:** Share an asset with users (by email lookup) with read/write roles; remove access.
- **Who uses it / value:** Asset owners (delegate runtime/kit access); collaborators (gain access).
- **Acceptance criteria:**
  - `POST /v2/assets/:id/permissions {userId, role}` (auth + `WRITE_ASSET`) → `201` (role enum `read_asset`/`write_asset`); `DELETE /v2/assets/:id/permissions?userId=&role=` (auth + `WRITE_ASSET`) → `204`.
  - Shared users see the asset in their list.
- **Quality control:** Share with a user (by email) → they see the asset and can use it (read_asset) / modify (write_asset); remove → access revoked.
- **Security:** Both ops require `WRITE_ASSET` on the asset. Roles are `read_asset`/`write_asset`.
- **Data protection:** Creates/removes authorized-user bindings on the asset; no secrets duplicated.

## Model contributors

- **Description:** Add/remove contributors on a model; contributors see the model under "My Contributions" and gain edit access (with `writeModel`).
- **Who uses it / value:** Model owners (delegate); contributors (gain access).
- **Acceptance criteria:**
  - `POST /v2/models/:id/permissions` (requires `WRITE_MODEL`) → `201`; `DELETE /v2/models/:id/permissions?userId=&role=` (requires `WRITE_MODEL`) → `204`.
- **Quality control:** Add a contributor → model appears in their "My Contributions"; remove → gone.
- **Security:** Requires `WRITE_MODEL` on the model.
- **Data protection:** UserRole bindings scoped to the model.

## Access invitation

- **Description:** Reusable dialog to invite users to an object with selectable access levels; remove user access.
- **Who uses it / value:** Object owners (invite collaborators).
- **Acceptance criteria:**
  - `AccessInvitation` dialog used by model/asset sharing flows; pick access level; remove a user's access.
- **Quality control:** Invite a user by email with an access level → they gain that access; remove → revoked.
- **Security:** Invoker must be the object owner / authorized.
- **Data protection:** Driven by the underlying permission endpoints (no separate data store).

## User lookup by email

- **Description:** Find a user by exact email (id/name/image) for sharing/collaborator flows.
- **Who uses it / value:** Anyone sharing (find recipients).
- **Acceptance criteria:**
  - `GET /v2/search/email/:email` (optional auth via `PUBLIC_VIEWING`) → `200` user or `404` if not found.
- **Quality control:** Search an existing email → returns the user; a non-existent email → `404`.
- **Security:** Optional auth via `PUBLIC_VIEWING`; returns minimal fields (id/name/image) — no email exposure beyond the queried one.
- **Data protection:** Returns minimal profile fields; not an enumeration endpoint (exact email required).