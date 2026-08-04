# AutoWRX Feature Catalog

A code-grounded catalog of what AutoWRX does — the user-facing features and the backend capabilities behind them. Use this as the map of the platform; for internal mechanics see the [architecture docs](../architecture/README.md), and for build/hosting see the [deployment guide](../guides/deployment/README.md).

> **Source of truth:** the code. This catalog reflects what is implemented; items marked *roadmap* are placeholders. It was generated from an audit of `frontend/src/configs/routes.tsx`, `backend/src/routes/v2/`, the models, services, and the site-config flags.

## Feature areas

| Area | Covers | Page |
|---|---|---|
| Auth, Users & Permissions | login/register/SSO, password reset, profile, RBAC, admin | [auth-users-permissions.md](./auth-users-permissions.md) |
| Models & Vehicle APIs | models, VSS/COVESA APIs, extended APIs, vehicle API view | [models-vehicle-apis.md](./models-vehicle-apis.md) |
| Prototypes & Code | prototype workspace, tabs, code/project editor, feedback | [prototypes-code.md](./prototypes-code.md) |
| Dashboards, Widgets & Runtime | dashboard editor, widget marketplace, runtime control, hardware kit | [dashboards-widgets-runtime.md](./dashboards-widgets-runtime.md) |
| Custom APIs | admin-defined API schemas + per-model API sets (tree/list/graph) | [custom-apis.md](./custom-apis.md) |
| Assets & Sharing | user assets (runtime/kit/GenAI), sharing, asset access tokens | [assets-sharing.md](./assets-sharing.md) |
| Plugins | plugin registry, hosting, remote loading, addon tabs, management | [plugins.md](./plugins.md) |
| Site Config & Theming | site config CRUD, feature flags, global CSS, home config, SSO/email config, snapshots, privacy | [site-config-theming.md](./site-config-theming.md) |
| Templates | model / dashboard / project templates | [templates.md](./templates.md) |
| Integrations & System | GenAI/ProtoPilot, GitHub, email, learning mode, search, discussions, health, file upload, audit | [integrations-system.md](./integrations-system.md) |

## Cross-cutting model

**Auth gating.** Read endpoints use `auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING })` — unauthenticated users see public content only when `PUBLIC_VIEWING` is on; private resources still require a permission check. Writes generally require authentication.

**Permissions (RBAC v1, primary).** Roles grant permissions bound to a resource `ref` (a model/asset id or `*`). Owners bypass checks. The frontend permission constants (`frontend/src/data/permission.ts`):

| Constant | Backend value |
|---|---|
| `READ_MODEL` | `readModel` |
| `WRITE_MODEL` | `writeModel` |
| `MANAGE_USERS` | `manageUsers` |
| `USE_GEN_AI` | `generativeAI` |
| `UNLIMITED_MODEL` | `unlimitedModel` |
| `READ_ASSET` / `WRITE_ASSET` | `readAsset` / `writeAsset` |
| `DEPLOY_HARDWARE` | `deployHardware` |
| `LEARNING_MODE` | `learningMode` |

A second Casbin-based RBAC (v2) is wired through the internal `POST /v2/auth/authorize` endpoint but v1 remains the primary path for resource checks.

## Global feature flags

AutoWRX is highly configurable via site-config keys (managed in **Admin → Site Config**). The most behavior-changing ones:

### Auth / access (`predefinedAuthConfigs.js`, all default `true`)
| Flag | Effect |
|---|---|
| `PUBLIC_VIEWING` | Allow unauthenticated browsing of public models/prototypes. |
| `SELF_REGISTRATION` | Allow sign-up. |
| `SSO_AUTO_REGISTRATION` | Auto-create accounts on first SSO login. |
| `PASSWORD_MANAGEMENT` | Allow users to set/change their password. |

### Platform features (`predefinedSiteConfigs.js`)
| Flag | Default | Effect |
|---|---|---|
| `ALLOW_NON_ADMIN_ADDON_CONFIG` | `true` | Non-admin model owners can manage addon tabs/plugins. |
| `ENABLE_NEW_PROTOTYPE_PAGE` | `false` | Use the full-page `/new-prototype` create flow vs inline dialog. |
| `DISABLE_CUSTOM_API_SETS` | `false` | Hide the custom API schema/set UI. |
| `SHOW_SDV_PROTOPILOT_BUTTON` | `true` | Show the GenAI SDV code-generation button on the Code tab. |
| `SHOW_CODE_API_PANEL` | `true` | Show the Vehicle API panel on the Code tab. |
| `SHOW_CODE_DIFF` | `false` | Show code diff after AI/plugin generation. |
| `ENABLE_LEARNING_MODE` | `false` | Show the learning-mode toggle (embeds `LEARNING_MODE_URL`). |
| `USER_ASSET_TYPES` | `['CLOUD_RUNTIME','HARDWARE_KIT','GENAI-PYTHON']` | Asset types available on My Assets. |
| `RUNTIME_SERVER_URL` | `https://kit.digitalauto.tech` | Hardware-kit / runtime server the frontend connects to. |

Branding (`SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`), home layout (`CFG_HOME_CONTENT`), marketplace (`DEFAULT_MARKETPLACE_URL`), GenAI endpoints (`GENAI_SDV_APP_ENDPOINT`, `GENAI_MARKETPLACE_URL`), staging (`STAGING_FRAME`, `STANDARD_STAGE`), nav (`NAV_BAR_ACTIONS`), and privacy (`PRIVACY_POLICY_CONTENT`/`PRIVACY_POLICY_URL`, `TERMS_OF_SERVICE_URL`) are also site-config driven — see [site-config-theming.md](./site-config-theming.md).