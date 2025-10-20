## Change Log Endpoints (/v2/change-logs)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Optional (strictAuth=false) + Admin | List change logs. |

### Data Model

```yaml
ChangeLog:
  type: object
  properties:
    id:
      type: string
    created_by:
      type: string
    description:
      type: string
    ref_type:
      type: string
    ref:
      type: string
    action:
      type: string
      enum: [CREATE, UPDATE, DELETE]
    changes:
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
/v2/change-logs:
  get:
    summary: List change logs
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Change logs
```
