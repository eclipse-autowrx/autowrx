## Model Endpoints (/v2/models)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create a model. |
| GET | / | Optional (strictAuth=false) | List models (paginated). |
| GET | /all | Optional (strictAuth=false) | List all models (unpaginated/expanded). |
| GET | /:id | Optional (strictAuth=false) | Get model by ID. |
| PATCH | /:id | Required + WRITE_MODEL | Update model. |
| DELETE | /:id | Required + WRITE_MODEL | Delete model. |
| POST | /:id/replace-api | Required + WRITE_MODEL | Replace model API definition. |
| GET | /:id/api | Optional (strictAuth=false) | Get computed VSS API for model. |
| GET | /:id/api/:apiName | Optional (strictAuth=false) | Get specific API details by name. |
| POST | /:id/permissions | Required + WRITE_MODEL | Add authorized user. |
| DELETE | /:id/permissions | Required + WRITE_MODEL | Remove authorized user. |

### Data Model

```yaml
Model:
  type: object
  properties:
    id:
      type: string
    custom_apis:
      type: object
    main_api:
      type: string
    model_home_image_file:
      type: string
    detail_image_file:
      type: string
    model_files:
      type: object
    name:
      type: string
    visibility:
      type: string
    state:
      type: string
      default: draft
    vehicle_category:
      type: string
    property:
      type: string
    created_by:
      type: string
    skeleton:
      type: string
    tags:
      type: array
      items:
        type: object
        properties:
          title:
            type: string
          description:
            type: string
    extend:
      type: object
    api_version:
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
/v2/models:
  get:
    summary: List models
    security:
      - bearerAuth: []
    parameters:
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
        description: Models list
  post:
    summary: Create model
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateModelRequest'
    responses:
      '201':
        description: Created

/v2/models/all:
  get:
    summary: List all models
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Models

/v2/models/{id}:
  get:
    summary: Get model by ID
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Model
  patch:
    summary: Update model by ID
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateModelRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete model by ID
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content

/v2/models/{id}/replace-api:
  post:
    summary: Replace model API
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ReplaceApiRequest'
    responses:
      '200':
        description: Replaced

/v2/models/{id}/api:
  get:
    summary: Get computed VSS API
    security:
      - bearerAuth: []
    responses:
      '200':
        description: API definition

/v2/models/{id}/api/{apiName}:
  get:
    summary: Get API details by name
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: apiName
        required: true
        schema:
          type: string
    responses:
      '200':
        description: API details

/v2/models/{id}/permissions:
  post:
    summary: Add authorized user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AddAuthorizedUserRequest'
    responses:
      '200':
        description: Added
  delete:
    summary: Remove authorized user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/DeleteAuthorizedUserRequest'
    responses:
      '204':
        description: Removed
```
