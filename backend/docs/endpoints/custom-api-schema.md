## Custom API Schema Endpoints (/v2/system/custom-api-schema)

Admin-defined schemas for custom API sets (Tree / List / Graph). Each schema defines the structure that `CustomApiSet` instances conform to. The route is mounted at both `/v2/system/custom-api-schema` (used by the frontend) and the bare `/v2/custom-api-schema`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | None | List custom API schemas (public). Query: `code`, `type` (`tree`/`list`/`graph`), `is_active`, `sortBy`, `limit`, `page`. |
| GET | /:id | None | Get a schema by ID. |
| POST | / | Required + ADMIN | Create a schema. |
| PATCH | /:id | Required + ADMIN | Update a schema. |
| DELETE | /:id | Required + ADMIN | Delete a schema. |

### Data Model (`CustomApiSchema`, collection `customapischemas`)

```yaml
CustomApiSchema:
  properties:
    id: { type: string }
    code: { type: string }            # unique, lowercase, max 100 (e.g. 'rest_api', 'covesa')
    name: { type: string }            # required, max 255
    description: { type: string }
    type: { type: string, enum: ['tree','list','graph'] }  # required
    schema: { type: string }          # required — JSON-encoded string (parsed server-side)
    id_format: { type: string, default: null }
    relationships:                     # array of { name, type (one-to-one|one-to-many|many-to-many), target_api, description }
    tree_config: { type: object }      # tree-type config (separator, max_depth, …)
    display_mapping:                   # object { title, description, type }
    schema_definition: { type: any }   # JSON Schema or custom format
    version: { type: string, default: '1.0.0' }
    is_active: { type: boolean, default: true }
    created_by / updated_by: { type: string (ObjectId → User) }
    createdAt / updatedAt: { type: date-time }
```

> `schema` is the required field that replaced the old `attributes` array — it is a **JSON-encoded string** in the request body (`JSON.parse`'d by the controller).

### OpenAPI

```yaml
/v2/system/custom-api-schema:
  get:
    summary: List custom API schemas
    parameters:
      - { in: query, name: code, schema: { type: string } }
      - { in: query, name: type, schema: { type: string, enum: ['tree','list','graph'] } }
      - { in: query, name: is_active, schema: { type: boolean } }
      - { in: query, name: sortBy, schema: { type: string } }
      - { in: query, name: limit, schema: { type: integer } }
      - { in: query, name: page, schema: { type: integer } }
    responses:
      '200': { description: Schema list (paginated) }
  post:
    summary: Create a custom API schema
    security: [{ bearerAuth: [] }]
    requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateCustomApiSchemaRequest' } } } }
    responses:
      '201': { description: Created }

/v2/system/custom-api-schema/{id}:
  get:
    summary: Get a schema by ID
    parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
    responses:
      '200': { description: Schema }
  patch:
    summary: Update a schema
    security: [{ bearerAuth: [] }]
    parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
    requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateCustomApiSchemaRequest' } } } }
    responses:
      '200': { description: Updated }
  delete:
    summary: Delete a schema
    security: [{ bearerAuth: [] }]
    parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
    responses:
      '204': { description: Deleted }
```

### Example Requests

**Create a Tree schema:**
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

**Create a List schema:**
```json
POST /v2/system/custom-api-schema
{
  "code": "rest_api",
  "name": "REST API",
  "type": "list",
  "schema": "{\"properties\":{\"name\":{\"type\":\"string\"},\"path\":{\"type\":\"string\"},\"method\":{\"type\":\"string\"}}}"
}
```