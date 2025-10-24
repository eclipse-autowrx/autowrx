# Playground Backend

A Node.js backend application built with Express and MongoDB, designed to provide a RESTful API for various services.

## Overview

This project serves as the backend for the playground, offering endpoints for:

- Authentication & Authorization
- User management
- Models
- Prototypes
- APIs
- Discussions
- Feedback
- Permissions
- Extended APIs
- Issues
- Search
- Assets
- Change logs

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Prepare the environment variables

- Copy `.env.example` to `.env`
- The `.env` file includes the minimal configurations required to run the application.
- For detailed information on configuration options, refer to the [Environment Variables Documentation.](#user-content-environment-variables-documentation)

### Running the Application

- **Development Mode**:

  ```bash
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up
  ```

  Access backend at http://localhost:9800

- **Production Mode**:

  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up
  ```

  Access backend at http://localhost:9800

  For more detail guideline on setting up a complete instance, please refer to: [Instance Setup Guideline](http://github.com/eclipse-autowrx/instance-setup)

###

## Project Structure

```bash
backend-core/
├── src/
│   ├── config/             # Configuration files (env, logger, passport, etc.)
│   ├── controllers/        # Route controllers (business logic for each endpoint)
│   ├── docs/               # API documentation (Swagger/OpenAPI)
│   ├── middlewares/        # Custom Express middlewares
│   ├── models/             # Mongoose models (database schemas)
│   ├── routes/             # API route definitions
│   ├── scripts/            # Initialization and utility scripts
│   ├── services/           # Business logic and service layer
│   ├── utils/              # Utility functions and helpers
│   ├── validations/        # Request validation schemas
│   ├── app.js              # Express app setup
│   └── index.js            # Application entry point
├── docker-compose.yml      # Docker Compose base configuration
├── docker-compose.dev.yml  # Docker Compose configuration for dev environment
├── docker-compose.dev.yml  # Docker Compose configuration for prod environment
├── Dockerfile              # Docker build instructions
```

## API Endpoints

The API is available under the `/v2` prefix. Key endpoints include:

- **Auth**: `/v2/auth`
- **Users**: `/v2/users`
- **Models**: `/v2/models`
- **Prototypes**: `/v2/prototypes`
- **APIs**: `/v2/apis`
- **Discussions**: `/v2/discussions`
- **Feedbacks**: `/v2/feedbacks`
- **Permissions**: `/v2/permissions`
- **Extended APIs**: `/v2/extendedApis`
- **Issues**: `/v2/issues`
- **Search**: `/v2/search`
- **Assets**: `/v2/assets`
- **Change Logs**: `/v2/change-logs`

## Environment Variables Documentation

| Variable                                | Description                                                                               | Required | Default Value                         | Format/Example                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `ENV`                                   | Environment type for the application (e.g., prod, dev, test). Is used for container names | Yes      | None                                  | `dev`                                         |
| `PORT`                                  | Port on which the application runs                                                        | No       | 8080                                  | `8080`                                        |
| `KONG_PROXY_PORT`                       | Port for Kong proxy service                                                               | Yes      | None                                  | `9800`                                        |
| `KONG_NGINX_WORKER_PROCESSES`           | Number of Nginx worker processes for Kong                                                 | No       | auto                                  | `2`                                           |
| `MONGODB_URL`                           | MongoDB connection URL                                                                    | Yes      | None                                  | `mongodb://playground-db:27017/playground-be` |
| `DB_CONTAINER_NAME`                     | Name of the database container                                                            | Yes      | None                                  | `${ENV}-playground-db`                        |
| `CORS_ORIGIN`                           | Regex for allowed CORS origins                                                            | No       | `localhost:\\d+,127\\.0\\.0\\.1:\\d+` | `localhost:\\d+,127\\.0\\.0\\.1:\\d+`         |                                                          | Yes      | None                                  | `https://<your_domain>/api/upload`            |
| `JWT_SECRET`                            | Secret key for JWT signing                                                                | Yes      | None                                  | `examplesecret`                               |
| `JWT_ACCESS_EXPIRATION_MINUTES`         | Minutes after which access tokens expire                                                  | No       | `30`                                  | `30`                                          |
| `JWT_REFRESH_EXPIRATION_DAYS`           | Days after which refresh tokens expire                                                    | No       | `30`                                  | `30`                                          |
| `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` | Minutes after which reset password tokens expire                                          | No       | `10`                                  | `10`                                          |
| `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES`   | Minutes after which verify email tokens expire                                            | No       | `10`                                  | `10`                                          |
| `JWT_COOKIE_NAME`                       | Name of the cookie storing the refresh token                                              | No       | `token`                               | `refresh-token`                               |
| `JWT_COOKIE_DOMAIN`                     | Domain for the JWT cookie (used in production)                                            | No       | `''`                                  | `yourdomain.com`                              |
| `AUTH_URL`                              | URL for the authentication service                                                        | No       | None                                  | `auth_service_url`                            |
| `STRICT_AUTH`                           | Enable strict authentication mode (true/false)                                            | No       | None                                  | `true`                                        |
| `CACHE_URL`                             | URL for the cache service                                                                 | No       | None                                  | `your_cache_url`                              |
| `LOG_URL`                               | URL for the logging service                                                               | No       | None                                  | `your_log_url`                                |
| `CLIENT_BASE_URL`                       | Base URL for the client application                                                       | No       | `http://localhost:3000`               | `your_client_base_url`                        |
| `EMAIL_URL`                             | URL for a custom email service                                                            | No       | None                                  | `custom_email_service_url`                    |
| `EMAIL_API_KEY`                         | API key for the email service (default: Brevo)                                            | No       | None                                  | `youremailkey`                                |
| `EMAIL_ENDPOINT_URL`                    | Endpoint URL for the email service (default: Brevo)                                       | No       | None                                  | `email_api_endpoint_url`                      |
| `GITHUB_CLIENT_ID`                      | Client ID for GitHub OAuth authentication                                                 | No       | None                                  | `github_client_id`                            |
| `GITHUB_CLIENT_SECRET`                  | Client secret for GitHub OAuth authentication                                             | No       | None                                  | `github_client_secret`                        |
| `ADMIN_EMAILS`                          | Comma-separated list of admin email addresses. Use for auto provisioning admin users.     | No       | None                                  | `admin1@example.com,admin2@example.com`       |
| `ADMIN_PASSWORD`                        | Password for admin access                                                                 | No       | None                                  | `admin_password`                              |
| `LOGS_MAX_SIZE`                         | Maximum size of change logs in megabytes                                                  | No       | `100`                                 | `100`                                         |

## Notes

- **Validation**: The application uses Joi to validate environment variables. Missing required variables or invalid formats will throw a configuration error on startup.
- **CORS Configuration**: The `CORS_ORIGIN` variable accepts a comma-separated list of regex patterns for allowed origins. Ensure patterns are valid regex.
- **JWT Configuration**: The `JWT_COOKIE_DOMAIN` is only applied in production (`NODE_ENV=production`). Set it to the appropriate domain for your application.
- **Development Mode**: In `NODE_ENV=development`, JWT access token expiration is set to days instead of minutes for convenience.

## Troubleshooting

- **Validation Errors**: If the application fails to start with a "Config validation error," check that all required variables are set and match the expected format.
- **CORS Issues**: Verify that `CORS_ORIGIN` regex patterns are correct and include all necessary client origins.

## Contributing

This project is part of the open-source digital.auto initiative. Contributions are welcome.

## License

**License: [CC BY 4.0 (Creative Commons)](https://creativecommons.org/licenses/by/4.0/)**
You are free to share and adapt the material for any purpose, even commercially, with appropriate attribution.
