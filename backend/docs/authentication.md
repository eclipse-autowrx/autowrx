## Authentication

This document explains how authentication works in the backend: token model, cookies, middleware, endpoints, and environment-driven modes.

### Tokens and Sessions

- Access token
  - Type: JWT, bearer token in `Authorization: Bearer <token>`
  - Payload: `{ sub, iat, exp, type: 'access' }`
  - Lifetime: `JWT_ACCESS_EXPIRATION_MINUTES` (minutes; in development unit may be days)
- Refresh token
  - Type: JWT stored server-side in `Token` collection and sent to client in an HTTP-only cookie
  - Cookie name: `JWT_COOKIE_NAME` (default `token`)
  - Cookie options: `httpOnly: true` always; `secure` and `sameSite` flip by env — production: `secure: true`, `sameSite: 'None'`; development: `secure: false`, `sameSite: 'Lax'`. `domain` (`JWT_COOKIE_DOMAIN`) is set in production only.
  - Lifetime: `JWT_REFRESH_EXPIRATION_DAYS`
- Other tokens
  - Reset password: primary flow is a 6-digit **code** (not a JWT) stored in `Token`, expiring in **60 minutes** and used via `email` + `code`. A legacy JWT token path (`generateResetPasswordToken`, `JWT_RESET_PASSWORD_EXPIRATION_MINUTES`, default 10 min) via `?token` is retained for backward compatibility.
  - Verify email: short-lived JWT (`JWT_VERIFY_EMAIL_EXPIRATION_MINUTES`, default 10 min); stored and later invalidated.

#### Access token vs. Refresh token (where they appear and how to use)

- On login/register/SSO:
  - The server returns the **access token** in the JSON response body (`tokens.access`). Use this on every protected request as a bearer header: `Authorization: Bearer <access>`.
  - The server sets the **refresh token** in an HTTP-only cookie named by `JWT_COOKIE_NAME`. It is not returned in the body after we set the cookie.
- Refreshing:
  - Call `POST /v2/auth/refresh-tokens` with the refresh cookie included. The server rotates the refresh cookie and returns a new `tokens.access` in the body.
  - You do not send the refresh token in headers/body; the cookie carries it.
- Logout:
  - Call `POST /v2/auth/logout` with the refresh cookie present; the server revokes it and clears the cookie.

In short: **access token = short‑lived bearer in response body; refresh token = long‑lived cookie used only to obtain new tokens.**

### Authentication Middleware

- File: `src/middlewares/auth.js`
- Behavior:
  - If `AUTH_PROVIDER=platform`, reads identity from configured request headers via `platformAuth.service`, upserts the user in MongoDB, and sets a sanitized `req.user`.
  - Else if `AUTH_URL` is configured (deprecated), forwards the request to that URL to validate and returns a sanitized `user` on success.
  - Otherwise uses Passport JWT strategy to validate `Authorization: Bearer ...` and sets `req.user`.
  - Supports `auth({ optional: true })` for public routes; otherwise throws 401.

### Platform auth (header-based)

When deploying behind a platform that injects authenticated user identity via HTTP headers (e.g. Calponia), set `AUTH_PROVIDER=platform` instead of running a separate auth microservice.

- File: `src/services/platformAuth.service.js`
- User upsert: `src/services/user.service.js` → `upsertPlatformUser()`
- On each protected request, the middleware:
  1. Reads configured headers from the incoming request.
  2. Requires an `email` header (401 if missing).
  3. Computes display name from `firstname`/`lastname`, else `name`, else `"Anonymous"`.
  4. Upserts the user by email and sets `req.user`.

**Configuration**

| Variable | Description | Example |
|---|---|---|
| `AUTH_PROVIDER` | `jwt` (default) or `platform` | `platform` |
| `AUTH_PLATFORM_NAME` | Stored on `user.provider` | `Calponia` |
| `AUTH_PLATFORM_HEADERS` | JSON map of identity field → header name | see below |

```json
{
  "id": "x-calponia-user-id",
  "email": "x-calponia-user-email",
  "firstname": "x-calponia-user-firstname",
  "lastname": "x-calponia-user-lastname"
}
```

Optional key: `name` (single full-name header, used when first/last are absent).

**Migration from `AUTH_URL`**

Replace the external auth sidecar with:

```env
AUTH_PROVIDER=platform
AUTH_PLATFORM_NAME=Calponia
AUTH_PLATFORM_HEADERS={"id":"x-calponia-user-id","email":"x-calponia-user-email","firstname":"x-calponia-user-firstname","lastname":"x-calponia-user-lastname"}
# Remove AUTH_URL
```

**Security:** Only enable platform auth when the backend runs behind a trusted reverse proxy that strips client-supplied identity headers and injects trusted ones. Direct public exposure allows header spoofing.

### Passport JWT

- File: `src/config/passport.js`
- Strategy: `JwtStrategy` extracts bearer token, verifies signature with `JWT_SECRET`, and ensures payload `type === 'access'`.
- Subject lookup: loads a `User` by `payload.sub`; if absent, attempts `Asset` for asset-level access.

### Auth Endpoints

- File: `src/routes/v2/user-management/auth.route.js`
- Authenticate: `POST /v2/auth/authenticate` — requires bearer; returns `{ user }` from middleware.
- Authorize (internal): `POST /v2/auth/authorize` — internal permission checks, not public.
- Register (if `SELF_REGISTRATION` enabled): `POST /v2/auth/register` — creates user, sets refresh cookie, returns `{ user, tokens }` (without refresh token body).
- Login: `POST /v2/auth/login` — validates credentials, sets refresh cookie, returns `{ user, tokens }` (without refresh token body).
- Logout: `POST /v2/auth/logout` — revokes refresh token and clears refresh cookie.
- Refresh: `POST /v2/auth/refresh-tokens` — rotates refresh token, sets new cookie, returns new access token.
- Forgot/Reset password: issues and validates reset tokens.
- Email verification: issues verify token and validates it.
- SSO: `POST /v2/auth/sso` — accepts `{ providerId, idToken }` (an OpenID ID token, not a Microsoft access token), validates the provider via `sso.service`, decodes the ID token with `parseIdToken`, creates/updates the user, issues tokens and sets the refresh cookie. (`callMsGraph` is deprecated.) Also: GitHub SSO via `GET /v2/auth/github-sso/start` and `GET /v2/auth/github-sso/callback`.

### Token Service

- File: `src/services/token.service.js`
- `generateAuthTokens(user)`: returns `{ access: { token, expires }, refresh: { token, expires } }` and persists refresh token.
- `verifyToken(token, type)`: verifies signature and looks up persisted token by type and user.
- `generateResetPasswordCode(email)`: primary reset flow — issues a 6-digit code (60 min) stored in `Token`.
- `generateResetPasswordToken(email)` (legacy), `generateVerifyEmailToken(user)`: issue and persist single-use JWT tokens.

### Auth Service

- File: `src/services/auth.service.js`
- `loginUserWithEmailAndPassword(email, password)`; rejects SSO-only accounts for password login.
- `logout(refreshToken)`: removes persisted refresh token.
- `refreshAuth(refreshToken)`: verifies, deletes old, issues new pair via token service.
- `resetPassword(token, newPassword)` (legacy): validates a reset JWT and updates password.
- `resetPasswordWithCode(email, code, newPassword)`: primary code-based reset.
- `verifyEmail(token)`: validates token and marks email verified.

### Configuration

- File: `src/config/config.js`
- Important env vars:
  - `JWT_SECRET`, `JWT_ACCESS_EXPIRATION_MINUTES`, `JWT_REFRESH_EXPIRATION_DAYS`
  - `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` (default 10), `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` (default 10)
  - `JWT_COOKIE_NAME`, `JWT_COOKIE_DOMAIN`
  - `AUTH_PROVIDER` — `jwt` (default) or `platform` for header-based platform auth.
  - `AUTH_PLATFORM_NAME`, `AUTH_PLATFORM_HEADERS` — platform auth provider name and header map (required when `AUTH_PROVIDER=platform`).
  - `AUTH_URL` — deprecated external auth service; prefer built-in platform auth.
- Authentication settings (self-registration, public viewing, etc.) are configured via Site Configuration in the database, not environment variables.

### Request Lifecycle (Typical)

1. Client logs in via `/v2/auth/login` or `/v2/auth/sso`.
2. Server sets refresh token cookie; response body includes access token.
3. Client uses access token in `Authorization` header to call protected routes.
4. When access token expires, client calls `/v2/auth/refresh-tokens`; server rotates refresh token cookie and returns a new access token.
5. Client logs out via `/v2/auth/logout`; server revokes refresh token and clears cookie.

### Security Notes

- Refresh tokens are stored server-side and must be presented via HTTP-only cookie.
- Access tokens are short-lived and never persisted; treat as bearer tokens only.
- In production, error responses hide internal details; in development, stack traces may be included.

### ASCII flow diagrams

Login flow (email/password)

```
Client
  |
  | POST /v2/auth/login { email, password }
  v
Express Router (/src/routes/v2/user-management/auth.route.js)
  |
  | validate(authValidation.login)
  v
auth.controller.login
  |
  | authService.loginUserWithEmailAndPassword
  v
userService -> MongoDB(users)
  |
  v
tokenService.generateAuthTokens
  |
  | save refresh -> MongoDB(tokens)
  | set HTTP-only cookie (refresh)
  v
Response { user, tokens.access }
```

### Mongo data model (authentication-related)

Collections involved in authentication and user identity.

```yaml
users:
  fields:
    _id: string (ObjectId)
    name: string (required)
    email: string (required, unique, lowercase)
    password: string (hashed, optional for SSO)
    email_verified: boolean (default: false)
    image_file: string
    provider: string (default: Email)
    provider_user_id: string (present for SSO users)
    uid: string
    provider_data: array<{ email: string, providerId: string }>
    createdAt: date
    updatedAt: date

tokens:
  fields:
    _id: string (ObjectId)
    token: string (JWT value)
    user: string (ObjectId -> users._id)
    type: string (enum: refresh, resetPassword, verifyEmail — access tokens are never persisted)
    expires: date
    blacklisted: boolean (default: false)
    createdAt: date
    updatedAt: date
  notes:
    - Only refresh/reset/verify tokens are persisted; access tokens are not stored
    - The reset-password `token` value may be a 6-digit code (primary) or a JWT (legacy)

roles:  # authorization (used by permissions endpoints)
  fields:
    _id: string (ObjectId)
    name: string
    permissions: string[]
    ref: string
    not_feature: boolean

userroles:  # M:N join between users and roles
  fields:
    _id: string (ObjectId)
    user: string (ObjectId -> users._id)
    role: string (ObjectId -> roles._id)
    ref: string (ObjectId, optional resource scope)
  indexes:
    - unique: (user, role, ref, refType)
```

ER diagram

```
  users (1) ────────────────< tokens (many)
    |  _id                          |  user -> users._id
    |  email, password, ...         |  type: refresh/reset/verify
    v                               v
  userroles (many) >──────── (many) roles
    | user -> users._id             | _id, name, permissions[]
    | role -> roles._id
    | ref (optional scope)
```

How it ties together

- Login/SSO: issues access + refresh; refresh saved in `tokens` referencing `users._id`.
- Refresh: verifies existing refresh in `tokens`, rotates (delete old, save new), returns new access.
- Logout: deletes the refresh token document; cookie cleared.
- Reset/Verify: persist short-lived tokens in `tokens` until used.
- Authorization: roles and userroles support permission checks (outside of core authentication flow).

Protected request (bearer access token)

```
Client
  |
  | GET /v2/...  Authorization: Bearer <access>
  v
auth() middleware (/src/middlewares/auth.js)
  |-- if AUTH_PROVIDER=platform: read headers, upsert user
  |-- else if AUTH_URL (deprecated): POST to external auth -> returns user
  |-- else: passport-jwt verifies token, loads User/Asset
  v
req.user attached
  |
Controller -> Service -> MongoDB
  v
Response
```

Refresh tokens

```
Client
  |
  | POST /v2/auth/refresh-tokens  (Cookie: <refresh>)
  v
auth.controller.refreshTokens
  |
  | authService.refreshAuth
  |  - tokenService.verifyToken(refresh, REFRESH)
  |  - userService.getUserById
  |  - delete old refresh (rotate)
  |  - tokenService.generateAuthTokens
  |  - set new refresh cookie
  v
Response { tokens.access }
```

Logout

```
Client
  |
  | POST /v2/auth/logout (Cookie: <refresh>)
  v
auth.controller.logout
  |
  | authService.logout -> revoke refresh in MongoDB(tokens)
  | clear refresh cookie
  v
204 No Content
```

SSO (Microsoft)

```
Client
  |
  | POST /v2/auth/sso { providerId, idToken }
  v
auth.controller.sso
  |
  | ssoService.getSSOProviderById | authService.parseIdToken(idToken, providerId)
  | userService.getUserByEmail | create/update
  | tokenService.generateAuthTokens
  | set refresh cookie
  v
Response { user, tokens.access }
```

