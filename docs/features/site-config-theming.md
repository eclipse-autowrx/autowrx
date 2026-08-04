# Site Config & Theming

The configuration layer that drives most platform behavior, branding, and feature toggles. Backend: `routes/v2/system/site-management.route.js`, `services/siteConfig.service.js`, `models/siteConfig.model.js`, `config/predefinedSiteConfigs.js`. Frontend: `pages/SiteConfigManagement.tsx`.

## Site config CRUD

Generic key-value store, scoped (`site` / `user` / `model` / `prototype` / `api`), with value types (string/boolean/number/array/object/image_url/color/date), a `secret` flag, and categories; unique on `(key, scope, target_id)`. Predefined configs are seeded on startup (`$setOnInsert`, never overwriting admin values).

| Feature | What it does | Key endpoints | Gating |
|---|---|---|---|
| Public config read | Non-secret configs for the site / a scope / a key. | `GET /v2/site-config/public[/:key\|/:scope/:target_id[/:key]]` | Public |
| Admin config CRUD | List/all/by-keys/bulk-upsert; per-id and per-key get/upsert/delete. | `GET/POST /v2/site-config`, `/all`, `/by-keys`, `/bulk-upsert`, `/:id`, `/key/:key`, `/:scope/:target_id[/all]` | `MANAGE_USERS` |
| Site Config management (admin) | 11 sections: Public, Home, Site Style (CSS), Auth, Model & Prototype, GenAI/ProtoPilot, SSO, Email, Secret, Standard Staging, Privacy — each with edit + edit history (restore/snapshot). | page `/admin/site-config` | `MANAGE_USERS` |

## Theming & content

| Feature | What it does | Key endpoints / files | Gating |
|---|---|---|---|
| Global CSS | Admin-managed stylesheet served at `/static/global.css`; get/update/restore-default. | `GET/PUT /v2/site-config/global-css`, `POST /v2/site-config/global-css/restore-default` | GET public; write admin |
| Site style editor | Edit `:root` CSS variables (color pickers, OKLCH converter, live preview) + history. | `SiteStyleSection.tsx` | Admin |
| Home config editor | Drag-and-drop editor for `CFG_HOME_CONTENT` blocks (hero, feature-list, button-list, news, recent, popular, partner-list, home-footer) + raw JSON/preview/history. | `HomeConfigSection.tsx`, `homeComponentMap.ts` | Admin |
| Branding | `SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`, `SITE_DESCRIPTION`. | site config | Public read; admin write |

## Config subsystems

| Feature | What it does | Key endpoints / files | Gating |
|---|---|---|---|
| Auth config flags | `PUBLIC_VIEWING`, `SELF_REGISTRATION`, `SSO_AUTO_REGISTRATION`, `PASSWORD_MANAGEMENT` (all default `true`); secure-fail to false on error. | `predefinedAuthConfigs.js`, `middlewares/authConfig.js` | Public (effective flags); admin to change |
| SSO provider config | Stores `SSO_PROVIDERS` with encrypted `clientSecret`; public list returns enabled providers without secrets. | `GET /v2/site-config/sso/providers`, admin CRUD | Public list; admin CRUD |
| Email config | `EMAIL_CONFIG` (provider resend/smtp/none, from, apiKey, smtpConfig) with encrypted secrets + test send. | `POST /v2/site-config/email/test`, admin CRUD | Admin |
| Snapshots & restore | Maintains a `SiteConfigSnapshot`; admin restore merges deploy snapshot with predefined defaults (snapshot wins per key). | `POST /v2/site-config/restore-snapshot` | `MANAGE_USERS` |
| Privacy policy | Public page from `PRIVACY_POLICY_CONTENT` markdown; admin editor with preview + history. | page `/privacy-policy`, `PrivacyPolicySection.tsx` | Page public; editor admin |

See the [feature flags table](./README.md#global-feature-flags) for the behavior-changing toggles.