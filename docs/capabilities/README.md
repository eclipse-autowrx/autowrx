# AutoWRX Capability Catalog

A code-grounded catalog of what AutoWRX does, organized into **clusters** of related capabilities. Each cluster is one file; each capability within a file is described with the same six sections so the catalog doubles as a spec/acceptance reference.

> **Source of truth:** the code. This catalog reflects what is implemented; items marked *roadmap* are placeholders. It was generated from an audit of `frontend/src/configs/routes.tsx`, `backend/src/routes/v2/`, the models, services, and site-config flags.

## Capability sections (every capability has these)

Each capability is an `## CAP-<CLUSTER>-NN — <title>` heading with a **stable ID** (e.g. `CAP-MODEL-01`); each cluster file lists its IDs + titles in a **Capabilities in this cluster** table at the top. Use these IDs to reference capabilities in issues, PRs, and skills. The seven sections below are `### Section` headers, each followed by a paragraph (or a bullet list under Acceptance criteria). Every cluster file also opens with a mermaid diagram of the cluster's overall flow, and capabilities include a per-capability mermaid diagram where a request flow or state transition is worth illustrating.

> **Perspective — write for the consumer, not the builder.** Every section is written from the perspective of the **user / admin / operator / API caller** who consumes the system — what they can do, what they observe, and the contract they rely on — not the developer who builds it. The endpoint path, HTTP status, and flag names are the caller's contract and are kept verbatim; internal mechanics (which file, function, or layer does what) do **not** belong in the prose — file references for code-grounding go in a trailing `**Implementation:**` note, not the lead.

- **Description** — what the consumer can do and what they get out of it. Lead with "As a <role>, I can <do X> so that <value>." No internal function/file names, no layering.
- **Who uses it / who gets value** — the roles that use or benefit (end user, model owner, admin, DevOps/integrator, plugin author, …).
- **Acceptance criteria** — the contract the caller relies on: endpoint, method, status, body shape, flags, framed as "When I <action>, the system <responds>". Keep every endpoint path / status / flag verbatim. Drop internal mechanics; if a guarantee matters, state it as what the system guarantees to the caller.
- **Quality control** — how the consumer (or operator) verifies the capability works, from the UI / API-caller view.
- **Security** — auth, permissions, sandboxing, attack surface, followed by a **Risks:** bullet list. **Every Security section must address each of these topics explicitly** (state the real value, or `N/A`, or `not implemented` — never leave a topic absent):
  - **Auth** — authentication requirement (required / optional via `PUBLIC_VIEWING` / anonymous / `N/A`).
  - **Authorization** — who is allowed (RBAC permission / owner bypass / none), phrased as the consumer-facing access rule.
  - **Input validation** — what the caller must send / what is rejected (or `not validated`).
  - **Rate limiting** — applied / not applied (cite the `authLimiter` gap if relevant) / `N/A`.
  - **Secrets** — any secrets/credentials the consumer handles or the system stores, and how protected (or `none`).
- **Data protection** — what data is stored/sent, secrets, retention, privacy, followed by a **Risks:** bullet list. **Every Data protection section must address each of these topics explicitly** (real value, `N/A`, or `not implemented` — never absent):
  - **Stored data** — what is persisted and where (or `none`).
  - **PII** — personal data handled? (`no` / `yes — <kind>`).
  - **Retention** — how long kept / TTL / hard vs soft delete / indefinite (or `N/A`).
  - **Encryption** — at rest / in transit / hashing (e.g. bcrypt) / `none`.
  - **Logging** — what is logged, any sensitive data (or `none / N/A`).
- **Test coverage** — E2E (Playwright) test-case count for this capability, the spec file(s), and SITEMAP status (`✅`/`⚠️`/`❌`); plus unit (Jest) count if any. State `0 — not covered` when there is no E2E spec.

> Absence is ambiguous. The checklists above exist so a reader can tell "not applicable" from "forgotten" — every topic gets an explicit answer.

## Clusters

Each cluster has an ID prefix (`CAP-<CODE>-NN`).

| ID prefix | Cluster | Capabilities | File |
|---|---|---|---|
| `CAP-IDENTITY` | Identity & Access | login/refresh/logout, register, password reset + email verify, SSO, profile, user management, RBAC v1 + Casbin v2, manage users/features | [identity-access.md](./identity-access.md) |
| `CAP-MODEL` | Models | model list/create/import, detail/edit, tabs & addons, contributors & permissions, stats, model templates | [models.md](./models.md) |
| `CAP-VAPI` | Vehicle APIs | VSS versions/trees, per-model API CRUD + computed, replace APIs, vehicle API view, extended APIs, custom API schemas, custom API sets | [vehicle-apis.md](./vehicle-apis.md) |
| `CAP-PROTO` | Prototypes & Code | prototype library, new-prototype, CRUD/recent/popular, workspace tabs, code editor, project editor, feedback, project templates | [prototypes-code.md](./prototypes-code.md) |
| `CAP-DASHBOARD` | Dashboards & Widgets | dashboard renderer/editor, widget sources, builtin widgets, dashboard templates, Widget ProtoPilot (roadmap) | [dashboards-widgets.md](./dashboards-widgets.md) |
| `CAP-RUNTIME` | Runtime & Hardware Kits | runtime control, runtime/asset manager, hardware kit manager, asset access tokens, kit server proxy, runtime server config | [runtime-hardware-kits.md](./runtime-hardware-kits.md) |
| `CAP-ASSET` | Assets & Sharing | user assets CRUD, admin all-assets, My Assets, asset sharing, model contributors, access invitation, user lookup | [assets-sharing.md](./assets-sharing.md) |
| `CAP-PLUGIN` | Plugins | plugin registry/CRUD, internal upload/hosting, loader, preloading, sample plugins, addon/custom-tab editor, My Plugins + admin management | [plugins.md](./plugins.md) |
| `CAP-CONFIG` | Site Config & Theming | site config CRUD, public read, admin management, global CSS, home config, branding, auth flags, SSO/email config, snapshots/restore, privacy | [site-config-theming.md](./site-config-theming.md) |
| `CAP-INTEG` | Integrations & Platform | SDV ProtoPilot/GenAI, GitHub OAuth, email, web studio, search, discussions, feedback, health, file upload, change logs/audit, static/SPA, VSS static, CORS/CSP, Socket.IO, log/cache | [integrations-platform.md](./integrations-platform.md) |

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