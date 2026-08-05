# Cluster: Identity & Access

Authentication, identity, and authorization. Backend: `routes/v2/user-management/`, `services/auth.service.js`, `services/token.service.js`, `config/passport.js`, `config/roles.js`. Frontend: `stores/authStore.ts`, `hooks/usePermissionHook.ts`.

---

## Login / logout / token refresh

- **Description:** Email+password login issuing a short-lived JWT access token (returned in the response body) and a long-lived refresh token set as an `httpOnly` cookie; refresh rotates the cookie and returns a new access token; logout revokes the refresh token and clears the cookie.
- **Who uses it / value:** All end users (sign in); every downstream capability depends on a valid session. DevOps rely on it for access control.
- **Acceptance criteria:**
  - `POST /v2/auth/login {email,password}` → `200` with `{ user, tokens }` where `tokens` contains only `access` (refresh is **not** in the body); sets the `token` cookie (httpOnly; `Secure`+`SameSite=None` in prod, `Lax` in dev; `domain` only in prod). Invalid credentials → `401`. SSO-only account (no password) → `403`.
  - `POST /v2/auth/refresh-tokens` with the cookie → `200` `{ tokens: { access } }` + rotated cookie. Missing/expired/revoked cookie → `401`.
  - `POST /v2/auth/logout` with the cookie → `204`, refresh token document deleted, cookie cleared.
  - 401s on `/auth/refresh-tokens`, `/auth/login`, `/auth/logout` are **not** retried (no refresh loop); other 401s trigger a single-flight refresh + queued-request replay, then `logOut()` on refresh failure.
- **Quality control:** Sign in via UI → confirm `token` cookie present and `authStore.access` populated → reload keeps session; wrong password → error toast; let access token expire → silent refresh keeps session; logout → cookie gone, protected routes redirect to sign-in.
- **Security:** Access token short-lived (`JWT_ACCESS_EXPIRATION_MINUTES`, 30 min prod / 30 days in dev), never persisted. Refresh token persisted server-side (`Token` collection, no TTL index), revoked on logout. `trust proxy` enabled. ⚠️ `authLimiter` is defined (`rateLimiter.js`) but **not applied to any route** — login endpoints are effectively unrate-limited (known gap).
- **Data protection:** Passwords hashed (`bcrypt`) and marked `private` (never returned in user objects). Refresh cookie is `httpOnly` (no JS access); `Secure`/`SameSite=None`/`domain` apply only in production. Access tokens live only in memory (`authStore`), not persisted client-side.

## Registration

- **Description:** Self-service account creation that issues tokens and sets the refresh cookie.
- **Who uses it / value:** New end users (sign up); admins benefit from reduced account-provisioning load.
- **Acceptance criteria:**
  - `POST /v2/auth/register` → `201` `{ user, tokens }` (refresh in cookie only) when `SELF_REGISTRATION` is enabled.
  - When `SELF_REGISTRATION` is disabled → `403`. Duplicate email → `400` (`email already taken`).
  - A welcome email is sent (non-blocking — failure doesn't fail registration).
- **Quality control:** With `SELF_REGISTRATION=true` register a new email → `201` + session cookie; with it `false` → `403`; reuse an existing email → `400`.
- **Security:** Gated by the `SELF_REGISTRATION` site auth flag; no admin needed. Email uniqueness enforced.
- **Data protection:** Stores `email` (unique, lowercased), hashed `password`, `email_verified=false`. Email masked in public list responses.

## Password reset & email verification

- **Description:** Code-based password reset (primary): a 6-digit code is emailed, valid 60 minutes, verified with `{email, code, password}`. Legacy token-based reset (`?token`) retained. Email verification issues a verify token.
- **Who uses it / value:** End users who lost a password or need to verify email; admins (fewer password reset requests).
- **Acceptance criteria:**
  - `POST /v2/auth/forgot-password {email}` → `200 { message }` (always, to avoid user enumeration) and emails a 6-digit code (60 min). Reset events are logged.
  - `POST /v2/auth/reset-password` with `{email, code, password}` (primary) → `204`; or `?token` + `{password}` (legacy) → `204`. Missing both → `400`. Wrong/expired code → `400`.
  - `POST /v2/auth/send-verification-email` (auth) → `204` and emails a verify token; `POST /v2/auth/verify-email?token=…` → `204`, sets `email_verified=true`.
  - Password changes require the `PASSWORD_MANAGEMENT` flag.
- **Quality control:** Trigger forgot-password → receive code → reset → log in with new password; try an expired/wrong code → `400`; verify-email → `email_verified` flips true.
- **Security:** Reset codes persisted in `Token` (`type=RESET_PASSWORD`); existing reset tokens for the user are deleted on each `forgot-password` (single-use). Password change gated by `PASSWORD_MANAGEMENT`. Forgot-password logs the event (to the log service).
- **Data protection:** Codes/tokens are one-time, short-lived, and deleted on use. Passwords hashed; never logged. Email is the recovery handle.

## SSO (OIDC ID-token + GitHub OAuth)

- **Description:** Single sign-on via configurable providers in `SSO_PROVIDERS`. Microsoft-style providers use an OIDC ID-token flow (`parseIdToken`); GitHub uses a full OAuth code-exchange. Auto-registers on first login when `SSO_AUTO_REGISTRATION` is enabled. A legacy GitHub callback links an existing account.
- **Who uses it / value:** End users (passwordless login); enterprises (SSO integration); DevOps/integrators (configure providers).
- **Acceptance criteria:**
  - `POST /v2/auth/sso {providerId, idToken}` → validates the provider is enabled, decodes the ID token, creates/updates the user, issues tokens + cookie → `200 { user, tokens }`. Disabled/invalid provider → `400`.
  - `GET /v2/auth/github-sso/start` → redirects to GitHub; `GET /v2/auth/github-sso/callback` → exchanges code, fetches profile/emails, logs in.
  - First SSO login creates an account only if `SSO_AUTO_REGISTRATION` is true; otherwise a matching existing account is required.
  - `GET /v2/auth/github/callback` (legacy) → exchanges code and emits the token over the user's socket for account linking.
- **Quality control:** Configure a provider in Admin → Site Config → SSO; sign in via the provider button → account created/linked and session established; disable the provider → button hidden / `400`.
- **Security:** Provider `clientSecret`s are **encrypted at rest** (`utils/encryption.js`), decrypted only for admin display. `callMsGraph` is deprecated (ID-token flow uses only OpenID scopes). Auto-registration gated by `SSO_AUTO_REGISTRATION`.
- **Data protection:** SSO provider secrets never exposed to non-admins (public list returns only enabled providers without secrets). SSO-linked users store `provider`/`provider_user_id`/`provider_data`; password optional for SSO accounts.

## User profile

- **Description:** Self-service read/update of display name and avatar; change password (when `PASSWORD_MANAGEMENT` is enabled).
- **Who uses it / value:** End users (manage their identity/avatar).
- **Acceptance criteria:**
  - `GET /v2/users/self` (auth) → `200` current user. `PATCH /v2/users/self` → `200` updated user (name/avatar; password only when `PASSWORD_MANAGEMENT=true`).
- **Quality control:** Open `/profile` → edit name → save → name updates across the UI; change password → log in with new password.
- **Security:** Auth required; self only (no cross-user self-edit).
- **Data protection:** Avatar stored as a file path; password hashed and `private` (never returned).

## User management (admin)

- **Description:** Admin CRUD over users; public listing gated by `PUBLIC_VIEWING`; emails masked in responses.
- **Who uses it / value:** Admins (provision/manage users); end users (discoverable profiles when `PUBLIC_VIEWING`).
- **Acceptance criteria:**
  - `GET /v2/users` (optional auth via `PUBLIC_VIEWING`) → `200` paginated list (emails masked). `POST /v2/users` → `201` (admin). `GET/PATCH/DELETE /v2/users/:userId` → `200`/`200`/`204` (admin).
  - Non-admin write → `403`. `includeFullDetails` query requires admin.
- **Quality control:** As admin, create/list/update/delete a user → works; as non-admin, writes → `403`; with `PUBLIC_VIEWING=false` and signed-out, list → `401`.
- **Security:** Writes require `MANAGE_USERS`. Read of `includeFullDetails` admin-gated.
- **Data protection:** Email masking in list responses; `password` field `private`; `includeFullDetails` admin-only.

## RBAC v1 (primary)

- **Description:** Resource-scoped roles granting permissions bound to a `ref` (model/asset id or `*`); owners bypass checks. Used by `checkPermission` middleware and `usePermissionHook`.
- **Who uses it / value:** Model/asset owners (grant access); admins (assign global roles); end users (only see what they're permitted).
- **Acceptance criteria:**
  - `GET /v2/permissions/self` (auth) → own roles. `GET /v2/permissions` → all permissions. `GET /v2/permissions/has-permission?permissions=readModel,writeModel:modelId` → `boolean[]` in order (defaults denied).
  - `POST /v2/permissions {user,role,ref}` (admin) → `201` assigns role. `DELETE /v2/permissions?user=&role=` (admin) → `204` removes.
  - `GET /v2/permissions/users-by-roles` (admin) → users grouped by role (no `role` filter).
  - Owner of a resource bypasses the permission check for that resource.
- **Quality control:** Assign a user `writeModel:<modelId>` → they can edit that model; remove it → edits `403`; `has-permission` with a missing/unknown permission → `false`.
- **Security:** Assign/remove require `MANAGE_USERS`; `has-permission` requires auth. Owners bypass — ensure ownership transfers are intentional.
- **Data protection:** UserRole records bind `(user, role, ref)` (unique); no secrets stored.

## Casbin RBAC v2 (partial)

- **Description:** Second-generation authorization using Casbin + mongoose adapter with `owner/writer/reader` grouping policies and `enforce(sub, act, obj)` via the internal authorize endpoint.
- **Who uses it / value:** Integrators building programmatic auth checks; future migration target.
- **Acceptance criteria:**
  - `POST /v2/auth/authorize {permissionQuery}` (auth) → boolean enforce result.
  - `hasPermissionV2` / `assignRoleToUserV2` available in `permission.service`.
- **Quality control:** Call `/authorize` with a permitted subject/action/object → `true`; with a denied one → `false`.
- **Security:** Auth required; policy assignment is admin. **Partial** — v1 remains the primary path for most resource checks.
- **Data protection:** Casbin policies stored via mongoose adapter; no secrets.

## Manage Users & Manage Features (admin)

- **Description:** Admin UIs to manage users (`/admin/manage-users`) and feature/role assignments (`/manage-features`).
- **Who uses it / value:** Admins (provision users, grant capabilities).
- **Acceptance criteria:**
  - `/admin/manage-users`: paginated list with search, create user, per-user role/permission actions.
  - `/manage-features`: feature categories sidebar (permission roles) + add/remove users per feature.
  - Non-admin → `403`.
- **Quality control:** As admin, create a user and grant a feature role → the user gains that capability; revoke → loses it; as non-admin, page → `403`/hidden.
- **Security:** Both require `MANAGE_USERS`.
- **Data protection:** Operates on user/role records; no secrets surfaced beyond what user management already exposes.