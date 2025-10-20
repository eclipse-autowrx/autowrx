## User Endpoints (/v2/users)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required + Admin | Create a user. |
| GET | / | Optional (strictAuth=false) | List users. |
| GET | /self | Required | Get current user profile. |
| PATCH | /self | Required | Update current user profile. |
| GET | /:userId | Optional (strictAuth=false) | Get a user by ID. |
| PATCH | /:userId | Required + Admin | Update a user. |
| DELETE | /:userId | Required + Admin | Delete a user. |

### Data Model

```yaml
User:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    email:
      type: string
      format: email
    password:
      type: string
    email_verified:
      type: boolean
      default: false
    image_file:
      type: string
    provider:
      type: string
      default: Email
    provider_user_id:
      type: string
    uid:
      type: string
    provider_data:
      type: array
      items:
        type: object
        properties:
          email:
            type: string
          providerId:
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
/v2/users:
  get:
    summary: List users
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
        description: Users list
  post:
    summary: Create user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateUserRequest'
    responses:
      '201':
        description: Created

/v2/users/self:
  get:
    summary: Get current user profile
    security:
      - bearerAuth: []
    responses:
      '200':
        description: User profile
  patch:
    summary: Update current user profile
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateSelfRequest'
    responses:
      '200':
        description: Updated user

/v2/users/{userId}:
  get:
    summary: Get user by ID
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: userId
        required: true
        schema:
          type: string
    responses:
      '200':
        description: User
  patch:
    summary: Update user by ID
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateUserRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete user by ID
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content
```
