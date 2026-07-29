# Getting Started

Welcome to AutoWRX. This is the onboarding path for **new members** — whether
you're an external contributor or joining the team. Follow it in order.

> **AutoWRX** is a cloud-based, rapid-prototyping environment for
> software-defined vehicle (SDV) applications, part of the
> [digital.auto](https://digital.auto) ecosystem.

---

## The path (start to productive)

1. **[Concepts & Glossary](./concepts.md)** — the mental model and vocabulary
   (model, prototype, VSS API, kit/runtime, plugin). Read this first; the rest
   assumes the terms.
2. **[Local Development](./local-development.md)** — get the full stack running on
   your machine in ~10 minutes (MongoDB + backend + frontend).
3. **[Codebase Tour](./codebase-tour.md)** — where everything lives and how to
   find or change a given feature.
4. **[Architecture](../architecture/README.md)** — once you can run it, go deep
   on how it's built (the code-verified deep-dive).
5. **[Contributing](./contributing.md)** — the workflow for landing a change:
   branch, commit, PR, the **Eclipse Contributor Agreement (ECA)**, review, CI.

**Team members** also read the
**[Internal Onboarding](./internal/README.md)** section (environments,
deployment, releases, the kit server, access) — after the public path above.

---

## Fastest possible start

If you just want to see it running (details in
[Local Development](./local-development.md)):

```bash
# 1. MongoDB (Docker)
docker run -d --name autowrx-mongodb -p 27017:27017 \
  -v autowrx-dev-dbdata:/data/db mongo:4.4.6-bionic

# 2. Backend  → http://localhost:3200
cd backend && yarn install && yarn dev

# 3. Frontend → http://localhost:3210   (new terminal)
cd frontend && yarn install && yarn dev
```

Open **http://localhost:3210**.

---

## Where to go next

- Understand the *why* → [Design Principles](../principles/concept.md)
- Build an extension → [Plugin Development guide](../guides/plugin/README.md)
- Everything else → the [documentation index](../README.md)
