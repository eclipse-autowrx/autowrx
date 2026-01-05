## PluginApiInstance Endpoints (/v2/vehicle-data/plugin-api-instances)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create PluginApiInstance. |
| GET | / | Required | List PluginApiInstances (scope-filtered). |
| GET | /:id | Required | Get PluginApiInstance by ID. |
| PATCH | /:id | Required | Update PluginApiInstance. |
| DELETE | /:id | Required | Delete PluginApiInstance. |
| POST | /:id/items | Required | Add item to instance. |
| PATCH | /:id/items/:itemId | Required | Update item in instance. |
| DELETE | /:id/items/:itemId | Required | Remove item from instance. |

### Data Model

```yaml
PluginApiInstance:
  type: object
  properties:
    id:
      type: string
    plugin_api:
      type: string
      description: Reference to PluginAPI schema
    plugin_api_code:
      type: string
    scope:
      type: string
      enum: ['system', 'user']
    owner:
      type: string
      description: User who owns this instance
    name:
      type: string
    description:
      type: string
    data:
      type: object
      properties:
        items:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              path:
                type: string
              parent_id:
                type: string
              relationships:
                type: array
                items:
                  type: object
                  properties:
                    relationship_name:
                      type: string
                    target_item_id:
                      type: string
        metadata:
          type: any
    created_by:
      type: string
    updated_by:
      type: string
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### Scope-Based Access

- **System scope**: Created by admin, accessible by all users
- **User scope**: Created by user, only accessible by creator

### OpenAPI (Swagger)

```yaml
/v2/vehicle-data/plugin-api-instances:
  get:
    summary: List PluginApiInstances
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: plugin_api_code
        schema:
          type: string
      - in: query
        name: scope
        schema:
          type: string
          enum: ['system', 'user']
      - in: query
        name: owner
        schema:
          type: string
    responses:
      '200':
        description: Instance list
  post:
    summary: Create PluginApiInstance
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatePluginApiInstanceRequest'
    responses:
      '201':
        description: Created

/v2/vehicle-data/plugin-api-instances/{id}:
  get:
    summary: Get PluginApiInstance by ID
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Instance
  patch:
    summary: Update PluginApiInstance
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdatePluginApiInstanceRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete PluginApiInstance
    security:
      - bearerAuth: []
    responses:
      '204':
        description: Deleted

/v2/vehicle-data/plugin-api-instances/{id}/items:
  post:
    summary: Add item to instance
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              item:
                type: object
    responses:
      '200':
        description: Updated instance

/v2/vehicle-data/plugin-api-instances/{id}/items/{itemId}:
  patch:
    summary: Update item in instance
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Updated instance
  delete:
    summary: Remove item from instance
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Updated instance
```

### Example Requests

**Create Tree Instance:**
```json
POST /v2/vehicle-data/plugin-api-instances
{
  "plugin_api": "<plugin_api_id>",
  "plugin_api_code": "covesa",
  "scope": "system",
  "name": "Vehicle API Set",
  "data": {
    "items": [
      {
        "id": "ABC",
        "path": "ABC",
        "name": "ABC"
      },
      {
        "id": "ABC.X1",
        "path": "ABC.X1",
        "parent_id": "ABC",
        "name": "X1"
      }
    ]
  }
}
```

**Add Item:**
```json
POST /v2/vehicle-data/plugin-api-instances/{id}/items
{
  "item": {
    "id": "ABC.X2",
    "path": "ABC.X2",
    "parent_id": "ABC",
    "name": "X2"
  }
}
```

