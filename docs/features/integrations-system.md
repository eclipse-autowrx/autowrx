# Integrations & System

GenAI/external integrations, search, content, and platform/system capabilities.

## Integrations

| Feature | What it does | Key files / endpoints | Gating |
|---|---|---|---|
| SDV ProtoPilot (GenAI code gen) | Generate an SDV Python app from a prompt; built-in "SDV Copilot" (`GENAI_SDV_APP_ENDPOINT`) + marketplace generators (`GENAI_MARKETPLACE_URL`); preview then apply to prototype. | `DaGenAI_Python.tsx`, `DaGenAI_Base.tsx` | `SHOW_SDV_PROTOPILOT_BUTTON` + `USE_GEN_AI` |
| GenAI service proxy | Reverse-proxies `/v2/genai/*` to the GenAI microservice (`GENAI_URL`) with SSE streaming. | `routes/v2/system/genai.route.js`, `config/proxyHandler.js` | Auth; requires `GENAI_URL` |
| GitHub OAuth | Connect a GitHub account (socket-based callback) for project-editor git sync; GitHub SSO for login. | `hooks/useGithubAuth.ts`, `GET /v2/auth/github{,-sso/*}` | Auth; `GITHUB_CLIENT_ID/SECRET` |
| Email service | Transactional email (welcome, reset code, verification, test) via Resend or SMTP (site-configured, encrypted secrets), with legacy env fallback. | `services/email.service.js` | `EMAIL_CONFIG` |
| Learning mode | Embeds a learning iframe (`LEARNING_MODE_URL`) with host↔iframe automation messaging. | `LearningIntegration.tsx` | `ENABLE_LEARNING_MODE` + sign-in |
| Web Studio widgets | Create/embed a widget via the external bewebstudio service. | `services/webStudio.service.ts` | — |

## Search

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Cross-resource search | Regex search across accessible models & prototypes by name/description; combined paging. | `GET /v2/search` (`q`, `sortBy`, `limit`, `page`) | Optional (`PUBLIC_VIEWING`) |
| User by email | Find a user by exact email (for sharing). | `GET /v2/search/email/:email` | Optional (`PUBLIC_VIEWING`) |
| Prototypes by signal | Find prototypes whose `code` contains a VSS signal string. | `GET /v2/search/prototypes/by-signal/:signal` | Optional (`PUBLIC_VIEWING`) |
| Global search (UI) | Search prototypes/models with type filters. | `DaGlobalSearch.tsx` (nav bar) | Public |

## Content

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Discussions | Threaded comments on any resource (`ref`+`ref_type`) with replies; top-level-only list. | `GET/POST /v2/discussions`, `PATCH/DELETE /v2/discussions/:id` | List optional; write auth. *Partial* (no dedicated routed page) |
| Feedback | Structured feedback with scores (1–5) + interview metadata. | `GET/POST /v2/feedbacks`, `PATCH/DELETE /v2/feedbacks/:id` | List optional; write auth |

## System

| Feature | What it does | Key endpoints / files | Gating |
|---|---|---|---|
| Health check | Consolidated status of MongoDB, JWT, auth, upload dir, runtime server, SSO. | `GET /v2/health`, page `/health` | Public |
| File upload | Multer single-file upload to `static/uploads/YYYY-MM-DD/`; auto-scales images (sharp, max 1024px); served at `/d/...` (1-yr cache). 50 MB file / 10 MB field limits. | `POST /v2/file/upload/store`, static `/d/...` | Auth |
| Change logs / audit | `captureChange` Mongoose plugin on Model/Prototype records CREATE/UPDATE/DELETE with field diffs (throttled/batched); admin paginated list. | `GET /v2/change-logs`, `models/plugins/captureChange.plugin.js` | Auth + `MANAGE_USERS` |
| Static & SPA | Serves `/static`, `/images`, `/plugin`, `/builtin-widgets`, `/d`; production serves the built SPA with index.html fallback; dev proxies to Vite `:3210`. | `backend/src/app.js` | Public |
| VSS static | Serves VSS version JSONs from `backend/data` at `/vss/:version/:filename`. | `backend/src/app.js`, `backend/data/*.json` | Public |
| CORS / security | Regex CORS allowlist (`CORS_ORIGINS`), cookie-parser, mongo-sanitize, gzip, Helmet CSP (wildcard in both envs), trust proxy. | `backend/src/app.js`, `config/config.js` | — |
| Socket.IO (realtime) | JWT-authenticated Socket.IO; pushes auth events (GitHub OAuth token/errors). | `config/socket.js` | Auth (JWT on handshake) |
| Log / cache service clients | Forward audit events to `LOG_URL`; pull recent-prototype activity from `CACHE_URL`. | `services/log.service.js`, `prototype.service.js` | Internal (`LOG_URL`/`CACHE_URL`) |