# Cluster: Integrations & Platform

External integrations, search/content, and platform/system capabilities.

---

## SDV ProtoPilot (GenAI code generation)

- **Description:** Generate an SDV Python app from a prompt; built-in "SDV Copilot" (`GENAI_SDV_APP_ENDPOINT`) + marketplace generators (`GENAI_MARKETPLACE_URL`); preview then apply to the prototype.
- **Who uses it / value:** Prototype authors (bootstrap code); GenAI-capable users.
- **Acceptance criteria:**
  - Button shown when `SHOW_SDV_PROTOPILOT_BUTTON=true` and the user has `USE_GEN_AI`; generates code → preview → apply writes to `prototype.code`.
  - Code diff shown when `SHOW_CODE_DIFF=true`.
- **Quality control:** With the flag + permission, open ProtoPilot on Code tab → prompt → generated code preview → apply → code updated.
- **Security:** Gated by `USE_GEN_AI` permission + `SHOW_SDV_PROTOPILOT_BUTTON`. Backend proxy requires auth.
- **Data protection:** Prompt + generated code transit the GenAI service; generated code stored in the prototype.

## GenAI service proxy

- **Description:** Reverse-proxies `/v2/genai/*` to the GenAI microservice (`GENAI_URL`) with SSE streaming.
- **Who uses it / value:** The frontend (GenAI calls); integrators (GenAI backend).
- **Acceptance criteria:**
  - `ALL /v2/genai/*` proxied to `GENAI_URL` (SSE streamed); auth required; inactive if `GENAI_URL` unset.
- **Quality control:** With `GENAI_URL` set, ProtoPilot calls succeed; without it, the route is inactive.
- **Security:** Auth required; SSE streaming passthrough.
- **Data protection:** Proxies prompts/responses; no backend storage.

## GitHub OAuth (linking + SSO)

- **Description:** Connect a GitHub account (socket-based callback emits the token) for project-editor git sync; GitHub SSO for login.
- **Who uses it / value:** Authors (git sync intent); end users (GitHub login).
- **Acceptance criteria:**
  - `GET /v2/auth/github/callback` → exchanges code, emits token over the user's socket; `GET /v2/auth/github-sso/{start,callback}` → SSO login.
  - Requires `GITHUB_CLIENT_ID/SECRET` (env or per-provider config).
- **Quality control:** Connect GitHub → account linked; deeper git-sync UI is partial.
- **Security:** OAuth code exchange server-side; token delivered via authenticated socket.
- **Data protection:** GitHub tokens stored in `githubAuthStore` (persisted); treat as credentials.

## Email service

- **Description:** Transactional email (welcome, reset code, verification, test) via Resend or SMTP (site-configured, encrypted secrets), with legacy env fallback; welcome email non-blocking.
- **Who uses it / value:** End users (account flows); admins (test config).
- **Acceptance criteria:**
  - `POST /v2/site-config/email/test` (admin) sends a test email; auth flows send welcome/reset/verify emails; failure of welcome doesn't block registration.
- **Quality control:** Configure Resend/SMTP → test send succeeds; trigger forgot-password → reset code emailed.
- **Security:** Secrets encrypted at rest; admin-only config.
- **Data protection:** Recipient email + content sent to the provider; reset codes are one-time.

## Web Studio widget creation

- **Description:** Create/embed a widget via the external bewebstudio service.
- **Who uses it / value:** Widget authors.
- **Acceptance criteria:**
  - `webStudio.service` creates/opens a widget; the create-from-scratch button is commented out in the current UI but the service exists.
- **Quality control:** Service callable; UI entry currently disabled.
- **Security:** External service; same caveats as remote widgets.
- **Data protection:** Widget URL only.

## Search

- **Description:** Regex search across accessible models & prototypes by name/description; user-by-email; prototypes-by-signal; plus a Global search UI in the nav bar.
- **Who uses it / value:** End users (discover); sharing flows (find users).
- **Acceptance criteria:**
  - `GET /v2/search?q=&sortBy=&limit=&page=` (optional auth via `PUBLIC_VIEWING`) → `200` models + prototypes accessible to the caller.
  - `GET /v2/search/email/:email` → `200` user or `404`; `GET /v2/search/prototypes/by-signal/:signal` → matching prototypes.
  - Global search UI (`DaGlobalSearch`) with type filters.
- **Quality control:** Search a term → accessible results only; search an inaccessible model → not returned; by-signal → prototypes whose code contains the signal.
- **Security:** Optional auth via `PUBLIC_VIEWING`; scoped to accessible resources (no leakage).
- **Data protection:** `q` regex over name/description; by-signal scans prototype `code` in memory.

## Discussions

- **Description:** Threaded comments on any resource (`ref`+`ref_type`) with optional `parent` for replies; top-level-only list.
- **Who uses it / value:** Collaborators/reviewers (comment on resources).
- **Acceptance criteria:**
  - `GET /v2/discussions?ref=<id>` (optional auth) → `200` top-level threads; `POST` (auth) → `201`; `PATCH/DELETE /:id` → `200`/`204`. `ref` query required for list.
- **Quality control:** Create a discussion on a resource → appears in list; reply via `parent`; list returns top-level only.
- **Security:** List optional; write auth. **Partial** — no dedicated routed page; wired contextually.
- **Data protection:** `ref`/`ref_type`/`content`/`created_by` stored.

## Feedback service

- **Description:** Structured feedback with scores (1–5) + interview metadata (see [prototypes-code.md](./prototypes-code.md) for the UI).
- **Who uses it / value:** Reviewers; prototype owners.
- **Acceptance criteria:**
  - `GET/POST /v2/feedbacks` (list optional, write auth); `PATCH/DELETE /:id` → `200`/`204` (own).
- **Quality control:** Add feedback → persisted; delete own → `204`; delete others' → `403`.
- **Security:** Add auth; delete own only.
- **Data protection:** Scores + interviewee metadata stored.

## Health check

- **Description:** Consolidated status of MongoDB, JWT sign/verify, auth login, upload dir, runtime server, SSO reachability.
- **Who uses it / value:** DevOps/monitoring.
- **Acceptance criteria:**
  - `GET /v2/health` (public) → `200` `ok`/`degraded`/`error` with per-service messages; page `/health` shows badges.
- **Quality control:** Hit `/v2/health` → status + per-service messages; stop Mongo → degraded.
- **Security:** Public.
- **Data protection:** Status info only (no secrets).

## File upload

- **Description:** Multer single-file upload to `static/uploads/YYYY-MM-DD/`; auto-scales images (sharp, max 1024 px); served at `/d/...` (1-year cache). 50 MB file / 10 MB field limits.
- **Who uses it / value:** End users (avatars, model/prototype images); the app (asset hosting).
- **Acceptance criteria:**
  - `POST /v2/file/upload/store-be` (auth) → `200 { url }`; images auto-scaled; served at `/d/...` with long cache.
- **Quality control:** Upload an image → returned URL serves a scaled image; upload >50 MB → rejected.
- **Security:** Auth required; any file type allowed (50 MB cap) — validate on use.
- **Data protection:** Files served publicly under `/d/`; retention = files persist until deleted (no auto-prune).

## Change logs / audit

- **Description:** `captureChange` Mongoose plugin on Model & Prototype records CREATE/UPDATE/DELETE with field diffs (throttled/batched for frequent updates like `code`); admin paginated list.
- **Who uses it / value:** Admins/auditors (trace changes).
- **Acceptance criteria:**
  - `GET /v2/change-logs` (auth + `MANAGE_USERS`) → `200` paginated audit entries (`action`, `changes`, `ref`).
  - Frequent `code` updates batched into throttled entries (~60 s).
- **Quality control:** Update a model → a `changelogs` entry appears; admin can list/filter; non-admin → `403`.
- **Security:** `MANAGE_USERS` (read optional via `PUBLIC_VIEWING` but `checkPermission(ADMIN)` enforced).
- **Data protection:** `changelogs` is a **capped** collection (bounded size); stores field diffs (may include code/content).

## Static serving, SPA, VSS static

- **Description:** Serves `/static`, `/images`, `/plugin`, `/builtin-widgets`, `/d`; production serves the built SPA with index.html fallback; dev proxies to Vite `:3210`; VSS JSONs at `/vss/:version/:filename` (1-hour cache).
- **Who uses it / value:** All users (the app + assets); integrators (VSS data).
- **Acceptance criteria:**
  - Static assets served with correct MIME; SPA fallback serves `index.html` for unknown routes (production); `/vss/:version/:filename` returns JSON.
- **Quality control:** Hit the app root → SPA loads; an asset URL → served; `/vss/4.0/vss.json` → JSON.
- **Security:** Public; Helmet CSP applies (wildcard in both envs — known permissive).
- **Data protection:** Static assets only.

## CORS / Helmet CSP / security middleware

- **Description:** Regex CORS allowlist (`CORS_ORIGINS`), cookie-parser, mongo-sanitize, gzip, Helmet CSP (wildcard-open in both dev and prod — only `objectSrc` is `'none'`), `trust proxy`.
- **Who uses it / value:** DevOps (deploy securely); the app (browser loading).
- **Acceptance criteria:**
  - CORS allows configured origins (http/https auto-prefixed); CSP headers set; sanitize inputs; `trust proxy` enabled.
- **Quality control:** Check response headers → CORS + CSP present; cross-origin script loads with `crossOrigin=anonymous`.
- **Security:** ⚠️ CSP is wildcard-open (not restrictive) — a known gap. `authLimiter` defined but unused. CORS is the real origin gate.
- **Data protection:** mongo-sanitize strips `$`/`.` keys from inputs; cookies httpOnly.

## Socket.IO (realtime)

- **Description:** JWT-authenticated Socket.IO (token via `access_token` query); pushes auth events (GitHub OAuth token/errors).
- **Who uses it / value:** Auth flows (GitHub token delivery); future realtime features.
- **Acceptance criteria:**
  - Handshake verifies JWT, attaches `socket.user`; `auth/github`/`auth/github/error` events emitted.
- **Quality control:** Connect with a valid access token → connected; invalid → rejected.
- **Security:** JWT verified on handshake.
- **Data protection:** Token in query string (use TLS in prod); event payloads may include GitHub tokens.

## Log / cache service clients

- **Description:** Forward audit/forgot-password events to `LOG_URL`; pull recent-prototype activity from `CACHE_URL`.
- **Who uses it / value:** DevOps (centralized logs/activity).
- **Acceptance criteria:**
  - Internal clients; active when `LOG_URL`/`CACHE_URL` configured; failures non-blocking for the main flows.
- **Quality control:** Configure the URLs → events forwarded / recent activity served.
- **Security:** Internal clients; configure with appropriate auth on the target services.
- **Data protection:** Forwards event metadata (incl. email for forgot-password); respect target service retention.