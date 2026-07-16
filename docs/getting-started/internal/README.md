# Internal Onboarding (Team)

Onboarding notes for **team members**, covering environments, deployment, and
releases — the things beyond the public [Getting Started](../README.md) path.

> **This repository is public.** This document describes **processes**, not
> secrets. Credentials, private URLs, `.env` values, and access grants live in
> the team's internal store (secret manager / private wiki), **never** in the
> repo. If you find a secret committed here, treat it as an incident.

Do the public path first (concepts → local dev → codebase tour → contributing),
then this.

---

## 1. Environments

| Environment | What it is | How it's deployed |
|---|---|---|
| **Local** | Your machine | [Local Development](../local-development.md) |
| **Dev-stage** | Shared team preview | `deploy-dev-stage.yml` (manual GitHub Action, self-hosted runner, PM2) |
| **Production** | The live instance | `instance-setup/` docker-compose, running a published image |

Access to dev-stage / production hosts and their `.env` files is granted by the
team — request it from your lead; it is not in this repo.

---

## 2. Container images & releases

Images are built and published by **`.github/workflows/build-docker.yml`** to
GHCR (`ghcr.io/eclipse-autowrx/autowrx/autowrx`).

Releases use **date-based versioning: `vYYYY.MM.DD`** (see
[the versioning setup](../../../.github/workflows/build-docker.yml)). To cut a
release:

```bash
git tag v2026.07.16          # today's date
git push origin v2026.07.16
```

Pushing the tag triggers the workflow, which:

1. Writes the version into `backend/` **and** `frontend/package.json` (the
   frontend value is what the app footer shows).
2. Builds and pushes the image tagged `v2026.07.16`, `2026.07.16`, `2026.07`
   (month-rolling), and `latest`.
3. Creates a **GitHub Release** with the `instance-setup/` assets attached.

Deploy a release by pointing `IMAGE_TAG` in the target's `.env.stack` at the tag
(e.g. `IMAGE_TAG=v2026.07.16`) and restarting the stack.

> **ECA on maintainer merges:** external contributors must pass the `eclipsefdn/eca`
> check (see [Contributing](../contributing.md)). Maintainers merging on their
> behalf must follow the project's policy for the agreement — don't bypass the
> gate casually.

---

## 3. The kit / runtime server

Live signal streaming does **not** go through the AutoWRX backend — the frontend
connects directly to an external **kit-manager** server (default
`kit.digitalauto.tech`), configurable per-instance via the `RUNTIME_SERVER_URL`
site config. Runtimes/kits register there; the browser discovers and drives them
over Socket.IO. Details:
[realtime-signals.md](../../architecture/realtime-signals.md).

Operating the kit-manager itself is out of scope for this repo.

---

## 4. Configuration & secrets

- Backend behavior is driven by env vars validated in `backend/src/config/config.js`
  (Mongo URL, JWT secret, CORS origins, admin bootstrap, external service URLs,
  cookie domain, …).
- Site behavior is driven by **site configs** in the DB (feature flags like
  `PUBLIC_VIEWING`, theming, `RUNTIME_SERVER_URL`) — editable by admins in the UI
  under Admin → Site Config.
- **Never** commit real secrets. Local dev uses throwaway values; shared
  environments pull from the team's secret store.

See [Auth & Security](../../architecture/auth-security.md) for how these gate
behavior.

---

## 5. Who to ask

- **Architecture / code** — start with [docs/architecture/](../../architecture/README.md);
  it's code-verified and answers most "how does X work" questions.
- **Access, environments, secrets, releases** — your team lead / the maintainers.
- **A specific subsystem** — the relevant architecture doc links the exact files
  to read.

Welcome to the team.
