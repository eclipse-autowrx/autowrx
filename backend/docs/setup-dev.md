## Local Development Setup

Follow these steps to run the backend locally for testing.

### Prerequisites

- Node.js 18+ and npm
- Docker (optional but recommended for MongoDB)

### 1) Clone and install

```bash
git clone <your-fork-or-repo-url>
cd backend
npm install
```

### 2) Configure environment

Create `.env` in `backend/` with at least:

```bash
NODE_ENV=development
PORT=8080
MONGODB_URL=mongodb://localhost:27017/autowrx
JWT_SECRET=dev_secret_change_me
STRICT_AUTH=false
JWT_COOKIE_NAME=token
```

Optional services (leave empty if not used):

```bash
AUTH_URL=
GENAI_URL=
HOMOLOGATION_URL=
EMAIL_URL=
```

### 3) Start MongoDB

Option A) Docker (recommended):

```bash
docker run --name mongo -p 27017:27017 -d mongo:4.4.6-bionic
```

Option B) Local MongoDB installation (ensure it listens on 27017).

### 4) Run the backend (dev mode)

```bash
npm run dev
```

Dev server starts at `http://localhost:8080`.

### 5) Seed admin (optional)

If you want an initial admin, set in `.env`:

```bash
ADMIN_EMAILS=you@example.com
ADMIN_PASSWORD=password1
```

### 6) Test with collections

- Import Postman/Hoppscotch collections from `backend/docs/endpoint-postman-json/`.
- Set variables: `baseUrl=http://localhost:8080`, `accessToken` after login.

### 7) Common issues

- 401 on protected endpoints: ensure you pass `Authorization: Bearer <accessToken>`.
- Cookie not set on login/refresh: use a client that preserves HTTP-only cookies and same-site None over http.
- If `STRICT_AUTH=true`, registration is disabled; create users directly in DB or via admin flow.


