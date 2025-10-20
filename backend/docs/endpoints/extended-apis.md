## Extended API Endpoints (/v2/extendedApis)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create extended API. |
| GET | / | Optional (strictAuth=false) | List extended APIs. |
| GET | /by-api-and-model | Optional (strictAuth=false) | Get by API name and model. |
| GET | /:id | Optional (strictAuth=false) | Get extended API by ID. |
| PATCH | /:id | Required | Update extended API. |
| DELETE | /:id | Required | Delete extended API. |

### Data Model

```yaml
ExtendedApi:
  type: object
  properties:
    id:
      type: string
    apiName:
      type: string
    model:
      type: string
    skeleton:
      type: string
    unit:
      type: string
    type:
      type: string
    datatype:
      type: string
    description:
      type: string
    isWishlist:
      type: boolean
      default: false
    min:
      type: number
    max:
      type: number
    allowed:
      type: array
      items:
        oneOf:
          - type: string
          - type: number
          - type: boolean
          - type: object
    comment:
      type: string
    default:
      oneOf:
        - type: string
        - type: number
        - type: boolean
        - type: object
    deprecation:
      type: string
    custom_properties:
      type: object
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### OpenAPI (Swagger)

```yaml
/v2/extendedApis:
  get:
    summary: List extended APIs
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Extended API list
  post:
    summary: Create extended API
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateExtendedApiRequest'
    responses:
      '201':
        description: Created

/v2/extendedApis/by-api-and-model:
  get:
    summary: Get extended API by API name and model
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: apiName
        schema:
          type: string
      - in: query
        name: modelId
        schema:
          type: string
    responses:
      '200':
        description: Extended API

/v2/extendedApis/{id}:
  get:
    summary: Get extended API by ID
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
        description: Extended API
  patch:
    summary: Update extended API
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateExtendedApiRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete extended API
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content
```
