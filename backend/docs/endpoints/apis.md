## API Endpoints (/v2/apis)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /vss | None | List available VSS versions. |
| GET | /vss/:name | None | Get VSS by version name. |
| POST | / | Required | Create API definition. |
| GET | /:id | Optional (strictAuth=false) | Get API definition by ID. |
| PATCH | /:id | Required | Update API definition. |
| DELETE | /:id | Required | Delete API definition. |
| GET | /model_id/:modelId | None | Get APIs by model ID. |

### Data Model

```yaml
Api:
  type: object
  properties:
    id:
      type: string
    model:
      type: string
    cvi:
      type: object
    created_by:
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
/v2/apis/vss:
  get:
    summary: List available VSS versions
    responses:
      '200':
        description: Versions

/v2/apis/vss/{name}:
  get:
    summary: Get VSS by version name
    parameters:
      - in: path
        name: name
        required: true
        schema:
          type: string
    responses:
      '200':
        description: VSS json

/v2/apis:
  post:
    summary: Create API definition
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateApiRequest'
    responses:
      '201':
        description: Created

/v2/apis/{id}:
  get:
    summary: Get API definition by ID
    responses:
      '200':
        description: API definition
  patch:
    summary: Update API definition
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateApiRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete API definition
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content

/v2/apis/model_id/{modelId}:
  get:
    summary: Get APIs by model ID
    parameters:
      - in: path
        name: modelId
        required: true
        schema:
          type: string
    responses:
      '200':
        description: API list
```
