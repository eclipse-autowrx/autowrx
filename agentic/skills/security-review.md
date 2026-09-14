# Skill: Security Review
> Review the current diff for security regressions before commit/PR.

## When to use
Run this whenever the change touches any of: **auth, tokens, cookies, permissions/RBAC, file operations (path traversal), `child_process`/exec/runtime, plugins (unsandboxed), secrets/config, CORS/CSP, uploads, or user/personal data.** Pair it with `./code-review.md` (which covers general quality); this skill is the security-focused pass. Claude Code also has a **built-in** `/security-review` slash command (harness-provided, available in any repo) that runs a similar pass interactively — align with it and don't contradict its findings.

## Steps
1. **Get the diff:** `git diff main...HEAD` (and `git diff` for unstaged). Identify every new/changed route, middleware, service, model, and config flag.
2. **Load the capability risk checklist.** For each touched capability, open `docs/capabilities/<cluster>.md` and read its **Security:** and **Data protection:** lines — those are the code-grounded mitigations you must verify still hold. Start with `docs/capabilities/identity-access.md` (auth/tokens/RBAC) and `docs/capabilities/plugins.md` (unsandboxed execution) when relevant. Cross-reference `docs/reference/authentication-cookie-handling.md`, `docs/reference/csp.md`, and CORS reference if present.
3. **Check auth gating on every new/changed route.** Each route must use `auth(...)`, `auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING })`, or an equivalent; writes require auth + `checkPermission`. Confirm owner bypass is intentional. Confirm site flags (`PUBLIC_VIEWING`, `SELF_REGISTRATION`, `PASSWORD_MANAGEMENT`, `SSO_AUTO_REGISTRATION`) are checked where the capability doc says they must be.
4. **Check the known-gap class.** `authLimiter` is defined in `backend/src/middlewares/rateLimiter.js` but not applied to any route. If a change adds an auth endpoint without applying a limiter, or defines a limiter but doesn't wire it, flag it. Look for the same pattern on other new endpoints (brute-forceable: login, register, forgot/reset password, SSO).
5. **Check secrets & logging.** No tokens, refresh cookies, passwords, reset codes, or SSO `clientSecret`s in logs, response bodies, or frontend bundles. Refresh token must stay in the httpOnly cookie only (never in `{ tokens }` body). Passwords/secret fields must be Mongoose `private`.
6. **Check input validation & file ops.** Path-joining on uploads/plugins/asset reads must sanitize against traversal (`../`, absolute paths). `POST /v2/plugin/upload/:slug` runs system `unzip` on user zips — flag any widening of accepted types, size limit, or ownership bypass.
7. **Check plugin unsandboxed execution.** Plugins run same-origin, unsandboxed with full DOM/window. Confirm no auth tokens/secrets are passed into `PluginAPI`/`config`/`data`; only public site configs. Flag any change that increases plugin surface (new `window.DAPlugins` channels, new `PluginAPI` methods exposing user data or tokens).
8. **Check CORS/CSP headers.** If `config/cors` or CSP middleware changed, confirm credentials + origin allowlist stays tight; `SameSite=None`+`Secure` only in prod.
9. **Rank findings:** Critical (auth bypass, secret leak, RCE/path traversal, missing ownership) → High (missing rate-limit on brute-forceable endpoint, broken validation) → Medium (info leak, flag not enforced) → Low (hardening). Give each a `file:line` anchor and the specific mitigation.

## Guardrails
- **Don't silently fold a security finding into a fix.** A finding that you then fix is still a finding — record it so the reviewer/PR sees it. Don't hide regressions by editing the diff.
- **Report findings ranked by severity, not by file order.** Never mark "clean" to keep momentum — if you didn't verify a touched route, say so.
- Don't edit `docs/capabilities/*` Risk claims during this skill; if a mitigation no longer matches code, raise it as a finding (the catalog is code-grounded — fix the code or update the doc in a separate change via `./docs-update.md`).
- This is a review, not a harden-everything pass. Flag out-of-scope pre-existing issues separately; only fix what the current diff introduced or broke unless asked.

## Exit criteria
Return a short findings list, each with severity + `file:line` + one-line mitigation, or explicitly **"clean"** with the capability docs you checked listed. If you also ran Claude Code's built-in `/security-review`, note whether its findings match. Do not commit or push — hand the list to the caller (this skill is review-only; commit via `./commit-and-pr.md`).