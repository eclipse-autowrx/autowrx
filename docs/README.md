# AutoWRX Documentation

Welcome to the AutoWRX documentation. AutoWRX is a cloud-based, rapid-prototyping
environment for software-defined vehicle (SDV) applications, part of the
[digital.auto](https://digital.auto) ecosystem.

This page is the index for everything in `docs/`. Start with **Getting Started**
if you're new, or jump to **Architecture** for how the system is built.

---

## 🚀 Getting Started

New to the project? **Start with the [Getting Started path](./getting-started/README.md)** —
a guided onboarding from zero to productive.

- [**Getting Started (start here)**](./getting-started/README.md) — the onboarding hub
  - [Concepts & Glossary](./getting-started/concepts.md) ·
    [Local Development](./getting-started/local-development.md) ·
    [Codebase Tour](./getting-started/codebase-tour.md) ·
    [Contributing](./getting-started/contributing.md)
  - [Internal Onboarding (team)](./getting-started/internal/README.md)
- [Project README](../README.md) — top-level overview
- [Development Guide](getting-started/development-guide.md) — detailed local setup & troubleshooting
- [Backend Dev Setup](../backend/docs/setup-dev.md) — run the backend on its own

---

## 🏛️ Architecture

Comprehensive, code-verified deep-dive into how AutoWRX is built. Start with the
overview, then drill into a subsystem.

- [**Architecture Overview**](./architecture/README.md) — system context, tech
  stack, repo layout, and a map of the deep-dives
- [Frontend](./architecture/frontend.md) — React/Vite, atomic design, state, services
- [Backend](./architecture/backend.md) — Express request pipeline, route groups, layers
- [Plugin System](./architecture/plugin-system.md) — dynamic-URL micro-frontend loader
- [Auth & Security](./architecture/auth-security.md) — JWT, refresh tokens, RBAC, CORS/CSP
- [Data Model](./architecture/data-model.md) — MongoDB collections & relationships
- [Realtime Signals](./architecture/realtime-signals.md) — Socket.IO signal streaming
- [Request Lifecycle](./architecture/request-lifecycle.md) — end-to-end traces

---

## 🧭 Design Principles

The philosophy and conventions behind the code.

- [Platform Concepts](./principles/concept.md) — how the architectural pillars fit together
- [Design Principles](./principles/principle.md) — the rules all frontend code follows
- [Core vs. Plugin Philosophy](./principles/core-vs-plugin.md) — what's core, what's a plugin
- [Layout & Component Concepts](./principles/layout.md) — visual layout conventions
- [Styling Architecture](./principles/style.md) — design tokens and theming
- [Project Structure](./principles/project-structure.md) — where things live in the codebase

---

## 📖 Guides

How-to material for building on the platform.

- [**Plugin Development**](./guides/plugin/README.md) — build, register, and deploy a plugin
  - [API Reference](./guides/plugin/api-reference.md) ·
    [Deployment](./guides/plugin/deployment.md)
- [Custom API System](./guides/custom-api-system.md) — model-specific API catalogs
- [Deployment](./guides/deployment/README.md) — production deployment (instance-setup)

---

## 📚 Reference

Configuration and technical reference.

- [Dynamic Components Architecture](./reference/component-design/dynamic-components.md)
- [Authentication Cookie Handling](./reference/authentication-cookie-handling.md)
  (+ [refresh-token flow](./reference/refresh-token-flow.svg))
- [CORS Configuration](./reference/cors.md)
- [CSP Configuration](./reference/csp.md)
- [Feature Breakdown](./reference/feature-breakdown.md)

### Feature Catalog
- [**Feature Catalog**](./features/README.md) — a code-grounded catalog of all platform features & capabilities
  - [Auth, Users & Permissions](./features/auth-users-permissions.md) · [Models & Vehicle APIs](./features/models-vehicle-apis.md) · [Prototypes & Code](./features/prototypes-code.md) · [Dashboards, Widgets & Runtime](./features/dashboards-widgets-runtime.md) · [Custom APIs](./features/custom-apis.md) · [Assets & Sharing](./features/assets-sharing.md) · [Plugins](./features/plugins.md) · [Site Config & Theming](./features/site-config-theming.md) · [Templates](./features/templates.md) · [Integrations & System](./features/integrations-system.md)

---

## 🧩 Examples

Worked examples referenced by the design docs.

- [Component: Banner](./examples/componentBanner.md) ·
  [Component: Models Grid](./examples/componentModelsGrid.md) ·
  [Hook: My Models](./examples/hookMyModels.md) ·
  [Page: Home](./examples/pageHome.md) ·
  [Page: Models](./examples/pageModels.md)

---

## Backend-specific docs

The backend keeps its own focused docs under [`backend/docs/`](../backend/docs):
[authentication](../backend/docs/authentication.md) ·
[db collections](../backend/docs/db-collections.md) ·
[middlewares](../backend/docs/middlewares.md) ·
[scoped configurations](../backend/docs/scoped-configurations.md) ·
[api plugin system](../backend/docs/api-plugin-system.md).
