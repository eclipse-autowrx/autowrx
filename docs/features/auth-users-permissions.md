# Auth, Users & Permissions

How identity, access, and admin work. Backend: `routes/v2/user-management/`, `services/auth.service.js`, `services/token.service.js`, `config/passport.js`, `config/roles.js`. Frontend: `stores/authStore.ts`, `services/auth.service.ts`, `hooks/usePermissionHook.ts`, `pages/PageManageUsers.tsx`.

## Authentication

JWT access tokens (short-lived, in memory, sent as `Authorization: Bearer`) + refresh tokens (long-lived, persisted server-side, sent as an `httpOnly` cookie). Refresh is single-flight with a request queue on 401; on failure the user is logged out. See [Auth & Security](../architecture/auth-security.md) for internals.

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Login / Register / Logout / Refresh | Email+password auth with refresh-cookie rotation. | `POST /v2/auth/{login,register,logout,refresh-tokens}` | Register gated by `SELF_REGISTRATION`; others public |
| Password reset & email verify | 6-digit code reset (60 min, emailed) — primary; legacy token reset retained; email verification. | `POST /v2/auth/{forgot-password,reset-password,verify-email,send-verification-email}` | Password changes gated by `PASSWORD_MANAGEMENT` |
| SSO (OIDC + GitHub) | Login via configurable SSO providers (`SSO_PROVIDERS`); Microsoft-style ID-token login + GitHub OAuth. | `POST /v2/auth/sso`, `GET /v2/auth/github-sso/{start,callback}`, `GET /v2/auth/github/callback` (legacy link) | Auto-registration gated by `SSO_AUTO_REGISTRATION` |

## Users & profile

| Feature | What it does | Key endpoints / pages | Gating |
|---|---|---|---|
| User management | CRUD over users; admin create/update/delete; emails masked in responses. | `GET/POST /v2/users`, `GET/PATCH/DELETE /v2/users/:userId` | List/Get optional (`PUBLIC_VIEWING`); write requires `MANAGE_USERS` |
| Self profile | View/edit display name + avatar; change password. | `GET/PATCH /v2/users/self`, page `/profile` | Auth; password change by `PASSWORD_MANAGEMENT` |
| Manage Users (admin) | Paginated user list, search, create, per-user role/permission management. | page `/admin/manage-users` | `MANAGE_USERS` |
| Manage Features (admin) | Feature categories + add/remove users per feature/role. | page `/manage-features` | `MANAGE_USERS` |

## Permissions (RBAC)

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| RBAC v1 (primary) | Resource-scoped roles → permissions bound to a `ref` (model/asset id or `*`); owners bypass. | `GET /v2/permissions/{self,roles,has-permission,users-by-roles}`, `POST/DELETE /v2/permissions` | Self/roles/has-permission auth; assign/remove + users-by-roles `MANAGE_USERS` |
| Casbin RBAC v2 | Second-gen authorization (`owner/writer/reader` grouping policies) via the internal authorize endpoint. | `POST /v2/auth/authorize` | Auth; policy assignment admin. *Partial* — v1 remains primary for resource checks |

**Frontend permission checks** batch `[permission, resourceId]` tuples to `GET /v2/permissions/has-permission` (returns `boolean[]`, defaults denied) via `usePermissionHook`. Constants: `READ_MODEL`, `WRITE_MODEL`, `MANAGE_USERS`, `USE_GEN_AI`, `UNLIMITED_MODEL`, `READ_ASSET`, `WRITE_ASSET`, `DEPLOY_HARDWARE`, `LEARNING_MODE`.