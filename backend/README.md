# AutoWRX Backend

The AutoWRX backend is a Node.js/Express API server for the AutoWRX platform. It provides authentication, user and asset management, vehicle data APIs, plugin management, site configuration, realtime updates, and an AAOS bridge for frontend plugins and external automotive runtimes.

## What It Provides

- Authentication with access tokens and HTTP-only refresh-token cookies
- User, role, permission, and asset APIs
- Model, prototype, vehicle API, extended API, and custom API set APIs
- Plugin and template management
- Site configuration APIs for runtime feature/configuration control
- Discussion, feedback, search, file, health, and change-log APIs
- AAOS bridge endpoints for forwarding SOME/IP subscription requests to a Rust bridge service

## Requirements

- Node.js 12 or newer
- MongoDB
- Optional: an AAOS Rust bridge service if you use the AAOS bridge

## Setup

Create a backend environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Start the backend in development mode:

```bash
npm run dev
```

By default the backend runs on `http://localhost:3201`.

## Main API Paths

All API routes are mounted under `/v2`.

| Area | Base path |
| --- | --- |
| Auth | `/v2/auth` |
| Users | `/v2/users` |
| Assets | `/v2/assets` |
| Permissions | `/v2/permissions` |
| Models | `/v2/models` |
| Prototypes | `/v2/prototypes` |
| Vehicle APIs | `/v2/apis` |
| Extended APIs | `/v2/extendedApis` |
| Custom API sets | `/v2/custom-api-sets` |
| Discussions | `/v2/discussions` |
| Feedback | `/v2/feedbacks` |
| Search | `/v2/search` |
| Site config | `/v2/site-config` |
| Plugins | `/v2/plugin` |
| Health | `/v2/health` |
| AAOS bridge | `/v2/aaos` |

## AAOS Bridge

The AAOS bridge lets a frontend plugin send a SOME/IP subscription request to the backend. The backend validates the payload, converts the required SOME/IP hex fields to the Rust bridge payload format, forwards the request to the configured Rust service, and stores the latest response for polling.

Endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/v2/aaos/request` | Accepts a plugin request and forwards it to the Rust bridge service |
| `POST` | `/v2/aaos/response` | Accepts an AAOS/Rust response and stores it as the latest response |
| `GET` | `/v2/aaos/latest` | Returns the most recent stored AAOS response, or `null` |

Example request body for `/v2/aaos/request`:

```json
{
  "someip": {
    "serviceId": "0x4100",
    "instanceId": "0x1000",
    "operationId": "0x8410"
  }
}
```

Successful requests return the Rust response inside the backend response envelope:

```json
{
  "success": true,
  "data": {
    "ok": true
  }
}
```

The Rust service or runtime agent can publish a result:

```bash
curl -X POST http://localhost:3201/v2/aaos/response \
  -H "Content-Type: application/json" \
  -d '{"vehicleSpeed":72.5,"unit":"km/h"}'
```

Plugins that poll `/v2/aaos/latest` receive:

```json
{
  "success": true,
  "data": {
    "payload": {
      "vehicleSpeed": 72.5,
      "unit": "km/h"
    },
    "timestamp": "2026-06-12T10:00:00.000Z"
  }
}
```

The latest AAOS response is stored in memory and is cleared whenever the backend restarts. Before any response is received, `data` is `null`.

The AAOS bridge is unauthenticated by design so frontend plugins and runtime agents can communicate without a server-side browser session. Protect these endpoints at the network or reverse-proxy layer if your deployment needs stricter access control.

## Environment Variables

Common variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | required | `development`, `production`, or `test` |
| `PORT` | `3201` | Backend HTTP port |
| `MONGODB_URL` | `mongodb://localhost:27017/autowrx` | MongoDB connection string |
| `CORS_ORIGINS` | `localhost:\d+,127\\.0\\.0\\.1:\d+` | Comma-separated regex patterns; both `http` and `https` are allowed for each pattern |
| `JWT_SECRET` | none | Required for signing tokens |
| `JWT_COOKIE_NAME` | `token` | Refresh-token cookie name |
| `JWT_COOKIE_DOMAIN` | empty | Applied only in production |
| `ADMIN_EMAILS` | empty | Comma-separated initial admin emails |
| `ADMIN_PASSWORD` | empty | Initial admin password |
| `GENAI_URL` | empty | Optional GenAI service URL |
| `KIT_SERVER_URL` | empty | Optional kit-server proxy target |

AAOS variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `AAOS_RUST_SERVICE_URL` | `http://127.0.0.1:8080/config` | Rust bridge endpoint |
| `AAOS_OPERATION` | `enable_event` | Operation sent to the Rust bridge |
| `AAOS_SUBSCRIBE_METHOD_ID` | `16` | SOME/IP subscribe method ID |
| `AAOS_TTL_MS` | `1000` | Subscription TTL in milliseconds |
| `AAOS_REQUEST_TIMEOUT_MS` | `10000` | Rust bridge request timeout |

`AAOS_RUST_SERVICE_URL` must be reachable from the backend process. In Docker, `127.0.0.1` points to the AutoWRX container itself, so use a reachable Compose service name or host address and pass the AAOS variables into the `autowrx` service.

## Testing

Run all backend tests:

```bash
npm test
```

Run the AAOS service tests only:

```bash
npm test -- --runTestsByPath tests/unit/services/aaos.service.test.js
```

## Deployment

For production deployment, use the Compose setup in [`../instance-setup`](../instance-setup/). The backend container serves both the API and the built frontend assets.

## License

License: [MIT](../LICENSE)
