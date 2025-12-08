# Environment Variables Documentation

## Core Application Settings

| Variable       | Description                                                     | Default                                       |
| -------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`     | Environment type (production, development, test)                | -                                             |
| `NAME`          | Environment name for container naming (dev, prod)               | -                                             |
| `PORT`         | Application port                                                | `8080`                                        |
| `MONGODB_URL`  | MongoDB connection URL                                          | `mongodb://playground-db:27017/playground-be` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated regex patterns). See [CORS Configuration Guide](../../../CORS_CONFIGURATION.md) for details | `localhost:\\d+,127\\.0\\.0\\.1:\\d+`         |

### CORS_ORIGINS Examples

The `CORS_ORIGINS` variable accepts comma-separated regex patterns. The system automatically adds `http://` and `https://` prefixes.

- **Development + Production IP**: `localhost:\\d+,127\\.0\\.0\\.1:\\d+,139\\.59\\.98\\.13:\\d+`
- **With Domain**: `localhost:\\d+,127\\.0\\.0\\.1:\\d+,yourdomain\\.com,.*\\.yourdomain\\.com`
- **Production Only**: `yourdomain\\.com,.*\\.yourdomain\\.com`

**Important**: Remember to escape dots with `\\.` and use `\\d+` for any port number. See the [CORS Configuration Guide](../../../CORS_CONFIGURATION.md) for complete documentation.

## Authentication & Security

| Variable                        | Description                             | Default |
| ------------------------------- | --------------------------------------- | ------- |
| `JWT_SECRET`                    | Secret key for JWT signing              | -       |
| `JWT_ACCESS_EXPIRATION_MINUTES` | Access token expiration (minutes)       | `30`    |
| `JWT_REFRESH_EXPIRATION_DAYS`   | Refresh token expiration (days)         | `30`    |
| `JWT_COOKIE_NAME`               | JWT cookie name                         | `token` |
| `JWT_COOKIE_DOMAIN`             | JWT cookie domain (production only)     | -       |
| `ADMIN_EMAILS`                  | Admin email addresses (comma-separated) | -       |
| `ADMIN_PASSWORD`                | Auto-provisioned admin password         | -       |
| `GITHUB_CLIENT_ID`              | GitHub OAuth client ID                  | -       |
| `GITHUB_CLIENT_SECRET`          | GitHub OAuth client secret              | -       |

> Note on ADMIN_EMAILS and ADMIN_PASSWORD: On startup, the system checks for the existence of each email address listed in ADMIN_EMAILS. If all admin accounts already exist, the initialization process is skipped. Otherwise, the system automatically creates any missing admin accounts using the password specified in ADMIN_PASSWORD.

## External Services

| Variable              | Description                                                                      | Default                 |
| --------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `CLIENT_BASE_URL`     | Client application URL. Used to redirect after GitHub login                      | `http://localhost:3000` |

## Infrastructure

| Variable                      | Description             | Default                |
| ----------------------------- | ----------------------- | ---------------------- |
| `DB_CONTAINER_NAME`           | Database container name | `${NAME}-playground-db` |
| `KONG_PROXY_PORT`             | Kong API gateway port   | `9800`                 |
| `KONG_NGINX_WORKER_PROCESSES` | Kong Nginx workers      | `auto`                 |
| `LOGS_MAX_SIZE`               | Maximum log size (MB)   | `100`                  |

**Note:** For development (`NODE_ENV=development`), JWT access tokens have extended expiration times for convenience.
