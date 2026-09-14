# Skill: add-endpoint
> The canonical procedure for adding a new v2 API endpoint end-to-end, keeping routes/controllers/services/models layering.

## When to use
- When the task is "add an endpoint", "add an API route", "expose X over HTTP", or a feature requires new backend read/write surface.
- When extending an existing domain with a new verb/path under `routes/v2/`.

## Steps
1. **Pick the domain.** Match existing grouping under `backend/src/routes/v2/{user-management,vehicle-data,content,system}/`. Each domain has an `index.js` that aggregates `*.route.js`. Add a new `*.route.js` only if the resource doesn't fit an existing file; otherwise extend the existing one. Read `routes/v2/index.js` to confirm aggregation.
2. **Add the service logic** in `backend/src/services/<area>.service.js` (create the function, keep it pure-ish, throw `ApiError` for failures). Business logic lives here — not in routes/controllers.
3. **Add a thin controller** in `backend/src/controllers/<area>.controller.js` that parses the request and delegates to the service. No business logic, no direct Mongoose calls.
4. **Touch the Mongoose model** in `backend/src/models/<area>.model.js` only if a schema change is required — if so, run [`./db-schema-change.md`](./db-schema-change.md) in parallel (backfill script, index, validations).
5. **Choose auth gating.** Public-optional reads: `auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING })`. Writes and non-public reads: `auth(...)` + `checkPermission('<permissionModel>')` (RBAC v1, owner bypass; roles: readModel/writeModel/manageUsers/readAsset/writeAsset/generativeAI/deployHardware). Errors flow through `middlewares/error.js` via `ApiError`.
6. **Add Joi validation** in `backend/src/validations/<area>.validation.js` (and export from `validations/index.js` if used) when the body/query/params shape matters. Wire it via `middlewares/validate.js`.
7. **Register the route.** In the domain `index.js` (or a new `*.route.js` imported there), mount the router. Confirm the path appears under `routes/v2/index.js` aggregation so it's live.
8. **Add a Jest test.** Per [`./add-test.md`](./add-test.md) — cover the happy path, the auth-denied path, and one validation failure. Run `cd backend && npm test`.
9. **Update the capability doc.** Per [`./docs-update.md`](./docs-update.md), edit `docs/capabilities/<cluster>.md` (code-grounded): add the endpoint with method/path, who uses it, value, acceptance criteria, security + **Risks:**, data protection + **Risks:**, and a mermaid diagram if the flow is non-trivial. Verify every claim against the code you just wrote.
10. **Update `.agents/SITEMAP.md`** only if the endpoint backs a user-facing page/feature.
11. **Lint/format:** `cd backend && npm run lint && npm run prettier`.
12. **Self-review.** Run [`./code-review.md`](./code-review.md); because this touches auth/data, also run [`./security-review.md`](./security-review.md). Add the Eclipse/MIT SPDX header to any new `.js` file ([`./license-check.md`](./license-check.md)).

## Guardrails
- Controllers stay thin. No business logic in routes or controllers. No Mongoose calls in controllers.
- Don't fabricate permission names or statuses — read `middlewares/permission.js` / the role model.
- Don't edit `docs/capabilities/*` claims without verifying against the new route/controller code.
- If the endpoint touches auth, tokens, file ops, or runtime, `security-review` is mandatory.
- New `.js` files must carry the SPDX header.
- Don't register a route outside its domain `index.js` — it won't be mounted.

## Exit criteria
- Route is live under `routes/v2/<domain>/`, controller delegates to service, model touched only if needed.
- Auth + validation chosen deliberately and verified against existing patterns.
- Jest test added and green; lint + prettier clean.
- Capability doc updated with code-grounded claims (incl. Risks); SITEMAP updated if page-facing.
- Self-review (+ security-review) done; SPDX headers present on new files.