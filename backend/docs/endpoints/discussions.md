## Discussion Endpoints (/v2/discussions)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create a discussion. |
| GET | / | Optional (when PUBLIC_VIEWING enabled) | List discussions. |
| PATCH | /:id | Required | Update discussion. |
| DELETE | /:id | Required | Delete discussion. |

### Data Model

```yaml
Discussion:
  type: object
  properties:
    id:
      type: string
    content:
      type: string
    created_by:
      type: string
    ref:
      type: string
    ref_type:
      type: string
    parent:
      type: string
      nullable: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### OpenAPI (Swagger)

```yaml
/v2/discussions:
  get:
    summary: List discussions (top-level, requires ref)
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: ref
        required: true
        schema:
          type: string
        description: Resource ID the discussions are attached to.
      - in: query
        name: ref_type
        schema:
          type: string
      - in: query
        name: sortBy
        schema:
          type: string
      - in: query
        name: limit
        schema:
          type: integer
      - in: query
        name: page
        schema:
          type: integer
    responses:
      '200':
        description: Discussions list (top-level only)
  post:
    summary: Create discussion
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateDiscussionRequest'
    responses:
      '201':
        description: Created

/v2/discussions/{id}:
  patch:
    summary: Update discussion
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateDiscussionRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete discussion
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content
```
