# Verified facts

Non-obvious facts confirmed by reading the code. Each has a one-line source pointer. If you re-verify and a fact has changed, update the line + date.

- **Route domains:** `routes/v2/` has exactly four groups — `user-management/`, `vehicle-data/`, `content/`, `system/` — each with its own `index.js`. (Source: `backend/src/routes/v2/`.)
- **Frontend dev port is 3210**, set by Vite config; not 3000/5173. (Source: `frontend/vite.config.ts` + `AGENTS.md`.)
- **Frontend build is `tsc && vite build`** — type errors fail the build, so `npm run build` is a typecheck gate, not just a bundler. (Source: `frontend/package.json`.)
- **ECA identity is fixed:** `NhanLuongBGSV` / `nhan.luongnguyen@vn.bosch.com`. Other identities will fail the ECA check. (Source: `RULES.md` + `.github/workflows/` ECA check.)
- **`authLimiter` exists but is unused** — see `gotchas.md`; confirmed by grep showing only the definition site in `middlewares/rateLimiter.js`. (Last verified: 2026-08-07.)