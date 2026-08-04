# Custom API System Architecture Guide

> This was previously called the "API Plugin System" (models `PluginAPI`/`PluginApiInstance`, routes `/v2/system/plugin-api` and `/v2/vehicle-data/plugin-api-instances`). Those names and routes no longer exist — the models are now **`CustomApiSchema`** and **`CustomApiSet`**, at `/v2/system/custom-api-schema` and `/v2/custom-api-sets`. See `endpoints/custom-api-schema.md` and `endpoints/custom-api-set.md` for the endpoint contracts.

## Overview

The Custom API System lets administrators define custom API-set schemas and lets users create instances of those API sets. It supports three structure types: **Tree** (hierarchical), **List** (flat), and **Graph** (with relationships).

### Purpose
- Admins define reusable API-set schemas (`CustomApiSchema`).
- Users/admins create and manage API-set instances (`CustomApiSet`) that conform to a schema.
- Scope-based access control: `system` (shared) vs `user` (private).
- Vehicle models reference instances via the `custom_api_sets` field.

### System Components

```
┌──────────────────┐
│  CustomApiSchema │  ← schema definitions (admin-created)
└────────┬─────────┘
         │ defines structure
         ↓
┌────────────────┐
│  CustomApiSet   │  ← data instances (user/admin-created)
└────────┬───────┘
         │ referenced by
         ↓
┌────────────────┐
│     Model       │  ← vehicle models link to sets via `custom_api_sets`
└────────────────┘
```

## Data Models

### CustomApiSchema

Defines the template/structure for an API set (collection `customapischemas`):

```javascript
{
  code: 'rest_api',        // unique, lowercase, max 100
  name: 'REST API',
  type: 'list',            // 'tree' | 'list' | 'graph'
  schema: '...',           // REQUIRED — JSON-encoded string defining the item fields
  id_format: null,         // optional id format
  relationships: [],        // for graph type: { name, type, target_api, description }
  tree_config: {},          // for tree type (separator, max_depth, …)
  display_mapping: {},     // optional { title, description, type }
  schema_definition: {},   // optional JSON Schema / custom format
  version: '1.0.0',
  is_active: true,
}
```

> `schema` replaced the old `attributes` array — it is a **JSON-encoded string** in the request body.

### CustomApiSet

An instance of a schema (collection `customapisets`):

```javascript
{
  custom_api_schema: ObjectId,       // → CustomApiSchema
  custom_api_schema_code: 'rest_api', // denormalized for queries
  scope: 'system',                    // 'system' | 'user'
  owner: ObjectId,                    // creator/owner
  name: 'My REST API set',
  data: {
    items: [
      { id: 'api1', path: '/api/users', name: 'Get Users' /* …item fields per schema */ }
    ],
    metadata: {}
  }
}
```

## API Types

### Tree API — hierarchical (parent-child). Items have `path` and `parent_id`. Use case: COVESA VSS.
```json
{ "items": [
  { "id": "ABC", "path": "ABC", "name": "ABC" },
  { "id": "ABC.X1", "path": "ABC.X1", "parent_id": "ABC", "name": "X1" }
]}
```

### List API — flat array, no nesting. Use case: REST API documentation.
### Graph API — nodes with a `relationships` array (`{ relationship_name, target_item_id }`). Use case: service dependencies.

## Scope System

- **System scope** — created by admins, readable by all, shared across the platform.
- **User scope** — created by any authenticated user, private to the creator.

## Permission Model

- **CustomApiSchema**: Create/Update/Delete = admin only (`auth()` + `checkPermission(ADMIN)`); Read = public.
- **CustomApiSet** (the routes apply `auth()` for writes; optional `PUBLIC_VIEWING` for reads):
  - Create — any authenticated user, for either scope (there is **no admin gate** for system-scope creation; `owner` is set to the creator).
  - Read — system scope = public (all users, including unauthenticated); user scope = owner only.
  - Update / Delete — user scope = owner only; system scope = any authenticated user (no admin gate — the service only enforces ownership for user-scoped sets).
  - Item operations (add/update/remove item) = the authenticated user.
- **Model integration** — linking a set via `PATCH /v2/models/{id}` requires `WRITE_MODEL` on the model, plus read access to the set (system scope or owner).

## Storage Strategy

- An entire API set is stored in one `CustomApiSet` document (`data.items[]` array). Mind the 16 MB document limit (hundreds of items is low-risk; chunk beyond thousands).
- Item-level operations (add/update/remove) use MongoDB array operators (`$set`, `$push`, `$pull`, positional `$`).

## Usage Examples

### Create a schema
```json
POST /v2/system/custom-api-schema
{
  "code": "covesa",
  "name": "COVESA API",
  "type": "tree",
  "schema": "{\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"object\"}}}",
  "tree_config": { "separator": ".", "max_depth": 10 }
}
```

### Create an instance
```json
POST /v2/custom-api-sets
{
  "custom_api_schema": "<schema_id>",
  "custom_api_schema_code": "covesa",
  "scope": "system",
  "name": "Vehicle Signals",
  "data": {
    "items": [
      { "id": "Vehicle", "path": "Vehicle", "name": "Vehicle" },
      { "id": "Vehicle.Speed", "path": "Vehicle.Speed", "parent_id": "Vehicle", "name": "Speed" }
    ]
  }
}
```

### Link an instance to a model
```json
PATCH /v2/models/{modelId}
{ "custom_api_sets": ["<instance_id>"] }
```

### Add an item to an instance
```json
POST /v2/custom-api-sets/{id}/items
{ "item": { "id": "Vehicle.Battery", "path": "Vehicle.Battery", "parent_id": "Vehicle", "name": "Battery" } }
```

## Testing

```bash
node src/scripts/test-custom-api-system.js            # run + clean up
node src/scripts/test-custom-api-system.js --keep-data  # keep test data
node src/scripts/test-custom-api-system.js --clean       # clean existing test data
```
(A legacy `test-plugin-api-system.js` also exists from before the rename.)

## Validation

- **Schema**: items must match the `schema` definition; required fields must be present.
- **Structure**: Tree — parent refs must exist; Graph — relationship targets must exist; List — no structural validation.
- **Permission**: scope-based access + ownership (user scope) + model write permission.