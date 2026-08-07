# AutoWRX Capability Catalog

A code-grounded catalog of what AutoWRX does, organized into **clusters** of related capabilities. Each cluster is one file; each capability within a file is described with the same six sections so the catalog doubles as a spec/acceptance reference.

> **Source of truth:** the code. This catalog reflects what is implemented; items marked *roadmap* are placeholders. It was generated from an audit of `frontend/src/configs/routes.tsx`, `backend/src/routes/v2/`, the models, services, and site-config flags.

## Capability sections (every capability has these)

Each capability is an `## Capability` heading; the six sections below are `### Section` headers, each followed by a paragraph (or a bullet list under Acceptance criteria). Every cluster file also opens with a mermaid diagram of the cluster's overall flow, and capabilities include a per-capability mermaid diagram where a request flow or state transition is worth illustrating.

- **Description** — what it is and does.
- **Who uses it / who gets value** — the roles that use or benefit (end user, model owner, admin, DevOps/integrator, plugin author, …).
- **Acceptance criteria** — how it works fully, how to verify it, and the acceptable behavior (incl. error/edge cases).
- **Quality control** — how to test it (manual steps / API checks).
- **Security** — auth, permissions, sandboxing, attack surface, followed by a **Risks:** bullet list stating concretely what could be lost or how the capability could be attacked.
- **Data protection** — what data is stored/sent, secrets, retention, privacy, followed by a **Risks:** bullet list stating concretely the risk of losing user data or exposing it.

## Clusters

| Cluster | Capabilities | File |
|---|---|---|
| Identity & Access | login/refresh/logout, register, password reset + email verify, SSO, profile, user management, RBAC v1 + Casbin v2, manage users/features | [identity-access.md](./identity-access.md) |
| Models | model list/create/import, detail/edit, tabs & addons, contributors & permissions, stats, model templates | [models.md](./models.md) |
| Vehicle APIs | VSS versions/trees, per-model API CRUD + computed, replace APIs, vehicle API view, extended APIs, custom API schemas, custom API sets | [vehicle-apis.md](./vehicle-apis.md) |
| Prototypes & Code | prototype library, new-prototype, CRUD/recent/popular, workspace tabs, code editor, project editor, feedback, project templates | [prototypes-code.md](./prototypes-code.md) |
| Dashboards & Widgets | dashboard renderer/editor, widget sources, builtin widgets, dashboard templates, Widget ProtoPilot (roadmap) | [dashboards-widgets.md](./dashboards-widgets.md) |
| Runtime & Hardware Kits | runtime control, runtime/asset manager, hardware kit manager, asset access tokens, kit server proxy, runtime server config | [runtime-hardware-kits.md](./runtime-hardware-kits.md) |
| Assets & Sharing | user assets CRUD, admin all-assets, My Assets, asset sharing, model contributors, access invitation, user lookup | [assets-sharing.md](./assets-sharing.md) |
| Plugins | plugin registry/CRUD, internal upload/hosting, loader, preloading, sample plugins, addon/custom-tab editor, My Plugins + admin management | [plugins.md](./plugins.md) |
| Site Config & Theming | site config CRUD, public read, admin management, global CSS, home config, branding, auth flags, SSO/email config, snapshots/restore, privacy | [site-config-theming.md](./site-config-theming.md) |
| Integrations & Platform | SDV ProtoPilot/GenAI, GitHub OAuth, email, web studio, search, discussions, feedback, health, file upload, change logs/audit, static/SPA, VSS static, CORS/CSP, Socket.IO, log/cache | [integrations-platform.md](./integrations-platform.md) |

## Cross-cutting model

**Auth gating.** Most read endpoints use `auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING })` — unauthenticated users see public content only when `PUBLIC_VIEWING` is on; private resources still require a permission check. Writes generally require authentication.

**Permissions (RBAC v1, primary).** Roles grant permissions bound to a resource `ref` (a model/asset id or `*`). Owners bypass checks. Frontend permission constants (`frontend/src/data/permission.ts`):

| Constant | Backend value |
|---|---|
| `READ_MODEL` | `readModel` |
| `WRITE_MODEL` | `writeModel` |
| `MANAGE_USERS` | `manageUsers` |
| `USE_GEN_AI` | `generativeAI` |
| `UNLIMITED_MODEL` | `unlimitedModel` |
| `READ_ASSET` / `WRITE_ASSET` | `readAsset` / `writeAsset` |
| `DEPLOY_HARDWARE` | `deployHardware` |

A second Casbin-based RBAC (v2) is wired through the internal `POST /v2/auth/authorize` endpoint but v1 remains the primary path for resource checks.

## Global feature flags

AutoWRX is highly configurable via site-config keys (managed in **Admin → Site Config**). The most behavior-changing ones.

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
| `USER_ASSET_TYPES` | `['CLOUD_RUNTIME','HARDWARE_KIT','GENAI-PYTHON']` | Asset types available on My Assets. |
| `RUNTIME_SERVER_URL` | `https://kit.digitalauto.tech` | Hardware-kit / runtime server the frontend connects to. |

Branding (`SITE_TITLE`, `SITE_LOGO_WIDE`, `SITE_FAVICON`, `SITE_THEME_COLOR`), home layout (`CFG_HOME_CONTENT`), marketplace (`DEFAULT_MARKETPLACE_URL`), GenAI endpoints (`GENAI_SDV_APP_ENDPOINT`, `GENAI_MARKETPLACE_URL`), staging (`STAGING_FRAME`, `STANDARD_STAGE`), nav (`NAV_BAR_ACTIONS`), and privacy (`PRIVACY_POLICY_CONTENT`/`PRIVACY_POLICY_URL`, `TERMS_OF_SERVICE_URL`) are also site-config driven — see [site-config-theming.md](./site-config-theming.md).