## Prototype Endpoints (/v2/prototypes)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create a prototype. |
| GET | / | Optional (strictAuth=false) | List prototypes. |
| POST | /bulk | Required | Bulk create prototypes. |
| GET | /recent | Required | List recent prototypes. |
| GET | /popular | Optional (strictAuth=false) | List popular prototypes. |
| GET | /:id | Optional (strictAuth=false) | Get prototype by ID. |
| PATCH | /:id | Required + READ_MODEL | Update prototype. |
| DELETE | /:id | Required + READ_MODEL | Delete prototype. |
| POST | /:id/execute-code | Required | Execute code for a prototype. |

### Data Model

```yaml
Prototype:
  type: object
  properties:
    id:
      type: string
    apis:
      type: object
      properties:
        VSC:
          type: array
          items:
            type: string
        VSS:
          type: array
          items:
            type: string
    code:
      type: string
    extend:
      type: object
    complexity_level:
      type: integer
      minimum: 1
      maximum: 5
      default: 3
    customer_journey:
      type: string
    description:
      type: object
      properties:
        problem:
          type: string
        says_who:
          type: string
        solution:
          type: string
        status:
          type: string
        text:
          type: string
    image_file:
      type: string
    journey_image_file:
      type: string
    analysis_image_file:
      type: string
    model_id:
      type: string
    name:
      type: string
    portfolio:
      type: object
      properties:
        effort_estimation:
          type: number
        needs_addressed:
          type: number
        relevance:
          type: number
    skeleton:
      type: string
    state:
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
    widget_config:
      type: string
    last_viewed:
      type: string
      format: date-time
    rated_by:
      type: object
      additionalProperties:
        type: object
        properties:
          rating:
            type: number
          rated_time:
            type: string
            format: date-time
    autorun:
      type: boolean
    related_ea_components:
      type: string
    partner_logo:
      type: string
    created_by:
      type: string
    executed_turns:
      type: integer
    language:
      type: string
      default: python
    requirements:
      type: string
    requirements_data:
      type: object
    flow:
      type: object
    editors_choice:
      type: boolean
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### OpenAPI (Swagger)

```yaml
/v2/prototypes:
  get:
    summary: List prototypes
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Prototypes list
  post:
    summary: Create prototype
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatePrototypeRequest'
    responses:
      '201':
        description: Created

/v2/prototypes/bulk:
  post:
    summary: Bulk create prototypes
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/BulkCreatePrototypeRequest'
    responses:
      '201':
        description: Created

/v2/prototypes/recent:
  get:
    summary: List recent prototypes
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Recent prototypes

/v2/prototypes/popular:
  get:
    summary: List popular prototypes
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Popular prototypes

/v2/prototypes/{id}:
  get:
    summary: Get prototype by ID
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Prototype
  patch:
    summary: Update prototype
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdatePrototypeRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete prototype
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content

/v2/prototypes/{id}/execute-code:
  post:
    summary: Execute code for a prototype
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ExecuteCodeRequest'
    responses:
      '200':
        description: Execution result
```
