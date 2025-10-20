## Issue Endpoints (/v2/issues)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Optional (strictAuth=false) | Create an issue. |
| GET | / | Optional (strictAuth=false) | List issues. |
| GET | /by-api | Optional (strictAuth=false) | List issues by API. |
| GET | /:issueId | Optional (strictAuth=false) | Get issue by ID. |
| PATCH | /:issueId | Optional (strictAuth=false) | Update issue. |
| DELETE | /:issueId | Optional (strictAuth=false) | Delete issue. |

### Data Model

```yaml
Issue:
  type: object
  properties:
    id:
      type: string
    extendedApi:
      type: string
    link:
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
/v2/issues:
  get:
    summary: List issues
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Issues list
  post:
    summary: Create issue
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateIssueRequest'
    responses:
      '201':
        description: Created

/v2/issues/by-api:
  get:
    summary: List issues by API
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: apiId
        schema:
          type: string
    responses:
      '200':
        description: Issues

/v2/issues/{issueId}:
  get:
    summary: Get issue by ID
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: issueId
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Issue
  patch:
    summary: Update issue
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateIssueRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete issue
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content
```
