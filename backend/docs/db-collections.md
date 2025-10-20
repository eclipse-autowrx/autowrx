## MongoDB Collections

A concise overview of all collections used by the backend and their roles.

### users
- Identity of end users (name, email, password/SSO fields, profile info).
- Source of truth for authentication subjects (`sub` in JWT access/refresh).

### tokens
- Persists refresh, reset-password, and verify-email JWTs (access tokens are not stored).
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

### issues
- Links to `extendedapis` to track external or review issues (`link`).

### assets
- Binary/structured asset metadata with `type`, arbitrary `data`, and `created_by`.

### discussions
- Threaded comments tied to a `ref` and `ref_type` with optional `parent` for nesting.

### schemas (inventory)
- Inventory schema definitions (name, description, serialized schema).

### relations (inventory)
- Relation definitions between inventory schemas (type, cardinality, properties).

### instances (inventory)
- Concrete instances of an inventory `schema` with serialized `data`.

### instancerelations (inventory)
- Links between inventory `instances` under a `relation`, with optional `metadata`.


