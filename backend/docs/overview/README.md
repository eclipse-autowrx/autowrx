## Backend Overview

A high-level guide to the backend architecture, core modules, and how requests flow through the system.

### Stack
- Node.js + Express
- MongoDB with Mongoose
- Passport JWT for authentication (access token in Authorization header; refresh token via secure HTTP-only cookie)
- Socket.IO for realtime events
- Joi-based validations, structured error handling, request logging, and security hardening

### Entry Points
- `src/index.js`: Process entry. Connects to MongoDB, seeds roles/admins, starts HTTP server, initializes Socket.IO.
- `src/app.js`: Express application setup. Wires middlewares, Passport strategy, routes under `/v2`, proxies, and error handlers.

### Configuration
- `src/config/config.js`: Central configuration (environment, port, MongoDB URL, JWT and cookie settings, SMTP/email, client base URL, external service URLs like Auth, Email, Upload, Log, etc.).
- Environment variables documented in `src/docs/environment-variables.md` and `src/docs/configuration.md`.

Key JWT cookie options (via env): `secure`, `httpOnly`, `sameSite`, and optional `domain` in production.

### Middlewares
- Security and utilities: `helmet`, `cors`, `cookie-parser`, `compression`, `express-mongo-sanitize`, request logging with `morgan`.
- `src/middlewares/auth.js`: Authentication guard. Either forwards auth to an external Auth service (when configured) or uses local Passport JWT verification.
- `src/middlewares/permission.js`: Authorization/permission checks.
- `src/middlewares/validate.js`: Validates request inputs against schemas in `src/validations`.
- `src/middlewares/error.js`: Error converter/handler that normalizes errors and sets proper HTTP codes.

### Routing
- Base path: `/v2`
- Router index: `src/routes/v2/index.js` mounts feature routers:
  - `/auth`, `/users`, `/models`, `/prototypes`, `/apis`, `/discussions`, `/feedbacks`, `/permissions`, `/extendedApis`, `/search`, `/assets`, `/change-logs`, `/inventory/{schemas,relations,instances}`
- Each router delegates to controller methods in `src/controllers` and validation rules in `src/validations`.

### Controllers, Services, Models
- Controllers (`src/controllers/*.controller.js`) handle HTTP concerns: read inputs, invoke services, shape responses.
- Services (`src/services/*.service.js`) contain domain/business logic and external integrations (email, file, permissions, search, tokens, etc.).
- Models (`src/models/*.model.js`) define Mongoose schemas and persistence logic. `src/models/index.js` exports model registry.

### Authentication and Tokens
- Strategy: `src/config/passport.js` defines a JWT strategy. Access tokens must be sent as `Authorization: Bearer <token>`.
- Token lifecycle: `src/services/token.service.js` issues access/refresh tokens. Refresh tokens are persisted and set to an HTTP-only cookie on login/register/refresh.
- Auth endpoints: `src/controllers/auth.controller.js` handles register, login, logout, refresh, forgot/reset password, email verification, GitHub callback, and Microsoft SSO.

### Realtime (Socket.IO)
- `src/config/socket.js` bootstraps Socket.IO on the same HTTP server.
- Clients must provide `access_token` in the connection query. The token is verified and `socket.user` is attached on success.

### Proxies and External Services
- `src/config/proxyHandler.js` can forward or proxy requests to external services configured under `config.services` (Auth, Email, Upload, Log, etc.).

### Data and Docs
- `backend/data/`: VSS data files and related JSONs exposed via API routes.
- `src/docs/`: Swagger definition, environment/configuration docs for maintainers.

### Scripts
- `src/scripts/`: Operational scripts invoked at startup or manually (role initialization, admin assignment, migrations, scheduled checks).

### Tests
- `backend/tests/`: Unit and integration tests. Includes fixtures and coverage support. Run via Jest (`jest.config.js`).

### Directory Structure (Key Paths)
```
backend/
  data/                  # VSS and related data files
  docs/                  # Security/docs; this overview lives here
  src/
    app.js               # Express app setup
    index.js             # Entrypoint: connect Mongo, start server, init sockets
    config/              # config, logger, morgan, passport, roles, socket, tokens
    controllers/         # REST controllers per domain
    decorators/          # Data shaping/decorator utilities
    middlewares/         # auth, permission, validation, rate limiter, error
    models/              # Mongoose models + plugins
    routes/
      v2/                # Route definitions mounted at /v2
    services/            # Business logic and integrations
    typedefs/            # Shared typedefs/interfaces
    utils/               # Helper utilities
    validations/         # Joi schemas for request validation
    docs/                # Swagger/config documentation
    scripts/             # Startup/maintenance scripts
  tests/                 # Unit and integration tests
```

### Request Lifecycle
1. Client sends request to `/v2/<feature>` with `Authorization: Bearer <accessToken>` when required.
2. Middlewares run: logging, security, cookie parsing, sanitize, validation, auth, and permissions.
3. Controller delegates to a service; the service interacts with models/DB and external services if needed.
4. Response is serialized and sent. Errors are routed through the error converter/handler.

### Environment Essentials
- MongoDB URL, JWT secret and expirations, cookie name/options
- SMTP/email configuration
- Client base URL for redirects
- Optional service URLs (Auth, Email, Upload, Log)

For the exhaustive list and defaults, see `src/docs/environment-variables.md` and `src/docs/configuration.md`.

### Getting Oriented Quickly
- Start at `src/index.js` → `src/app.js` → `src/routes/v2/index.js`
- Pick a feature (e.g., users) and follow: route → controller → service → model.
- For auth flows, read: `src/config/passport.js`, `src/controllers/auth.controller.js`, and `src/services/token.service.js`.
- For realtime, read: `src/config/socket.js`.
