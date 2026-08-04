## MongoDB Collections

A concise overview of the collections used by the backend and their roles. (See `backend/src/models/index.js` for the authoritative list of registered models.)

### users
- Identity of end users (name, email, password/SSO fields, profile info).
- Source of truth for authentication subjects (`sub` in JWT access/refresh).

### tokens
- Persists refresh, reset-password, and verify-email tokens (access tokens are not stored).
- Enables refresh rotation, logout revocation, and one-time token flows.

### roles
- Defines role entities and their permission sets.
- Used by permission checks and admin role management.

### userroles
- Many-to-many mapping of users to roles, optionally scoped by a `ref` resource.
- Supports per-resource authorization (e.g., model membership).

### models
- Represents vehicle models (metadata, visibility, tags, assets, APIs).
- Owner reference via `created_by`.

### prototypes
- Code artifacts tied to a `model_id`, including metadata, tags, ratings, and execution data.
- Drives portfolio/review workflows and execution.

### apis
- Stores computed API/VSS definitions per model.
- References `model` and `created_by`.

### extendedapis
- Extends base API with additional fields (datatype, unit, constraints, wishlist, etc.).
- Unique per `(apiName, model)`.

### assets
- Binary/structured asset metadata with `type`, arbitrary `data`, and `created_by`.

### discussions
- Threaded comments tied to a `ref` and `ref_type` with optional `parent` for nesting.

### feedbacks
- Feedback/interview records (`avg_score`, sub-scores, `interviewee`) tied to a `ref`/`model_id`.

### plugins
- Loadable UI plugins: `name`, `slug` (unique), `url`, `is_internal`, `config`, `type` (`prototype_function`/`deploy`).

### siteconfigs
- Site/user/model/prototype/api-scoped configuration (`key`, `scope`, `target_id`, `value`, `secret`, `valueType`); unique on `(key, scope, target_id)`. Backs feature flags, theming, auth configs.
- Audit/restore is backed by `siteconfigsnapshots` + `siteconfigsnapshotmetas`.

### changelogs
- Capped collection; audit trail (`action` CREATE/UPDATE/DELETE, `changes`, `ref`), written by the `captureChange` Mongoose plugin.

### customapischemas
- Admin-defined schemas for custom API sets (Tree / List / Graph types). Defines `schema`, `relationships` (graph), `tree_config` (tree), `display_mapping`, `id_format`. (Previously named "PluginAPI".)

### customapisets
- Instances of a `CustomApiSchema` with scope-based access (`system` / `user`). Stores a complete API set in one document (`data.items[]`). (Previously named "PluginApiInstance".)

### modeltemplates / dashboardtemplates / projecttemplates
- Reusable model/dashboard/project scaffolds with `visibility` and template-specific config.

> Inventory collections (`schemas`, `relations`, `instances`, `instancerelations`) and an `issues` collection previously existed but have been removed — see the `// Inventory models removed` note in `models/index.js`.