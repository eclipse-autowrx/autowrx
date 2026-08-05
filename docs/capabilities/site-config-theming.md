# Cluster: Site Configuration & Theming

The configuration layer driving most behavior, branding, and feature toggles. Backend: `routes/v2/system/site-management.route.js`, `services/siteConfig.service.js`, `models/siteConfig.model.js`, `config/predefinedSiteConfigs.js`. Frontend: `pages/SiteConfigManagement.tsx`.

---

## Site config CRUD

- **Description:** Generic key-value store, scoped (`site`/`user`/`model`/`prototype`/`api`), with value types (string/boolean/number/array/object/image_url/color/date), a `secret` flag, categories; unique on `(key, scope, target_id)`. Predefined configs seeded on startup (`$setOnInsert`, never overwriting admin values).
- **Who uses it / value:** Admins (configure the platform); end users (consume public config); the app (feature toggles/branding).
- **Acceptance criteria:**
  - Admin: `GET/POST /v2/site-config`, `GET /v2/site-config/all`, `POST /v2/site-config/by-keys`, `POST /v2/site-config/bulk-upsert`, `GET/PATCH/DELETE /v2/site-config/:id`, `/key/:key`, `/:scope/:target_id[/all]` → `200`/`201`/`204` as appropriate.
  - Public: `GET /v2/site-config/public[/:key|/:scope/:target_id[/:key]]` returns non-secret configs; `GET /v2/site-config/sso/providers` returns enabled providers without secrets.
- **Quality control:** Admin sets a key → public read reflects it (unless `secret`); upsert by key; bulk-upsert; seeding never overwrites an admin-set value.
- **Security:** Public routes public; everything else requires `MANAGE_USERS`. `secret` configs are never exposed publicly.
- **Data protection:** `secret` flag hides values from public reads; SSO provider secrets + email API keys **encrypted at rest** (`utils/encryption.js`), decrypted only for admin display.

## Site Config management (admin)

- **Description:** Admin page with 11 sections (Public, Home, Site Style, Auth, Model & Prototype, GenAI/ProtoPilot, SSO, Email, Secret, Standard Staging, Privacy), each with edit + edit history (restore/snapshot).
- **Who uses it / value:** Admins (central configuration).
- **Acceptance criteria:**
  - Route `/admin/site-config` (`MANAGE_USERS`); each section edits its keys; edit history supports restore.
- **Quality control:** Edit a config in a section → value persists + applies site-wide; restore from history → reverts.
- **Security:** `MANAGE_USERS` for all sections.
- **Data protection:** Edit history (snapshots) retained; secret sections mask values.

## Global CSS theming

- **Description:** Admin-managed stylesheet served at `/static/global.css`; get/update/restore-default.
- **Who uses it / value:** Admins (brand the site); end users (themed UI); plugins (consume CSS variables).
- **Acceptance criteria:**
  - `GET /v2/site-config/global-css` (public, served statically); `PUT /v2/site-config/global-css` (admin) → `200`; `POST /v2/site-config/global-css/restore-default` (admin) → restores the shipped default.
  - `global.css` loaded in `index.html` before the app bundle.
- **Quality control:** Edit `:root` tokens (e.g. `--primary`) → UI re-themes live; restore-default → reverts.
- **Security:** GET public; PUT/restore `MANAGE_USERS`. CSS can contain selectors only (no script); instance overrides use `!important` guidance.
- **Data protection:** Stylesheet text only; no PII.

## Home config editor

- **Description:** Drag-and-drop editor for `CFG_HOME_CONTENT` blocks (hero, feature-list, button-list, news, recent, popular, partner-list, home-footer) + raw JSON/preview/history.
- **Who uses it / value:** Admins (compose the landing page).
- **Acceptance criteria:**
  - Edits `CFG_HOME_CONTENT`; `PageHome` renders blocks via `homeComponentMap`; unknown block types skipped.
- **Quality control:** Add/reorder blocks → home page reflects changes; preview shows layout; raw JSON editable.
- **Security:** Admin only.
- **Data protection:** Block content (titles/descriptions/image URLs); `requiredLogin` flags on action buttons.

## Branding

- **Description:** `SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`, `SITE_DESCRIPTION`.
- **Who uses it / value:** Admins (brand identity); end users (consistent branding).
- **Acceptance criteria:**
  - Consumed in `NavigationBar`/`RootLayout`/fullscreen dashboard logo.
- **Quality control:** Set `SITE_TITLE` → nav title + browser title update; set logo → renders.
- **Security:** Public read; admin write.
- **Data protection:** Branding asset URLs only.

## Auth config flags

- **Description:** `PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, `PASSWORD_MANAGEMENT` (all default `true`); loaded into `req.authConfig` per request; secure-fail to false on error.
- **Who uses it / value:** Admins (control access/registration); the app (gating).
- **Acceptance criteria:**
  - Flags drive auth behavior across the app (see [identity-access.md](./identity-access.md)); restore defaults from `predefinedAuthConfigs.js`.
- **Quality control:** Toggle `PUBLIC_VIEWING` off → signed-out users can't browse; `SELF_REGISTRATION` off → register `403`.
- **Security:** Public (effective flags observable); admin to change; safe-default all-false on error.
- **Data protection:** Boolean flags only.

## SSO & Email configuration

- **Description:** `SSO_PROVIDERS` (encrypted `clientSecret`) with public enabled-providers list; `EMAIL_CONFIG` (provider resend/smtp/none, from, apiKey, smtpConfig, encrypted secrets) + test send.
- **Who uses it / value:** Admins/DevOps (configure SSO + email); end users (SSO buttons).
- **Acceptance criteria:**
  - `GET /v2/site-config/sso/providers` → enabled providers (no secrets); admin CRUD decrypts for display. `POST /v2/site-config/email/test` → sends a test email.
- **Quality control:** Add an SSO provider → sign-in button appears; configure email (Resend/SMTP) → test send succeeds; remove provider → button hidden.
- **Security:** Secrets encrypted at rest; never in public reads; admin-only writes.
- **Data protection:** Secrets (clientSecret/apiKey/smtp pass) encrypted; email logs may include recipient addresses.

## Site config snapshots & restore

- **Description:** Maintains a `SiteConfigSnapshot`; admin restore merges the deploy snapshot with predefined defaults (snapshot wins per key), filtered by keys/categories/secret, reporting source (`snapshot`/`predefined`/`mixed`/`none`).
- **Who uses it / value:** Admins/DevOps (recover config after a bad change or migration).
- **Acceptance criteria:**
  - `POST /v2/site-config/restore-snapshot` (admin) → `200` restored config with per-key source; auto-synced when the deploy seeder runs.
- **Quality control:** Change a config → restore-snapshot → reverts to snapshot (where present) / predefined default.
- **Security:** Admin only.
- **Data protection:** Snapshots hold site-scope configs incl. encrypted secrets.

## Privacy policy

- **Description:** Public Privacy Policy page from `PRIVACY_POLICY_CONTENT` markdown; admin editor with edit/preview + history.
- **Who uses it / value:** End users (legal info); admins (maintain policy).
- **Acceptance criteria:**
  - Route `/privacy-policy` (public) renders the markdown; `PrivacyPolicySection` (admin) edits + previews.
- **Quality control:** Edit the policy → public page updates; `PRIVACY_POLICY_URL` can redirect instead.
- **Security:** Page public; editor admin.
- **Data protection:** Policy markdown only.