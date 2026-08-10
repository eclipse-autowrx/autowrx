# Cluster: Vehicle APIs

Browse, define, and manage the signal/API layer for a model — VSS/COVESA signals, extended (wishlist) signals, and admin-defined Custom APIs — so that dashboards, prototypes, and downstream integrations have signals to consume.

**Implementation:** `routes/v2/vehicle-data/{api,extendedApi,custom-api-set}.route.js`, `routes/v2/system/custom-api-schema.route.js`, `models/{api,extendedApi,customApiSchema,customApiSet}.model.js` (backend); `pages/PageVehicleApi.tsx`, `components/organisms/{ViewApiCovesa,CustomApi*}.tsx` (frontend).

```mermaid
flowchart TD
    VSS["VSS catalog<br/>(backend/data/*.json)"] --> V["VSS versions & CVI trees"]
    V --> M["Per-model VSS/COVESA API"]
    M --> COMP["Computed CVI<br/>(VSS + extended merged)"]
    EXT["Extended APIs<br/>(wishlist signals)"] --> COMP
    M -.->|"replace from URL"| REP["Replace APIs from VSS spec"]
    UI["Vehicle API view<br/>(List/Tree/Hierarchical/Compare)"] --> COMP
    SCH["Custom API schemas<br/>(admin templates)"] --> SETS["Custom API sets<br/>(per-model instances)"]
    SETS -.->|attach to| MODEL["model.custom_api_sets"]
    COMP --> UI
    style VSS fill:#fef3c7
    style COMP fill:#dbeafe
    style SCH fill:#fef3c7
    style SETS fill:#dcfce7
```

---

## Capabilities in this cluster

| ID | Capability |
|----|------------|
| [CAP-VAPI-01](#cap-vapi-01--vss-versions--cvi-trees) | VSS versions & CVI trees |
| [CAP-VAPI-02](#cap-vapi-02--per-model-vsscovesa-api-crud--computed-tree) | Per-model VSS/COVESA API CRUD + computed tree |
| [CAP-VAPI-03](#cap-vapi-03--replace-apis-from-a-vss-spec) | Replace APIs from a VSS spec |
| [CAP-VAPI-04](#cap-vapi-04--vehicle-api-view-list--tree--hierarchical--compare) | Vehicle API view (List / Tree / Hierarchical / Compare) |
| [CAP-VAPI-05](#cap-vapi-05--extended-apis-wishlist-signals) | Extended APIs (wishlist signals) |
| [CAP-VAPI-06](#cap-vapi-06--custom-api-schemas) | Custom API schemas |
| [CAP-VAPI-07](#cap-vapi-07--custom-api-sets) | Custom API sets |


## CAP-VAPI-01 — VSS versions & CVI trees

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| integrator | Vehicle API view (`/model/:id/api`) | ❌ No | ❌ 0 cases, ≈0% (est.) |

### Description

As an end user or integrator, I can list the available VSS (Vehicle Signal Specification) versions and fetch a version's computed CVI (Computed Vehicle Interface) tree so that I can browse the canonical signal catalog and pick a version to build against.

### Who uses it / value

End users (browse signals); integrators (pick a VSS version); the platform (canonical signal catalog).

### Acceptance criteria

- When an **integrator** browses the VSS catalog at the Vehicle API view (`/model/:id/api`), they see a non-empty list of available versions.
- When an **integrator** selects a version at the Vehicle API view (`/model/:id/api`), they get its computed CVI tree.
- When an **integrator** fetches a static VSS file for a version, they get the raw JSON back.
- These are available to a **guest** without signing in.

### API contract

- `GET /v2/apis/vss` → `200` a list of versions (e.g. `['4.0','3.1.1',…]`).
- `GET /v2/apis/vss/:name` → `200` that version's CVI tree.
- Static `GET /vss/:version/:filename` → serves the raw JSON (1-hour cache; RC→rc normalization).

### Quality control

When I list versions, I get a non-empty list; when I fetch a version's tree, I get the CVI object; when I fetch the static `/vss/<version>/<file>`, I get JSON back.

### Security

Public — anyone can call these without signing in.

**Coverage:**
- **Auth:** public (no auth) — anonymous.
- **Authorization:** none (public endpoints; no resource checks).
- **Input validation:** for `/vss/:name` I must send a `name` (required string); for the static `/vss/:version/:filename` the `version` must match `^v\d+\.` (with RC→rc normalization), and `filename` is not used to resolve the file — so path traversal via `filename` is not possible.
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none.

**Risks:**
- **Path-traversal in static serving:** the static `GET /vss/:version/:filename` handler maps URL segments to files under `backend/data/`; a weak normalization/caching path could be abused to read arbitrary JSON files from the server if segment sanitization misses encoded or `..` paths. *Mitigation:* `version` is validated against `^v\d+\.` and `filename` is not used to resolve the file (RC→rc normalization applied); keep the segment validation on the route and add a test for encoded/`..` inputs.
- **Catalog exposure:** the unauthenticated version list discloses every VSS version the platform supports, giving an attacker the full signal taxonomy to target downstream integrations against. *Mitigation:* versions are a public catalog by design (no auth); accept the disclosure as intended, or gate behind `PUBLIC_VIEWING` if the catalog must be hidden.

### Personal data processing
❌ No — this capability does not process personal data. (Static VSS reference JSON only; no user email/name is stored or returned.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
Static reference data only.
**Coverage:**
- **Stored data:** none — static reference JSON files.
- **Retention:** N/A (static files; 1-hour cache on `/vss/:version/:filename`).
- **Encryption:** none (public static JSON); TLS in transit.
- **Logging:** the static handler logs the requested path/version/filename; no sensitive data.
**Risks:**
- **Stale-spec leakage:** cached (1-hour) static JSON can keep serving a deprecated/superseded VSS version long after an admin intends to retire it, so consumers keep building against data the platform believed retired.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Estimated coverage:** ≈0% (est.) — no E2E spec.
- **Unit (Jest):** none

## CAP-VAPI-02 — Per-model VSS/COVESA API CRUD + computed tree

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| owner | Vehicle API view (`/model/:id/api`) | ❌ No | ✅ 2 cases, ≈45% (est.) |

### Description

As a model owner, I can define the VSS/COVESA signal set for my model. As an end user, I can read the computed CVI tree that merges VSS and extended (wishlist) signals into one view so that dashboards and code have a single signal tree to consume.

### Who uses it / value

Model owners (define the signal set); end users (consume signals in dashboards/code).

### Acceptance criteria

- When a **user** opens a model's Vehicle API view (`/model/:id/api`), they see the computed CVI tree merging the model's VSS signals with its extended (wishlist) signals.
- When an **owner** creates, edits, or deletes an API for their model at the Vehicle API view (`/model/:id/api`), the computed tree updates accordingly.
- When a **user** looks up a specific signal (e.g. Vehicle.Speed) at the Vehicle API view (`/model/:id/api`), they see its detail (datatype, unit, description, min/max where set).
- When a **guest** visits the Vehicle API view (`/model/:id/api`) for a private model with public viewing off, they're prevented from reading the computed tree.

### API contract

- `POST /v2/apis` (auth) → `201` the new API; `GET /v2/apis/:id` → `200`; `PATCH` → `200`; `DELETE` → `204`; `GET /v2/apis/model_id/:modelId` → `200` the model's API.
- `GET /v2/models/:id/api` (optional auth) → `200` the computed CVI (VSS + extended merged); `GET /v2/models/:id/api/:apiName` → `200` one API's detail (`name`, `datatype`, `type`, `unit?`, `min?`, `max?`, `description?`).

### Quality control

After I create an API for a model, the computed tree includes it; when I fetch the `Vehicle.Speed` detail, I get the datatype/unit.

```mermaid
flowchart LR
    O([Model owner]) -->|"POST /v2/apis"| API["Api document"]
    EXT["Extended APIs"] -.->|merge| COMP["GET /v2/models/:id/api<br/>(computed CVI)"]
    API -.->|merge| COMP
    U([End user]) -->|"GET /v2/models/:id/api/:apiName"| COMP
```

### Security

Reading the computed tree is optional via `PUBLIC_VIEWING`; creating/editing/deleting an API requires auth (owner/admin).

**Coverage:**
- **Auth:** computed-tree reads optional via `PUBLIC_VIEWING`; `POST`/`PATCH`/`DELETE` on `Api` require auth (JWT). Note: `GET /v2/apis/model_id/:modelId` has no auth at all.
- **Authorization:** computed tree — public models are readable by anyone; private models require `READ_MODEL` (owner bypass); `PATCH`/`DELETE` on an `Api` are restricted to owner-or-admin; ⚠️ `POST /v2/apis` lets any signed-in user create an `Api` for any model id (no model-access check on create).
- **Input validation:** I must send `model` (objectId) + `cvi` (jsonString) to create; get/update params are validated; invalid input is rejected.
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none.

**Risks:**
- **Computed-tree leak of private signals:** `GET /v2/models/:id/api` is optional-auth via `PUBLIC_VIEWING`; if a private model's computed tree were served without the access-scoping check, its entire signal definition set would leak to anonymous callers. *Mitigation:* the computed-tree read is scoped to public + owned + role-permissioned models (private requires `READ_MODEL`, owner bypass); verify the scope on the read path and on `GET /v2/apis/model_id/:modelId` (currently no auth).
- **Unauthorized signal tampering:** a missing auth check on `PATCH /v2/apis/:id` would let any authenticated user rewrite another tenant's signal definitions, corrupting dashboards and downstream consumers. *Mitigation:* `PATCH`/`DELETE` are restricted to owner-or-admin; keep the auth + authorization middleware on the route. ⚠️ `POST /v2/apis` lacks a model-access check — none currently — wire a `WRITE_MODEL` check to `POST` before creating the `Api`.

### Personal data processing
❌ No — this capability does not process personal data. (`created_by` is a user reference; no email/name is stored on the `Api` document.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
API definitions are stored linked to the model and the creating user.
**Coverage:**
- **Stored data:** `apis` collection (`model` ref, `cvi` JSON, `created_by`).
- **Retention:** hard delete (no soft-delete, no snapshot).
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.
**Risks:**
- **Cross-tenant signal inference:** `created_by` and `model` references in `Api` documents can reveal which user owns which model's signal set; a listing gap could expose private ownership relationships.

### Test coverage
- **E2E (Playwright):** 2 test case(s) in `vehicle-api.spec.ts` — SITEMAP: ✅
- **Estimated coverage:** ≈45% (est.) — 2 E2E cases cover computed-tree read; ~6 acceptance paths; CRUD, `model_id/:modelId`, and detail-by-name paths uncovered.
- **Unit (Jest):** none

## CAP-VAPI-03 — Replace APIs from a VSS spec

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| owner | Vehicle API view (`/model/:id/api`) | ❌ No | ❌ 0 cases, ≈0% (est.) |

### Description

As a model owner, I can replace all APIs for my model by pointing the system at a VSS spec JSON URL so that the model's signal set is swapped to a new VSS version.

### Who uses it / value

Model owners (swap the signal set to a new VSS version).

### Acceptance criteria

- When an **owner** opens the "Replace Vehicle API" dialog at the Vehicle API view (`/model/:id/api`), provides a VSS spec JSON file/URL, and confirms, all of the model's APIs are replaced with the new spec.
- When an **owner** doesn't provide a spec at the Vehicle API view (`/model/:id/api`), they're prevented from replacing (the action is disabled / they see an error).
- When the replace succeeds at the Vehicle API view (`/model/:id/api`), the computed tree changes to the new spec; the old signal set is lost with no undo.
- When a **user** lacks edit rights at the Vehicle API view (`/model/:id/api`), the replace action is hidden and they're prevented from replacing.

### API contract

- `POST /v2/models/:id/replace-api {api_data_url}` (requires `WRITE_MODEL`) → `200`; if `api_data_url` is missing, it returns `400`. ⚠️ This is destructive — it replaces all APIs.

### Quality control

After I replace from a VSS URL, the computed tree changes to the new spec; I can verify with `GET /v2/models/:id/api`.

```mermaid
sequenceDiagram
    participant O as Model owner
    participant API as POST /v2/models/:id/replace-api
    participant URL as api_data_url
    participant DB as Api document
    O->>API: {api_data_url}
    API->>API: check WRITE_MODEL
    API->>URL: fetch VSS spec JSON
    URL-->>API: spec JSON
    API->>DB: overwrite ALL apis
    API-->>O: 200
    Note over DB: old signal set lost (no undo)
```

### Security

Requires `WRITE_MODEL` (owner bypass).

**Coverage:**
- **Auth:** required (JWT access token).
- **Authorization:** requires `WRITE_MODEL` (owner bypass).
- **Input validation:** I must send `api_data_url` (required string); missing → `400`. ⚠️ No SSRF allowlist — the system fetches the URL I supply, so I can point it at internal addresses.
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none (the URL is user-supplied, not a stored secret).

**Risks:**
- **SSRF via `api_data_url`:** the server fetches the user-supplied URL to pull the VSS spec; without an allowlist or internal-address blocking, an attacker with `WRITE_MODEL` can make the server probe internal services (`http://169.254.169.254/…`, localhost admin ports). *Mitigation:* none currently — add an SSRF allowlist/blocklist (block link-local, loopback, and metadata IPs) before fetching `api_data_url`, and strip query params from logs.
- **Destructive overwrite by a stolen token:** a single call replaces the entire `Api` document, so a leaked `WRITE_MODEL` token lets an attacker wipe a model's signal set irreversibly in one request. *Mitigation:* the route requires `WRITE_MODEL` (owner bypass); revoke `WRITE_MODEL` tokens on suspected compromise and snapshot the `Api` set before overwrite for recovery.

### Personal data processing
❌ No — this capability does not process personal data. (Only the model id and a user-supplied `api_data_url`; no user email/name is stored.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
Calling replace overwrites the model's API document; the old set is lost (no undo beyond change logs).
**Coverage:**
- **Stored data:** overwrites the model's `Api` document and hard-deletes/recreates `extendedapis` for the model.
- **Retention:** old `Api` set hard-overwritten (no soft-delete, no snapshot); `extendedapis` hard-deleted.
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** the model id and `api_data_url` are logged (the URL is logged — may carry query params).
**Risks:**
- **Irreversible signal-set loss:** the old API set is hard-overwritten with no soft-delete or snapshot, so a malicious or mistaken replace permanently destroys the prior signal definitions — recoverable only from change logs if they exist.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Estimated coverage:** ≈0% (est.) — no E2E spec.
- **Unit (Jest):** none

## CAP-VAPI-04 — Vehicle API view (List / Tree / Hierarchical / Compare)

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| user | Vehicle API view (`/model/:id/api`) | ❌ No | ✅ 2 cases, ≈40% (est.) |

### Description

As an end user, I can browse the computed COVESA/VSS APIs in List, Tree, Hierarchical, and a Version Diff (compare) view, and download the computed VSS. As a model owner, I can upload or replace the VSS and switch VSS version from the UI.

### Who uses it / value

End users (explore signals); model owners (compare/replace VSS).

### Acceptance criteria

- When a **user** opens a model's Vehicle API page (`/model/:id/api`), they can switch between List, Tree, and Hierarchical views; each renders the computed signals accordingly.
- When a **user** opens the Version Diff view at the Vehicle API view (`/model/:id/api`), they can compare two VSS versions and see the diffs.
- When a **user** clicks "Download as JSON" at the Vehicle API view (`/model/:id/api`), the computed VSS JSON downloads.
- When an **owner** clicks "Replace Vehicle API" and uploads a spec at the Vehicle API view (`/model/:id/api`), the model's APIs are replaced.
- When a **guest** visits the Vehicle API view (`/model/:id/api`) for a private model with public viewing off, they're prevented from browsing the API view.
- When a **user** lacks edit rights at the Vehicle API view (`/model/:id/api`), the replace action is hidden.

### API contract

- Opening `/model/:id/api` or `/model/:id/api/covesa/:api` renders the corresponding view; download returns the computed VSS JSON; replace/upload requires `WRITE_MODEL`.
- Browsing the view is subject to `PUBLIC_VIEWING`; replacing requires `WRITE_MODEL`.

### Quality control

When I switch view modes, tree/list/hierarchy render; when I compare two versions, diffs are shown; when I download, I get valid JSON.

### Security

Browsing the view is optional via `PUBLIC_VIEWING`; replacing requires `WRITE_MODEL`.

**Coverage:**
- **Auth:** read optional via `PUBLIC_VIEWING`; replace/upload requires auth (JWT) + `WRITE_MODEL`.
- **Authorization:** computed-tree read — public models readable by anyone, private require `READ_MODEL` (owner bypass); replace requires `WRITE_MODEL` (owner bypass).
- **Input validation:** params on the underlying endpoints are validated; view modes are rendered client-side (no server validation of view mode).
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none.

**Risks:**
- **Download exfiltration:** the download action returns the full computed VSS JSON, so a `PUBLIC_VIEWING=true` misconfiguration or a leaked read path hands the entire signal definition set to an anonymous user. *Mitigation:* download is gated by the same `READ_MODEL`/owner access scoping as the computed-tree read (private requires `READ_MODEL`); verify the scope on the download endpoint and avoid relying on `PUBLIC_VIEWING` alone for private models.
- **Replace-action privilege bypass:** the replace/upload path in the UI must enforce `WRITE_MODEL` server-side; relying on UI hiding alone would let a crafted `POST /v2/models/:id/replace-api` call succeed for any authenticated user. *Mitigation:* `POST /v2/models/:id/replace-api` enforces `WRITE_MODEL` (owner bypass) server-side; keep the permission middleware on the route and do not trust UI hiding.

### Personal data processing
❌ No — this capability does not process personal data. (Computed signal tree only; no user email/name is stored or returned.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
The view is computed from stored API/extended-API data; downloading exposes the model's signal definitions.
**Coverage:**
- **Stored data:** none new (computed on demand); download exposes the full signal set.
- **Retention:** N/A (computed on demand).
- **Encryption:** none (public signal data); TLS in transit.
- **Logging:** request logs; no sensitive data.
**Risks:**
- **Bulk signal export:** a single download bundles every signal (including extended/wishlist signals unique to the model), giving one request a high-value exfiltration payload if access scoping is wrong.

### Test coverage
- **E2E (Playwright):** 2 test case(s) in `vehicle-api.spec.ts` — SITEMAP: ✅
- **Estimated coverage:** ≈40% (est.) — 2 E2E cases cover view-mode browse; ~5 acceptance paths; compare, download, and replace/upload paths uncovered.
- **Unit (Jest):** none

## CAP-VAPI-05 — Extended APIs (wishlist signals)

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| owner | Vehicle API view (`/model/:id/api`) | ❌ No | ❌ 0 cases, ≈0% (est.) |

### Description

As a model owner, I can add custom per-model signals (wishlist signals) on top of the VSS tree so that my model can expose signals beyond the standard set. As an end user, these extended signals are merged into the computed API I consume.

### Who uses it / value

Model owners (add signals beyond standard VSS); end users (use the extended signals).

### Acceptance criteria

- When an **owner** adds an extended signal to their model at the Vehicle API view (`/model/:id/api`), it appears in the computed tree.
- When an **owner** tries to create a duplicate signal (same name + model) at the Vehicle API view (`/model/:id/api`), it's rejected.
- When a **user** accesses another user's private model without permission at the Vehicle API view (`/model/:id/api`), they're prevented from reading or writing its extended signals.
- When an **owner** edits or deletes an extended signal they own at the Vehicle API view (`/model/:id/api`), the computed tree updates.

### API contract

- `GET /v2/extendedApis?model=<id>` (optional auth; I must have model access) → `200` the list; `POST` → `201`; `GET /by-api-and-model?apiName=&model=` → `200`; `GET/PATCH/DELETE /:id` → `200`/`200`/`204`.
- `GET /` requires a `model` query; `by-api-and-model` requires `apiName` + `model`; without access → `403`.
- Each `(apiName, model)` combination is unique.

### Quality control

After I create an extended signal, it appears in the computed tree; when I create a duplicate `(apiName, model)`, it's rejected; when I access another user's private model, I get `403`.

```mermaid
flowchart TD
    O([Model owner]) -->|"POST /v2/extendedApis?model=id"| E["extendedapis document"]
    E -->|"(apiName, model) unique"| DB[("extendedapis")]
    E -.->|merged into| COMP["Computed CVI"]
    U([End user]) -->|"GET /by-api-and-model"| E
    U -->|"no model access"| N1["403"]
```

### Security

Reading is optional via `PUBLIC_VIEWING`; writing requires auth + model access; uniqueness is enforced.

**Coverage:**
- **Auth:** reads optional via `PUBLIC_VIEWING`; create/update/delete require auth (JWT).
- **Authorization:** create requires `WRITE_MODEL` on the target model (owner bypass); reads follow model access (public allowed, else `READ_MODEL`/owner); update/delete require `WRITE_MODEL` on the signal's model (owner bypass). Unique `(apiName, model)` index.
- **Input validation:** I must send `model` to list; on update, `apiName` must start with `Vehicle.`; create/update params are validated; invalid input is rejected.
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none.

**Risks:**
- **Cross-tenant signal injection:** if the model-access check on `POST` were bypassed, an authenticated user could inject extended signals into another tenant's private model, polluting its computed CVI. *Mitigation:* create requires `WRITE_MODEL` on the target model (owner bypass) and reads follow model access (public allowed, else `READ_MODEL`/owner); keep the model-access check on `POST` and reject `apiName` not starting with `Vehicle.`.
- **Uniqueness-bypass collision:** the `(apiName, model)` unique index is the only dedupe guard; a race or a check that runs before index validation could create duplicate signals that confuse downstream consumers. *Mitigation:* rely on the Mongo unique index as the authoritative dedupe guard; surface index-violation errors as a `409` so callers retry rather than race.

### Personal data processing
❌ No — this capability does not process personal data. (Extended signal definitions keyed by `(apiName, model)`; no user email/name is stored.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
Extended signals are stored with a unique `(apiName, model)` index.
**Coverage:**
- **Stored data:** `extendedapis` collection (`apiName`, `model`, `skeleton`, `datatype`, …); unique index `(apiName, model)`.
- **Retention:** hard delete (no soft-delete); removed when the model is deleted or when `replace-api` runs.
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.
**Risks:**
- **Wishlist-signal disclosure:** extended signals often encode proprietary behavior beyond standard VSS; a read-path gap would expose this proprietary wishlist to unauthorized users.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Estimated coverage:** ≈0% (est.) — no E2E spec.
- **Unit (Jest):** none

## CAP-VAPI-06 — Custom API schemas

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| admin | Custom API Schema manager (`/admin/plugins`) | ❌ No | ❌ 0 cases, ≈0% (est.) |

### Description

As an admin, I can define API schema templates — choosing a structure type (tree, list, or graph), a JSON schema, an id format, relationships, tree config, and display mapping — that integrators use to validate non-COVESA Custom API Sets (e.g. REST/USP).

### Who uses it / value

Admins (define custom API shapes); integrators (non-COVESA APIs like REST/USP).

### Acceptance criteria

- When an **admin** opens the Custom API Schema manager (`/admin/plugins`), they see the list of schemas.
- When an **admin** creates a new schema with the required fields at the Custom API Schema manager (`/admin/plugins`), it's created and appears in the list.
- When an **admin** edits or deletes a schema at the Custom API Schema manager (`/admin/plugins`), the change persists / the schema is removed.
- When a **user** who is a non-admin tries to create, edit, or delete schemas at the Custom API Schema manager (`/admin/plugins`), they're prevented from doing so.
- When an **admin** submits an invalid or incomplete schema at the Custom API Schema manager (`/admin/plugins`), they're shown a validation error.

### API contract

- `GET /v2/custom-api-schema[/:id]` (public) → list/get; `POST/PATCH/DELETE /v2/custom-api-schema[/:id]` (admin) → `201`/`200`/`204`. Mounted at both `/v2/system/custom-api-schema` (frontend) and the bare `/v2/custom-api-schema`.
- To create one I must send `schema` (JSON string); the old `attributes` field is gone.
- Items are validated against the schema only basically (full JSON-schema validation is a TODO).

### Quality control

When I (as admin) create a `list` schema with a `schema` string, I get `201`; as a non-admin I get `403`; the public list reads it back.

```mermaid
flowchart LR
    A([Admin]) -->|"POST/PATCH/DELETE<br/>(MANAGE_USERS)"| S["customapischemas"]
    U([Public / integrator]) -->|"GET (public)"| S
    S -.->|validates| SETS["Custom API sets"]
```

### Security

Anyone can read schemas; writing requires `MANAGE_USERS` (admin). No secrets in schemas.

**Coverage:**
- **Auth:** read public (no auth); write requires auth (JWT) + `manageUsers`.
- **Authorization:** write requires `manageUsers` (admin only); reads are public.
- **Input validation:** I must send `code`/`name`/`type`/`schema` to create; params are validated (list/get/update/delete); invalid input is rejected. Item validation against the schema is basic (full JSON-schema validation is a TODO).
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none (schema definitions only).

**Risks:**
- **Platform-wide validation template poisoning:** schemas are the validation gate for every Custom API Set; a compromised admin could push a permissive `schema` that accepts arbitrary malicious API payloads into all derived sets. *Mitigation:* writes require `manageUsers` (admin only); review schema changes before publishing and keep an audit trail of schema mutations to detect tampering.
- **Weak validation as an attack surface:** item validation is only basic (full JSON-schema validation is a TODO), so malformed or oversized `schema` strings could trigger parser/DB issues in downstream set storage. *Mitigation:* none currently — implement full JSON-schema validation and enforce a size cap on `schema` strings before persistence.

### Personal data processing
❌ No — this capability does not process personal data. (`created_by` is an admin user reference; no email/name is stored on the schema.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
Schema definitions stored in `customapischemas` (`code` unique).
**Coverage:**
- **Stored data:** `customapischemas` collection (`code` unique, `name`, `type`, `schema` JSON string, `relationships`, `tree_config`, `display_mapping`, `version`, `is_active`, `created_by`).
- **Retention:** indefinite until hard delete (no soft-delete, no TTL).
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.
**Risks:**
- **Schema tampering without audit:** a modified schema silently re-shapes what every Custom API Set accepts; without an audit trail of schema changes, a tampered template is hard to detect after malicious sets have been created.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Estimated coverage:** ≈0% (est.) — no E2E spec.
- **Unit (Jest):** none

## CAP-VAPI-07 — Custom API sets

| Actor | Where | Personal data | E2E coverage |
|---|---|---|---|
| user | Vehicle API view (`/model/:id/api`) | ❌ No | ❌ 0 cases, ≈0% (est.) |

### Description

As a user or admin, I can create instances of a Custom API Schema and attach them to a model so that consumers see custom APIs alongside COVESA. I can scope a set as system (public) or user (owner-only) and add, update, or remove items with validation.

### Who uses it / value

End users/admins (create per-model API sets); model consumers (view custom APIs alongside COVESA).

### Acceptance criteria

- When a **user** creates a system-scoped set at the Vehicle API view (`/model/:id/api`), any authenticated **user** can read it; when they create a user-scoped set, only the **owner** can read it.
- When a **user** adds, updates, or removes items in a set at the Vehicle API view (`/model/:id/api`), the changes appear in the set.
- When a **user** attaches a custom API set to a model at the Vehicle API view (`/model/:id/api`), it appears as a tab alongside COVESA in the model's Vehicle API view.
- When a **user** views the Vehicle API view (`/model/:id/api`) with the custom API set feature disabled, the custom API UI (tabs and picker) is hidden.
- When a **user** creates a set at the Vehicle API view (`/model/:id/api`), their data is validated against the referenced schema.

### API contract

- `GET /v2/custom-api-sets` (optional auth via `PUBLIC_VIEWING`) → `200` (system sets public, user sets owner-only); `POST` (auth) → `201`; `GET /:id` (optional auth via `PUBLIC_VIEWING`) → `200`; `PATCH/DELETE /:id` (auth + ownership) → `200`/`204`.
- `POST /:id/items {item:{…}}` → `200`; `PATCH/DELETE /:id/items/:itemId` → `200`.
- UI is hidden when `DISABLE_CUSTOM_API_SETS=true`; attaching a set to a model requires `WRITE_MODEL`.
- On create, `data` is validated against the referenced schema.

### Quality control

After I create a system-scoped set, any authenticated user can read it; after a user-scoped set, only I (the owner) can read it; after I add an item, it appears in the set; when I toggle `DISABLE_CUSTOM_API_SETS`, the UI is hidden.

```mermaid
flowchart TD
    U([User / admin]) -->|"POST /v2/custom-api-sets"| SET["customapisets document"]
    SET --> SC["scope: system (public) | user (owner)"]
    SET -.->|"validate against"| SCH["Custom API schema"]
    U -->|"POST /:id/items"| ITEMS["data.items[]"]
    ITEMS --> SET
    SET -.->|attach| MODEL["model.custom_api_sets<br/>(WRITE_MODEL)"]
    FLAG{"DISABLE_CUSTOM_API_SETS=true"} -.->|hides| UI["UI"]
```

### Security

⚠️ No admin gate for system-scope sets — any signed-in user can create/update/delete a system-scoped set (only user-scope is owner-gated). Reads respect scope + `PUBLIC_VIEWING`. Item ops require auth.

**Coverage:**
- **Auth:** reads optional via `PUBLIC_VIEWING`; writes/item ops require auth (JWT).
- **Authorization:** reads — scope + `PUBLIC_VIEWING` (system public, user owner-only); writes — user-scope is owner-gated; ⚠️ system-scope has NO admin gate — any signed-in user can create/update/delete system-scoped sets and items. Attaching a set to a model requires `WRITE_MODEL`.
- **Input validation:** I must send `custom_api_schema`/`custom_api_schema_code`/`scope`/`name`/`data.items` to create; `data` is validated against the referenced schema; item-level validation is basic (full JSON-schema validation is a TODO).
- **Rate limiting:** not applied (`authLimiter` exists but is unused).
- **Secrets:** none.

**Risks:**
- **System-scope set takeover:** because system-scope sets have no admin gate, any authenticated user (not just admins) can create, update, or delete system-scoped sets that every tenant reads — a low-privilege account can tamper with shared, platform-visible API definitions. *Mitigation:* none currently — gate system-scope writes behind `manageUsers` (admin) and audit system-scope mutations.
- **Cross-tenant system-set pollution:** a system-scoped set is public across tenants; without ownership/tenant scoping on system-scope writes, one user can push hostile or malformed API definitions visible to all consumers, with no admin approval step. *Mitigation:* none currently — add an admin approval step or tenant scoping for system-scope writes; flag `DISABLE_CUSTOM_API_SETS` to hide the UI if the gate cannot be added.
- **Item-level bypass:** `POST/PATCH/DELETE /:id/items` require auth but not re-validated ownership on every item op in the spec — if item ops aren't scoped to the set owner, any authenticated user could mutate another user's set items. *Mitigation:* none currently — re-check set ownership on every item op and reject non-owner mutations (system-scope sets still need the admin gate from above).

### Personal data processing
❌ No — this capability does not process personal data. (`owner`/`created_by` are user references; no email/name is stored on the set.)
N/A
**Risks:**
- none — no personal data processed.

### AutoWRX data
Sets are stored with an `owner`/`created_by`; the entire API set lives in one document (`data.items[]` — mind the 16 MB limit).
**Coverage:**
- **Stored data:** `customapisets` collection (`custom_api_schema` ref, `custom_api_schema_code`, `scope`, `owner`, `created_by`, `name`, `description`, `avatar`, `provider_url`, `data.items[]`, `data.metadata`); entire set in one document (16 MB Mongo limit).
- **Retention:** hard delete (no soft-delete, no snapshot).
- **Encryption:** none beyond Mongo defaults / TLS in transit.
- **Logging:** request logs; no sensitive data.
**Risks:**
- **Document-growth DoS:** the whole set lives in one MongoDB document capped at 16 MB; an attacker who can append items unbounded could push the document toward the limit, corrupting or rejecting the entire set's storage.
- **Owner-data leak via system scope:** a user mistakenly creating a system-scoped set instead of a user-scoped one exposes their custom API definitions (potentially proprietary) to every authenticated user — an irreversible misclassification with no prompt to revert.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌
- **Estimated coverage:** ≈0% (est.) — no E2E spec.
- **Unit (Jest):** none