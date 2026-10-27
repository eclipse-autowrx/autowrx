# CSP rollout and browser testing

Production CSP defaults to report-only. Operators must retain/review violation
logs for about seven days and explicitly set `CSP_MODE=enforce`; passing local
tests does not complete production observation. See [rollout reference](../../docs/reference/csp.md).

Use `.agents/playwright.csp.config.ts` against the Express-served production
build. Standard Vite preview omits backend CSP headers and cannot verify CSP.
Opaque-origin plugin srcdoc inherits the containing page policy, so the host
page nonce must authorize its inline bootstrap and host-delivered plugin script.

Verified 2026-10-27 against `backend/src/middlewares/contentSecurityPolicy.js`,
`frontend/src/components/organisms/SandboxedPluginFrame.tsx`, and browser tests.
