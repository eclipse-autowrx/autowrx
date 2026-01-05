## PluginAPI Endpoints (/v2/system/plugin-api)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | None | List PluginAPI schemas (public read). |
| GET | /:id | None | Get PluginAPI schema by ID. |
| POST | / | Required + ADMIN | Create PluginAPI schema. |
| PATCH | /:id | Required + ADMIN | Update PluginAPI schema. |
| DELETE | /:id | Required + ADMIN | Delete PluginAPI schema. |

### Data Model

```yaml
PluginAPI:
  type: object
  properties:
    id:
      type: string
    code:
      type: string
      description: Unique lowercase code identifier (e.g., 'rest_api', 'covesa')
    name:
      type: string
    description:
      type: string
    type:
      type: string
      enum: ['tree', 'list', 'graph']
    attributes:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          data_type:
            type: string
            enum: ['string', 'number', 'boolean', 'object', 'array', 'mixed']
          required:
            type: boolean
          description:
            type: string
          default:
            type: any
          validation:
            type: any
    relationships:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          type:
            type: string
            enum: ['one-to-one', 'one-to-many', 'many-to-many']
          target_api:
            type: string
          description:
            type: string
    tree_config:
      type: object
      description: Configuration for tree type (separator, max_depth, etc.)
    schema_definition:
      type: any
      description: JSON Schema or custom format
    version:
      type: string
      default: '1.0.0'
    is_active:
      type: boolean
      default: true
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

### OpenAPI (Swagger)

```yaml
/v2/system/plugin-api:
  get:
    summary: List PluginAPI schemas
    parameters:
      - in: query
        name: code
        schema:
          type: string
      - in: query
        name: type
        schema:
          type: string
          enum: ['tree', 'list', 'graph']
      - in: query
        name: is_active
        schema:
          type: boolean
      - in: query
        name: page
        schema:
          type: integer
      - in: query
        name: limit
        schema:
          type: integer
    responses:
      '200':
        description: PluginAPI list
  post:
    summary: Create PluginAPI schema
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatePluginAPIRequest'
    responses:
      '201':
        description: Created

/v2/system/plugin-api/{id}:
  get:
    summary: Get PluginAPI schema by ID
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '200':
        description: PluginAPI schema
  patch:
    summary: Update PluginAPI schema
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdatePluginAPIRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete PluginAPI schema
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '204':
        description: Deleted
```

### Example Requests

**Create Tree API Schema:**
```json
POST /v2/system/plugin-api
{
  "code": "covesa",
  "name": "COVESA API",
  "type": "tree",
  "attributes": [
    {
      "name": "name",
      "data_type": "string",
      "required": true
    },
    {
      "name": "value",
      "data_type": "mixed",
      "required": false
    }
  ],
  "tree_config": {
    "separator": ".",
    "max_depth": 10
  }
}
```

**Create List API Schema:**
```json
POST /v2/system/plugin-api
{
  "code": "rest_api",
  "name": "REST API",
  "type": "list",
  "attributes": [
    {
      "name": "name",
      "data_type": "string",
      "required": true
    },
    {
      "name": "path",
      "data_type": "string",
      "required": true
    },
    {
      "name": "method",
      "data_type": "string",
      "required": true
    }
  ]
}
```

