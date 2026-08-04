## Custom API Set Endpoints (/v2/custom-api-sets)

Instances of a `CustomApiSchema` — concrete API sets a user/admin creates and a model can reference. (This was previously named "PluginApiInstance" at `/v2/vehicle-data/plugin-api-instances`; that route no longer exists.)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Optional (when `PUBLIC_VIEWING` enabled) | List sets. Query: `custom_api_schema_code`, `scope` (`system`/`user`), `owner`, `name`, `sortBy`, `limit`, `page`. |
| GET | /:id | Optional (when `PUBLIC_VIEWING` enabled) | Get a set by ID. |
| POST | / | Required | Create a set. |
| PATCH | /:id | Required | Update a set. |
| DELETE | /:id | Required | Delete a set. |
| POST | /:id/items | Required | Add an item to a set (body `{ item: {…} }`). |
| PATCH | /:id/items/:itemId | Required | Update a set item. |
| DELETE | /:id/items/:itemId | Required | Remove a set item. |

### Data Model (`CustomApiSet`, collection `customapisets`)

```yaml
CustomApiSet:
  properties:
    id: { type: string }
    custom_api_schema: { type: string (ObjectId → CustomApiSchema), required }
    custom_api_schema_code: { type: string, required }
    scope: { type: string, enum: ['system','user'], required }
    owner: { type: string (ObjectId → User), required }   # auto-set to the creator
    name: { type: string, required, max 255 }
    description: { type: string }
    avatar: { type: string }
    provider_url: { type: string (URI) }
    data:                            # required
      items:                          # array of { id (required), path, parent_id, relationships[], metadata }
        relationships:                  # { relationship_name (required), target_item_id (required) }
      metadata: { type: any }
    created_by / updated_by: { type: string (ObjectId → User), required }
    createdAt / updatedAt: { type: date-time }
```

### Status codes

Create → `201`; list / get / update / add-item / update-item / remove-item → `200`; delete → `204`.

### Example: create a set

```json
POST /v2/custom-api-sets
{
  "custom_api_schema": "64f1c2e8a1b2c3d4e5f6a7b8",
  "custom_api_schema_code": "rest_api",
  "scope": "user",
  "name": "My REST API set",
  "data": { "items": [], "metadata": {} }
}
```

### Item operations

```json
POST /v2/custom-api-sets/{id}/items
{ "item": { "id": "endpoint-1", "path": "/vehicles", "metadata": {} } }

PATCH /v2/custom-api-sets/{id}/items/{itemId}
{ "item": { "path": "/v1/vehicles" } }

DELETE /v2/custom-api-sets/{id}/items/{itemId}
```