# Authentication and User REST API Guide

This document describes how Autowrx frontend talks to the backend for user authentication and profile operations. You can reuse these endpoints and payloads in other projects. Examples use a base URL composed as:

- Base URL: `${VITE_SERVER_BASE_URL}/${VITE_SERVER_VERSION}`
  - Default in this repo: `https://backend-core-dev.digital.auto/v2`
- All requests are sent with `withCredentials: true` and, when available, an `Authorization: Bearer <access_token>` header.

## Quick Start

- Login: POST `/auth/login` with `{ email, password }` → returns tokens
- Store `access.token` and send as `Authorization: Bearer ...`
- Fetch current user: GET `/users/self`
- Logout: POST `/auth/logout`

## Axios client behavior

- Requests include `Authorization: Bearer <token>` if present in the local auth store
- Cookies are sent (`withCredentials: true`)

```ts
// Constructed in src/services/base.ts
serverAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})
serverAxios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

## Auth token schema

```ts
// src/types/token.type.ts
export type Token = {
  token: string
  expires: string
}
export type AuthToken = {
  access: Token
  tokens: any // backend may include refresh or provider tokens
}
```

---

## Endpoints: Authentication

### POST /auth/login
- Purpose: Email/password login
- Request body:
```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```
- Response 200:
```json
{
  "access": { "token": "<JWT>", "expires": "2025-12-31T23:59:59.000Z" },
  "tokens": { /* optional extra tokens */ }
}
```

### POST /auth/register
- Purpose: Create an account
- Request body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "YourStrongPass!",
  "provider": "Email",            // optional, defaults to "Email"
  "image_file": "https://..."     // optional avatar URL
}
```
- Response 201:
```json
{
  "access": { "token": "<JWT>", "expires": "..." },
  "tokens": { }
}
```

### POST /auth/logout
- Purpose: Invalidate session/token
- Headers: `Authorization: Bearer <access_token>` (if applicable)
- Body: none
- Response 204 or 200

### POST /auth/forgot-password
- Purpose: Send reset password email
- Request body:
```json
{ "email": "user@example.com" }
```
- Response: 204 or 200

### POST /auth/reset-password?token=<resetToken>
- Purpose: Reset password using a reset token from email
- Query param: `token` (string)
- Request body:
```json
{ "password": "NewStrongPass!" }
```
- Response: 204 or 200

### POST /auth/sso
- Purpose: Single Sign-On exchange
- Request body:
```json
{ "msAccessToken": "<azure-ad-access-token>" }
```
- Response: 200 (implementation-defined; typically sets cookie or returns app tokens)

Notes:
- Frontend also uses Microsoft MSAL for interactive login (see `src/services/sso.service.ts`). That flow obtains an Azure AD token which can be exchanged via `/auth/sso`.

---

## Endpoints: User

### GET /users/self
- Purpose: Get current authenticated user profile
- Headers: `Authorization: Bearer <access_token>`
- Response 200 (example):
```json
{
  "id": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "image_file": "https://...",
  "email_verified": true,
  "roles": {
    "model_contributor": ["<modelId>"],
    "tenant_admin": [],
    "model_member": []
  }
}
```

### GET /users/{ids}
- Purpose: Get multiple users by IDs (comma-separated)
- Example: `/users/abc,def,ghi`
- Response 200: array of user objects

### GET /users
- Purpose: List users
- Query params (partial): pagination, filters, `includeFullDetails`
- Response 200:
```json
{
  "results": [ { /* User */ } ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

### POST /users
- Purpose: Create a user (admin-only)
- Request body (UserCreate):
```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "StrongPass!"
}
```
- Response 201: User

### PATCH /users/{id}
- Purpose: Update a user (admin/self, depending on backend rules)
- Request body (UserUpdate): fields to update; omit password or set empty string to avoid change
- Response 200: User

### DELETE /users/{id}
- Purpose: Delete a user (admin-only)
- Response: 204 or 200

### PATCH /users/self
- Purpose: Partial update of the currently authenticated user
- Request body: subset of User fields
- Response 200: updated User

---

## Endpoint: Permissions

These are useful for feature gating post-login.

### GET /permissions/has-permission?permissions=<perm1>:<context>,<perm2>
- Purpose: Check permissions in batch
- Request example: `permissions=writeModel:<model_id>,manageUsers`
- Response 200:
```json
[ true, false ]
```

### GET /permissions/users-by-roles
- Purpose: List users grouped by roles/features
- Response 200: array of `{ role, users }`

### POST /permissions
- Purpose: Assign a role to a user
- Body:
```json
{ "user": "<userId>", "role": "<roleId>" }
```

### DELETE /permissions?user=<userId>&role=<roleId>
- Purpose: Remove a role from a user

---

## Authentication Flow Summary

1. Register or login to obtain `access.token` and `expires`.
2. Store token client-side and attach as `Authorization: Bearer <token>` for subsequent API calls.
3. Fetch user profile via `/users/self` to drive UI and permissions.
4. Optionally check fine-grained permissions via `/permissions/has-permission`.
5. Logout by calling `/auth/logout` and clearing local credentials.

---

## Examples

### cURL

- Login
```bash
curl -X POST "https://backend-core-dev.digital.auto/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourPassword"}'
```

- Get Profile
```bash
curl -X GET "https://backend-core-dev.digital.auto/v2/users/self" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- Logout
```bash
curl -X POST "https://backend-core-dev.digital.auto/v2/auth/logout" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### JavaScript (axios)
```ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://backend-core-dev.digital.auto/v2',
  withCredentials: true,
})

async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  api.defaults.headers.common.Authorization = `Bearer ${data.access.token}`
  return data
}

async function getSelf() {
  const { data } = await api.get('/users/self')
  return data
}
```

---

## Environment variables

- `VITE_SERVER_BASE_URL` (default: `https://backend-core-dev.digital.auto`)
- `VITE_SERVER_VERSION` (default: `v2`)
- `VITE_REACT_SSO_CLIENT_ID`, `VITE_REACT_SSO_AUTHORITY` for Azure AD SSO
- `VITE_GITHUB_CLIENT_ID` for GitHub OAuth in specific flows

---

## Notes

- Backend may set/require cookies; keep `withCredentials: true`.
- Token expiry should be handled by your app (refresh flow is backend-specific; this project stores only `access` and relies on re-login or server cookies).
- Permission IDs used in the UI include: `readModel:<model_id>`, `writeModel:<model_id>`, `manageUsers`, `learningMode`, `generativeAI`, etc.
