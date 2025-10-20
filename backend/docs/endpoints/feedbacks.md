## Feedback Endpoints (/v2/feedbacks)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create feedback. |
| GET | / | Optional (strictAuth=false) | List feedbacks. |
| PATCH | /:id | Required | Update feedback. |
| DELETE | /:id | Required | Delete feedback. |

### Data Model

```yaml
Feedback:
  type: object
  properties:
    id:
      type: string
    avg_score:
      type: number
      minimum: 1
      maximum: 5
    description:
      type: string
    created_by:
      type: string
    ref:
      type: string
    ref_type:
      type: string
    model_id:
      type: string
    question:
      type: string
    recommendation:
      type: string
    score:
      type: object
      properties:
        easy_to_use:
          type: integer
          minimum: 1
          maximum: 5
        need_address:
          type: integer
          minimum: 1
          maximum: 5
        relevance:
          type: integer
          minimum: 1
          maximum: 5
    interviewee:
      type: object
      properties:
        name:
          type: string
        organization:
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
/v2/feedbacks:
  get:
    summary: List feedbacks
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: ref
        schema:
          type: string
      - in: query
        name: ref_type
        schema:
          type: string
      - in: query
        name: id
        schema:
          type: string
      - in: query
        name: avg_score
        schema:
          type: number
      - in: query
        name: model_id
        schema:
          type: string
      - in: query
        name: created_by
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
      - in: query
        name: fields
        schema:
          type: string
    responses:
      '200':
        description: Feedbacks list
  post:
    summary: Create feedback
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateFeedbackRequest'
    responses:
      '201':
        description: Created

/v2/feedbacks/{id}:
  patch:
    summary: Update feedback
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
            $ref: '#/components/schemas/UpdateFeedbackRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete feedback
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
        description: No content
```