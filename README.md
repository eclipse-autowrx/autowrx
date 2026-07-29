# AutoWRX

AutoWRX is a cloud-based, rapid-prototyping environment for software-defined
vehicle (SDV) applications. It lets developers build and test SDV features
against real-world vehicle APIs in the browser, with seamless migration to
automotive runtimes like Eclipse Velocitas. It is part of the
[digital.auto](https://digital.auto) ecosystem.

The platform lets developers:

- **Browse and explore** vehicle API catalogs
- **Build and test** prototypes in the browser using Python, C++, or Rust
- **Visualize** real-time signal data from vehicle runtimes
- **Connect** to KUKSA Data Broker and other automotive services
- **Showcase** customer journeys and feature demos
- **Migrate** prototypes to production automotive runtimes

---

## 📚 Documentation

**All documentation lives in [`docs/`](docs/README.md).** Start there:

- **New here? → [Getting Started](docs/getting-started/README.md)** — concepts,
  local setup, codebase tour, and how to contribute.
- **How it's built → [Architecture](docs/architecture/README.md)** — a
  comprehensive, code-verified deep-dive.
- **Full index → [docs/README.md](docs/README.md)** — everything, organized.

---

## Quick start

Run the full stack locally (details in
[Local Development](docs/getting-started/local-development.md)):

```bash
# 1. MongoDB (Docker)
docker run -d --name autowrx-mongodb -p 27017:27017 \
  -v autowrx-dev-dbdata:/data/db mongo:4.4.6-bionic

# 2. Backend  → http://localhost:3200
cd backend && yarn install && yarn dev

# 3. Frontend → http://localhost:3210   (new terminal)
cd frontend && yarn install && yarn dev
```

Open the app at **http://localhost:3210**.

---

## Project structure

This is a monorepo:

- **`frontend/`** — React / Vite / TypeScript SPA
  ([details](frontend/README.md) · [architecture](docs/architecture/frontend.md))
- **`backend/`** — Node.js / Express API + MongoDB
  ([details](backend/README.md) · [architecture](docs/architecture/backend.md))
- **`docs/`** — documentation ([index](docs/README.md))
- **`instance-setup/`** — production docker-compose + guides
- **`.github/workflows/`** — CI: docker build/release, dev-stage deploy

The backend also serves the built frontend in production, so the two ship as one
image.

---

## Technology stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- **Backend**: Node.js, Express, MongoDB, Mongoose, Passport (JWT), Socket.IO
- **Infrastructure**: Docker, Docker Compose

---

## Contributing

Contributions are welcome. AutoWRX is an Eclipse Foundation project — please read
the **[Contributing guide](docs/getting-started/contributing.md)** first, which
covers the required **Eclipse Contributor Agreement (ECA)**, the branch/PR flow,
and how to verify your change locally.

---

## License

**License: [MIT](LICENSE)**

Copyright (c) 2025 Eclipse Foundation.

This program and the accompanying materials are made available under the terms of
the MIT License which is available at <https://opensource.org/licenses/MIT>.

SPDX-License-Identifier: MIT

---

## Links

- [digital.auto](https://digital.auto) — main project website
- [Official documentation](https://docs.digital.auto)
- [Eclipse Velocitas](https://eclipse.dev/velocitas) — automotive runtime platform
