# Environment Variables Documentation

## Core Application Settings

| Variable       | Description                                                     | Default                                       |
| -------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`     | Environment type (production, development, test)                | -                                             |
| `NAME`          | Environment name for container naming (dev, prod)               | -                                             |
| `PORT`         | Application port                                                | `8080`                                        |
| `MONGODB_URL`  | MongoDB connection URL                                          | `mongodb://playground-db:27017/playground-be` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated regex patterns). See [CORS Configuration Guide](../../../docs/reference/cors.md) for details | `localhost:\\d+,127\\.0\\.0\\.1:\\d+`         |

### CORS_ORIGINS Examples

The `CORS_ORIGINS` variable accepts comma-separated regex patterns. The system automatically adds `http://` and `https://` prefixes.

- **Development + Production IP**: `localhost:\\d+,127\\.0\\.0\\.1:\\d+,139\\.59\\.98\\.13:\\d+`
- **With Domain**: `localhost:\\d+,127\\.0\\.0\\.1:\\d+,yourdomain\\.com,.*\\.yourdomain\\.com`
- **Production Only**: `yourdomain\\.com,.*\\.yourdomain\\.com`

**Important**: Remember to escape dots with `\\.` and use `\\d+` for any port number. See the [CORS Configuration Guide](../../../docs/reference/cors.md) for complete documentation.

## Authentication & Security

| Variable                        | Description                             | Default |
| ------------------------------- | --------------------------------------- | ------- |
| `JWT_SECRET`                    | Secret key for JWT signing; also verifies tokens without a `kid` and derives the at-rest encryption key, so keep it stable | -       |
| `JWT_KEYS`                      | Optional JSON key ring for rotation, e.g. `{"2026-10":"<secret>","2026-04":"<old>"}`. Unset = `JWT_SECRET` under kid `default` | -       |
| `JWT_ACTIVE_KID`                | Key id in `JWT_KEYS` that signs new tokens (required when `JWT_KEYS` is set) | `default` |
| `JWT_ACCEPT_LEGACY_SECRET`      | Keep accepting tokens signed with `JWT_SECRET` (kid `default` or no kid) after rotation. Turn off once they have expired | `true` |
| `RATE_LIMIT_ENABLED`            | Rate-limit brute-forceable auth endpoints (login, register, refresh, forgot/reset password, verify email, SSO) | `true` (`false` when `NODE_ENV=test`) |
| `AUTH_RATE_LIMITS`              | JSON overrides per limiter (`authIp`, `login`, `register`, `refresh`, `forgotPassword`, `resetPassword`, `verifyEmail`, `sso`), e.g. `{"login":{"max":20,"windowMs":900000}}` | - |
| `TRUST_PROXY`                   | Express `trust proxy`: hop count, `true`/`false`, or subnet list. Must match your proxy setup or clients can spoof their IP and bypass rate limits | `1` |
| `JWT_ACCESS_EXPIRATION_MINUTES` | Access token expiration (minutes)       | `30`    |
| `JWT_REFRESH_EXPIRATION_DAYS`   | Refresh token expiration (days)         | `30`    |
| `JWT_COOKIE_NAME`               | JWT cookie name                         | `token` |
| `JWT_COOKIE_DOMAIN`             | JWT cookie domain (production only)     | -       |
| `ADMIN_EMAILS`                  | Admin emails (comma- or semicolon-separated) | -       |
| `ADMIN_PASSWORD`                | Auto-provisioned admin password         | -       |
| `ADMIN_CLEAN_MODE`              | When `true`, hide lean-deploy Site Config sections and limit Manage Features categories (also accepts `VITE_ADMIN_CLEAN_MODE`) | unset (= show all) |
| `ADMIN_HIDDEN_SITE_CONFIG_SECTIONS` | Comma-separated Site Config section keys to hide; overrides clean-mode default (also `VITE_ADMIN_HIDDEN_SITE_CONFIG_SECTIONS`) | - |
| `ADMIN_VISIBLE_FEATURE_CATEGORIES` | Comma-separated Manage Features category names to show; overrides clean-mode default (also `VITE_ADMIN_VISIBLE_FEATURE_CATEGORIES`) | - |
| `GITHUB_CLIENT_ID`              | GitHub OAuth client ID                  | -       |
| `GITHUB_CLIENT_SECRET`          | GitHub OAuth client secret              | -       |

### Rotating the JWT signing key

Tokens carry the signing key id in their `kid` header and are verified against the matching key in the ring. Until you rotate, every token is signed with `JWT_SECRET` under kid `default`; tokens issued before kid support have no `kid` and are also verified with `JWT_SECRET`.

1. Set `JWT_KEYS` to the new key, e.g. `{"2026-10":"<new secret>"}`, and `JWT_ACTIVE_KID=2026-10`, then restart. New tokens are signed with it. Tokens signed with `JWT_SECRET` keep verifying (it stays in the ring as `default` while `JWT_ACCEPT_LEGACY_SECRET=true`), so nobody is logged out.
2. After `JWT_REFRESH_EXPIRATION_DAYS` (default 30), set `JWT_ACCEPT_LEGACY_SECRET=false` to stop accepting `JWT_SECRET`-signed tokens.
3. For later rotations, add the next key to `JWT_KEYS` beside the current one, switch `JWT_ACTIVE_KID`, and remove the old key after another refresh-expiry period.

Do not change `JWT_SECRET` itself: it derives the at-rest encryption key for stored secrets (`utils/encryption.js`).

> Note on ADMIN_EMAILS and ADMIN_PASSWORD: On startup, the system checks for the existence of each email address listed in ADMIN_EMAILS. If all admin accounts already exist, the initialization process is skipped. Otherwise, the system automatically creates any missing admin accounts using the password specified in ADMIN_PASSWORD.

## External Services

| Variable              | Description                                                                      | Default                 |
| --------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `CLIENT_BASE_URL`     | Client application URL. Used to redirect after GitHub login                      | `http://localhost:3000` |

## Infrastructure

| Variable                      | Description             | Default                |
| ----------------------------- | ----------------------- | ---------------------- |
| `DB_CONTAINER_NAME`           | Database container name | `${NAME}-playground-db` |
| `LOGS_MAX_SIZE`               | Maximum log size (MB)   | `100`                  |

**Note:** For development (`NODE_ENV=development`), JWT access tokens have extended expiration times for convenience.
