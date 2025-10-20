## Permission Endpoints (/v2/permissions)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /self | Required | Get current user's roles/permissions. |
| GET | / | Required | List permissions (with filters). |
| GET | /has-permission | Required | Check if current user has a permission. |
| GET | /roles | Required | List available roles. |
| GET | /users-by-roles | Required + Admin | List users by roles. |
| POST | / | Required + Admin | Assign role to user. |
| DELETE | / | Required + Admin | Remove role from user. |

### Data Model

```yaml
Role:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    permissions:
      type: array
      items:
        type: string
    ref:
      type: string
    not_feature:
      type: boolean
```

### OpenAPI (Swagger)

```yaml
/v2/permissions/self:
  get:
    summary: Get current user's roles/permissions
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Roles/permissions

/v2/permissions:
  get:
    summary: List permissions
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: userId
        schema:
          type: string
    responses:
      '200':
        description: Permissions
  post:
    summary: Assign role to user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AssignRoleRequest'
    responses:
      '200':
        description: Assigned
  delete:
    summary: Remove role from user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RemoveRoleRequest'
    responses:
      '204':
        description: Removed

/v2/permissions/has-permission:
  get:
    summary: Check if current user has a permission
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: permission
        schema:
          type: string
    responses:
      '200':
        description: Result

/v2/permissions/roles:
  get:
    summary: List available roles
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Roles

/v2/permissions/users-by-roles:
  get:
    summary: List users by roles (admin)
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: role
        schema:
          type: string
    responses:
      '200':
        description: Users
```
