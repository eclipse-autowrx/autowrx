## Auth Endpoints (/v2/auth)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /authenticate | Required | Validate bearer access token; returns user. |
| POST | /authorize | None | Internal authorization check (do not expose publicly). |
| GET | /github/callback | None | GitHub OAuth callback. |
| POST | /sso | None | Microsoft SSO exchange; issues tokens. |
| POST | /register | None (only when strictAuth=false) | Register a new user. |
| POST | /login | None | Login with email/password; sets refresh cookie; returns access token + user. |
| POST | /logout | None | Logout and clear refresh cookie. |
| POST | /refresh-tokens | None | Refresh access/refresh tokens using refresh cookie. |
| POST | /forgot-password | None | Initiate password reset email. |
| POST | /reset-password | None | Reset password using token. |
| POST | /send-verification-email | Required | Send email verification to current user. |
| POST | /verify-email | None | Verify email using token. |

### OpenAPI (Swagger)

```yaml
/v2/auth/authenticate:
  post:
    summary: Validate access token and return user
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Authorized user
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string

/v2/auth/authorize:
  post:
    summary: Internal authorization endpoint
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AuthorizeRequest'
    responses:
      '200':
        description: Authorized

/v2/auth/github/callback:
  get:
    summary: GitHub OAuth callback
    responses:
      '302':
        description: Redirect on success or failure

/v2/auth/sso:
  post:
    summary: Microsoft SSO login
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              msAccessToken:
                type: string
    responses:
      '200':
        description: Tokens issued

/v2/auth/register:
  post:
    summary: Register a new user (strictAuth=false)
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RegisterRequest'
    responses:
      '201':
        description: Created

/v2/auth/login:
  post:
    summary: Login with email and password
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/LoginRequest'
    responses:
      '200':
        description: User and tokens

/v2/auth/logout:
  post:
    summary: Logout current session
    responses:
      '204':
        description: No content

/v2/auth/refresh-tokens:
  post:
    summary: Refresh access and refresh tokens
    responses:
      '200':
        description: New tokens

/v2/auth/forgot-password:
  post:
    summary: Initiate password reset
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
    responses:
      '204':
        description: Email sent

/v2/auth/reset-password:
  post:
    summary: Reset password with token
    parameters:
      - in: query
        name: token
        schema:
          type: string
        required: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              password:
                type: string
    responses:
      '204':
        description: No content

/v2/auth/send-verification-email:
  post:
    summary: Send verification email
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content

/v2/auth/verify-email:
  post:
    summary: Verify email with token
    parameters:
      - in: query
        name: token
        schema:
          type: string
        required: true
    responses:
      '204':
        description: No content
```
