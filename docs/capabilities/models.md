# Cluster: Models

The vehicle-model domain and its layout. Backend: `routes/v2/vehicle-data/model.route.js`, `models/model.model.js`. Frontend: `pages/{PageModelList,PageModelDetail}.tsx`, `layouts/ModelDetailLayout.tsx`.

```mermaid
flowchart TD
    subgraph Lifecycle
        A["List / discover<br/>(My Models · Contributions · Public)"] --> B["Create / Import ZIP"]
        B --> C["Detail / edit<br/>(visibility · state · props)"]
        C --> D["Tabs & addons<br/>(custom layout)"]
        C --> E["Contributors & permissions"]
        C --> F["Export ZIP / VSS JSON"]
        C --> G["Delete"]
    end
    H["Admin: Model Templates"] -.->|layout scaffold| B
    I["Model stats"] -.->|counts by id| A
    J[("models collection")]
    B --> J
    C --> J
    E -->|UserRole binding| J
    style J fill:#fef3c7
```

---

## Capabilities in this cluster

| ID | Capability |
|----|------------|
| [CAP-MODEL-01](#cap-model-01--model-list--create--import) | Model list / create / import |
| [CAP-MODEL-02](#cap-model-02--model-detail--edit) | Model detail / edit |
| [CAP-MODEL-03](#cap-model-03--model-tabs--addons) | Model tabs & addons |
| [CAP-MODEL-04](#cap-model-04--model-contributors--permissions) | Model contributors & permissions |
| [CAP-MODEL-05](#cap-model-05--model-stats) | Model stats |
| [CAP-MODEL-06](#cap-model-06--model-templates) | Model templates |


## CAP-MODEL-01 — Model list / create / import

### Description

Browse models in three sections (My Models, My Contributions, Public); create a model; import a model from a ZIP archive.

### Who uses it / value

End users (discover models); model owners (create/import); the wider community (public discovery when `PUBLIC_VIEWING`).

### Acceptance criteria

- `GET /v2/models` (optional auth via `PUBLIC_VIEWING`) → `200` paginated list with query filters (`name`, `visibility`, `state`, `tenant_id`, `vehicle_category`, `main_api`, `id`, `created_by`, `is_contributor`, `include_stats`, `sortBy`, `page`, `limit`, `fields`).
- `GET /v2/models/all` → expanded/unpaginated aggregation of owned + contributed + public-released models (optional auth via `PUBLIC_VIEWING`; owned/contributed only populated for authenticated users).
- `POST /v2/models` (auth) → `201` new model. `POST /v2/models/stats` (optional auth) → `200 { statsById: { [modelId]: {...} } }` for the body `ids`.
- Import from ZIP (`zipUtils.ts`) creates a model from the archive contents.
- Signed-out with `PUBLIC_VIEWING=false` → `401` on list.

### Quality control

Create a model → appears in "My Models"; import a valid model ZIP → model created; sign out + `PUBLIC_VIEWING=true` → public models listed; `PUBLIC_VIEWING=false` → `401`.

```mermaid
flowchart LR
    U([User]) -->|"GET /v2/models"| L{PUBLIC_VIEWING?}
    L -->|true + anon| PUB["Public section"]
    L -->|false + anon| N1["401"]
    L -->|authed| ALL["My Models · Contributions · Public"]
    U -->|"POST /v2/models"| C["Create (auth)"]
    U -->|"import .zip"| Z["zipUtils → model"]
```

### Security

Read optional via `PUBLIC_VIEWING`; create requires auth. Filters don't leak private models (server filters by access).

**Coverage:**
- **Auth:** Read optional via `PUBLIC_VIEWING`; create requires auth (JWT access token).
- **Authorization:** List — server-side access scoping in `queryModels` (public + owned + role-permissioned); create — any authenticated user (becomes owner); 3-model cap for non-admins without `UNLIMITED_MODEL`. No `checkPermission` on create.
- **Input validation:** Joi (`modelValidation.createModel`/`listModels`/`listAllModels`).
- **Rate limiting:** not applied (`authLimiter` defined in `rateLimiter.js` but unused on every route).
- **Secrets:** none (no credentials in model metadata).

**Risks:**
- **Private-model enumeration:** without server-side access scoping, a signed-out or cross-tenant user could enumerate private models through list filters, leaking proprietary vehicle data and model IP.
- **Anonymous model creation:** a missing auth check on `POST` would let anonymous users spawn models inside any tenant, polluting namespaces and consuming storage.

### Data protection

Model metadata (name, description, visibility, state, images, tags) stored in `models`; images uploaded via the file service.

**Coverage:**
- **Stored data:** `models` collection (name, description, visibility, state, images, tags, `created_by`, `custom_template`, `custom_api_sets`).
- **PII:** no (model metadata is not personal; `created_by` is a user ref, email not stored on the model).
- **Retention:** indefinite until hard delete (no soft-delete, no TTL).
- **Encryption:** bcrypt for user passwords (separate collection); TLS in transit; model data not encrypted at rest beyond Mongo defaults.
- **Logging:** request logs via `logger`; no sensitive data logged (model metadata only).

**Risks:**
- **Visibility misconfiguration:** an over-broad `WRITE_MODEL` grant or a wrong default could expose private models publicly.
- **Irreversible deletion:** deleted models are hard-removed (no soft-delete), so accidental or malicious deletion is permanent user-data loss.

### Test coverage
- **E2E (Playwright):** 4 test case(s) in `vehicle-models.spec.ts` — SITEMAP: ✅
- **Unit (Jest):** none

## CAP-MODEL-02 — Model detail / edit

### Description

View/edit a model's name, home image, vehicle properties, visibility (public/private), state (draft/released/blocked), contributors; export the model as ZIP; download the computed VSS JSON; delete.

### Who uses it / value

Model owners (maintain models); contributors (collaborate); consumers (export/download).

### Acceptance criteria

- `GET /v2/models/:id` (optional auth) → `200` model (authorized users get `contributors`/`members` injected). `PATCH /v2/models/:id` → `200` (requires `WRITE_MODEL`). `DELETE /v2/models/:id` → `204` (requires `WRITE_MODEL`).
- Export ZIP / download computed VSS from the UI actions.
- No `WRITE_MODEL` → `403` on edit/delete.

### Quality control

Edit visibility to private → signed-out users can't see it; change state to released → appears publicly; export → valid ZIP; delete → gone from list.

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> released: owner releases
    released --> blocked: admin blocks
    blocked --> released: admin unblocks
    draft --> blocked: admin blocks
    released --> [*]: delete
    draft --> [*]: delete
    note right of released
      visibility: public | private
    end note
```

### Security

Read `READ_MODEL`; write `WRITE_MODEL` (owner/admin/contributor). Owners bypass.

**Coverage:**
- **Auth:** Read optional via `PUBLIC_VIEWING`; `PATCH`/`DELETE` require auth (JWT access token).
- **Authorization:** Private-model read enforced by `getModelById` (`READ_MODEL`, owner bypass); `PATCH`/`DELETE` gated by `checkPermission(WRITE_MODEL)` (owner bypass).
- **Input validation:** Joi (`modelValidation.getModel`/`updateModel`/`deleteModel`).
- **Rate limiting:** not applied (`authLimiter` defined but unused).
- **Secrets:** none (no credentials on the model document).

**Risks:**
- **Unauthorized state/visibility flip:** a broken `WRITE_MODEL` check would let any user flip a private model to `public`/`released`, exposing it.
- **Unauthorized delete:** missing checks would let a non-owner delete others' models — irreversible data loss.
- **Export exfiltration:** export bundles the model's prototype code/data, so a leaked edit token widens what an attacker can steal.

### Data protection

Visibility controls exposure; deleted models removed from the collection (no soft-delete). Export includes prototype code/data.

**Coverage:**
- **Stored data:** `models` collection (visibility, state, props, `custom_template`); export bundles the model's prototype code/data.
- **PII:** no — contributor/member emails are masked via `maskUserEmail` in the `getModel` response when the caller has `WRITE_MODEL`.
- **Retention:** hard delete (no soft-delete, no snapshot); export data persists as long as the model exists.
- **Encryption:** bcrypt for user passwords (separate); TLS in transit; model data not encrypted at rest beyond Mongo defaults.
- **Logging:** request logs; template-fetch warnings logged; no sensitive data.

**Risks:**
- **Public exposure of embedded data:** flipping visibility to public exposes the model and its embedded prototype code/data to everyone — including data the owner believed was private.
- **Permanent destruction:** hard-delete means a compromised or malicious contributor can permanently destroy model data with no recovery trail.

### Test coverage
- **E2E (Playwright):** 4 test case(s) in `vehicle-models.spec.ts` — SITEMAP: ⚠️
- **Unit (Jest):** none

## CAP-MODEL-03 — Model tabs & addons

### Description

Tabbed model layout (Overview / Prototype Library / Vehicle API + custom plugin tabs); owners add/reorder/hide tabs, set variant, configure a sidebar plugin and right-nav buttons; save the layout as a Model Template.

### Who uses it / value

Model owners (customize the workspace); end users (tailored model views); admins (define reusable layouts).

### Acceptance criteria

- Tab configuration stored on `model.custom_template` (`model_tabs`, `prototype_tabs`, `prototype_sidebar_plugin`, `prototype_right_nav_buttons`).
- Addon/tab management requires `WRITE_MODEL` + `ALLOW_NON_ADMIN_ADDON_CONFIG` (admins always allowed).
- "Save as Template" (admin) stores the layout as a Model Template.

### Quality control

Add a plugin addon tab → it renders via `PluginPageRender`; reorder/hide tabs → layout persists; as non-admin with `ALLOW_NON_ADMIN_ADDON_CONFIG=false` → addon config blocked.

```mermaid
flowchart TD
    O([Model owner]) -->|configure tabs| T["model.custom_template"]
    T --> Tabs["model_tabs · prototype_tabs"]
    T --> Side["prototype_sidebar_plugin"]
    T --> Nav["prototype_right_nav_buttons"]
    Tabs -->|renders| PR["PluginPageRender (unsandboxed)"]
    O -->|"Save as Template"| MT["Model Template (admin)"]
```

### Security

Tab management gated by `WRITE_MODEL` + the addon-config flag. Plugins run unsandboxed (see [plugins.md](./plugins.md)).

**Coverage:**
- **Auth:** Write requires auth (JWT); reads optional via `PUBLIC_VIEWING`.
- **Authorization:** `WRITE_MODEL` (owner bypass) + `ALLOW_NON_ADMIN_ADDON_CONFIG` flag (admins always allowed).
- **Input validation:** Joi `updateModel` — `custom_template` is `Joi.any()` (shape not strictly validated).
- **Rate limiting:** not applied (`authLimiter` defined but unused).
- **Secrets:** none.

**Risks:**
- **Malicious tab injection:** a plugin addon tab embeds arbitrary code running unsandboxed in visitors' browsers. If the `ALLOW_NON_ADMIN_ADDON_CONFIG` gate were bypassed, a non-admin could inject a hostile tab into every visitor's view (XSS / token theft).
- **Plugin supply chain:** a tab config references plugin IDs; a compromised or rogue plugin becomes an attack surface for all models using that layout.

### Data protection

Layout config stored on the model document; no secrets.

**Coverage:**
- **Stored data:** `model.custom_template` (`model_tabs`, `prototype_tabs`, `prototype_sidebar_plugin`, `prototype_right_nav_buttons`) on the model doc.
- **PII:** no.
- **Retention:** follows the model (hard-deleted with it).
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.

**Risks:**
- **Untrusted-code distribution:** the tab config is a persistence channel — a malicious layout can repeatedly steer users toward running untrusted plugins until it is noticed and removed.

### Test coverage
- **E2E (Playwright):** 2 test case(s) in `plugin-management.spec.ts` — SITEMAP: ✅
- **Unit (Jest):** none

## CAP-MODEL-04 — Model contributors & permissions

### Description

Add/remove authorized users (contributors/members) on a model; the model appears in their "My Contributions".

### Who uses it / value

Model owners (delegate editing); contributors (gain access).

### Acceptance criteria

- `POST /v2/models/:id/permissions {userId, role}` (requires `WRITE_MODEL`) → `201` adds authorized user.
- `DELETE /v2/models/:id/permissions?userId=&role=` (requires `WRITE_MODEL`) → `204` removes.

### Quality control

Add a contributor → they see the model under "My Contributions" and can edit (if `writeModel`); remove → access revoked.

```mermaid
sequenceDiagram
    participant U as Owner
    participant API as /v2/models/:id/permissions
    participant DB as UserRole binding
    U->>API: POST {userId, role}
    API->>API: check WRITE_MODEL
    API->>DB: create binding (model ref)
    API-->>U: 201
    Note over DB: model appears in user's "My Contributions"
    U->>API: DELETE ?userId=&role=
    API->>DB: remove binding
    API-->>U: 204
```

### Security

Both operations require `WRITE_MODEL` on the model. Owners bypass.

**Coverage:**
- **Auth:** required (JWT access token).
- **Authorization:** `checkPermission(WRITE_MODEL)` at the route; `addAuthorizedUser` re-checks `WRITE_MODEL` in the service (owner bypass).
- **Input validation:** Joi (`addAuthorizedUser`: `userId` required, `role` ∈ {`model_contributor`,`model_member`}; `deleteAuthorizedUser`: `userId`/`role` query).
- **Rate limiting:** not applied (`authLimiter` defined but unused).
- **Secrets:** none.

**Risks:**
- **Privilege escalation:** a missing `WRITE_MODEL` check would let any user grant themselves or others write access to private models — escalation to data theft or tampering.

### Data protection

Creates/removes UserRole bindings scoped to the model `ref`.

**Coverage:**
- **Stored data:** `userroles` collection (`user`, `role`, `ref` = model id).
- **PII:** yes — contributor/member user identities (user ↔ model relationship); `getModel` masks emails via `maskUserEmail`, but bindings reveal who collaborates on which model.
- **Retention:** bindings persist until explicitly revoked (hard delete); no TTL, no audit trail of permission changes.
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.

**Risks:**
- **Relationship leak:** contributor bindings reveal who collaborates on which model (users ↔ business assets).
- **Persistence of mis-grants:** a leaked grant persists until manually revoked; with no audit trail of permission changes, mis-grants are hard to detect after the fact.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Unit (Jest):** none

## CAP-MODEL-05 — Model stats

### Description

Aggregated stats (e.g. prototype counts) by model IDs, cached per request.

### Who uses it / value

End users (model badges/counts); owners (overview).

### Acceptance criteria

- `POST /v2/models/stats {ids:[...]}` (optional auth via `PUBLIC_VIEWING`) → `200 { statsById: { [modelId]: {...} } }`; empty/missing → `{ statsById: {} }`.

### Quality control

Request stats for a few model IDs → counts returned; request none → empty map.

### Security

Optional auth; respects access scoping.

**Coverage:**
- **Auth:** optional via `PUBLIC_VIEWING`.
- **Authorization:** access-scoped — anonymous gets only public models; authenticated users filtered to readable ids via `permissionService.listReadableModelIds` (returns `*` for global read).
- **Input validation:** Joi `listModelStats` (`ids`: array of objectId, min 1).
- **Rate limiting:** not applied (`authLimiter` defined but unused).
- **Secrets:** none.

**Risks:**
- **Metadata enumeration:** if the aggregation didn't respect access scoping, an attacker could probe arbitrary model IDs to confirm the existence and size of private models even when the list endpoint is locked down.

### Data protection

Aggregated only; no PII.

**Coverage:**
- **Stored data:** none — counts computed on demand and cached per request (`getModelStatsSummaryByIds`).
- **PII:** no (aggregated counts only).
- **Retention:** N/A (not persisted).
- **Encryption:** N/A (no stored data); TLS in transit.
- **Logging:** request logs; no sensitive data.

**Risks:**
- **Existence/scale inference:** counts alone reveal the existence and scale of models; combined with a listing gap this could confirm private assets.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Unit (Jest):** none

## CAP-MODEL-06 — Model templates

### Description

Admin-managed scaffolds for model layouts (`custom_template`), with a single `default` template; seeded/managed via the templates admin page.

### Who uses it / value

Admins (standardize layouts); model creators (quick-start from a template).

### Acceptance criteria

- `GET /v2/model-template[/:id]` (public) → list/get; `POST /v2/model-template` → `201` (admin); `PUT/DELETE /v2/model-template/:id` → `200`/`204` (admin). Also at `/v2/system/model-template`.

### Quality control

Admin creates a template → it appears in the model-template manager; select it when creating a model → layout applied.

```mermaid
flowchart LR
    A([Admin]) -->|POST/PUT| T["model-template (default)"]
    C([Creator]) -->|"new model from template"| M["model.custom_template"]
    T -.->|layout applied| M
    T -.->|references| P["plugin IDs"]
```

### Security

Read public; write requires `MANAGE_USERS`.

**Coverage:**
- **Auth:** Read public (no auth); write requires auth (JWT access token).
- **Authorization:** Write gated by `checkPermission(PERMISSIONS.ADMIN)` = `manageUsers` (admin only); reads public.
- **Input validation:** Joi (`modelTemplateValidation.list`/`get`/`create`/`update`/`remove`).
- **Rate limiting:** not applied (`authLimiter` defined but unused).
- **Secrets:** none.

**Risks:**
- **Platform-wide payload:** templates apply to every model created from them. A compromised admin could seed a default template embedding a malicious plugin tab, pushing untrusted code to all future models.

### Data protection

Template config (tabs/prototype tabs/sidebar) stored; no secrets.

**Coverage:**
- **Stored data:** `modeltemplates` collection (config layout, referenced plugin IDs, `created_by`, `updated_by`).
- **PII:** no.
- **Retention:** indefinite until hard delete (no soft-delete, no TTL).
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.

**Risks:**
- **Persistent distribution channel:** a malicious template propagates its layout and referenced plugins to all derived models until an admin notices and removes it.

### Test coverage
- **E2E (Playwright):** 1 test case(s) in `admin-extended.spec.ts` — SITEMAP: ✅
- **Unit (Jest):** none