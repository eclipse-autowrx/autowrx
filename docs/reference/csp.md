# Content Security Policy rollout

Production security headers are configured by `backend/src/config/csp.js` and
`backend/src/middlewares/contentSecurityPolicy.js`, mounted in `backend/src/app.js`.

## Roll out in two stages

1. Deploy with `CSP_MODE=report-only` (the default). The browser receives
   `Content-Security-Policy-Report-Only`; violations are reported but resources
   are not blocked. **This stage does not provide enforced CSP protection.**
2. Collect `CSP violation` events in the backend log pipeline for about seven
   days. Retain these logs for the observation period. Exercise authentication,
   Monaco editors, dashboards/widgets, trusted and sandboxed plugins, runtime
   WebSockets, configured SSO, and deployment-specific integrations. Reports are
   untrusted telemetry, not proof of an attack or a reason to auto-allow a host.
3. Review blocked origins/directives and approve only the integrations the
   deployment actually needs. Host changes require backend restart. Do not
   restore wildcard sources or unsafe script execution to resolve a violation.
4. Run the full browser suite against a disposable production-mode build with
   the same approved hosts and `CSP_MODE=enforce`, using
   `cd .agents && npx playwright test --config=playwright.csp.config.ts`.
   Set `BASE_URL`, `API_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` for that stack;
   it must declare `E2E_TEST_ENABLED=true`. This config checks enforcement before
   running and does not start Vite preview (preview omits production headers).
5. After the observation period and compatibility review, set
   `CSP_MODE=enforce` and restart the backend. The browser then receives an
   enforced `Content-Security-Policy`. For a compatibility incident, revert to
   `report-only`, retain reports, fix the affected flow, and repeat validation.

Deployment and a week of production observation are operational steps; merging
code or passing local tests does not complete them. No automatic timer switches
production into enforcement without that review.

## Policy and configuration

The production fallback is `default-src 'self'`. Scripts come only from the
application origin, explicitly configured script origins, or a fresh response
nonce used for the isolated plugin bootstrap. Script event attributes, arbitrary
inline scripts, `eval`, and `new Function` are blocked. Monaco and its language
workers are bundled locally, and bundled widget JavaScript uses external local
files. Vendor CDNs are not needed for these components.

| Variable | Adds exact origins to | Default |
|---|---|---|
| `CSP_MODE` | `report-only` or `enforce` | `report-only` |
| `CSP_SCRIPT_ORIGINS` | `script-src` (reviewed external plugin code only) | empty |
| `CSP_CONNECT_ORIGINS` | `connect-src` (API, WebSocket, runtime, SSO integrations) | empty |
| `CSP_FRAME_ORIGINS` | `frame-src` (embedded external widgets) | empty |
| `CSP_IMAGE_ORIGINS` | `img-src` (external images/avatars) | empty |
| `CSP_MEDIA_ORIGINS` | `media-src` | empty |

Origin lists are comma-separated, such as
`CSP_CONNECT_ORIGINS=https://kit.example.com,wss://kit.example.com`.
Entries must be exact HTTPS origins (WSS is also allowed for connections), with
no credentials, paths, queries, fragments or wildcards. Explicit HTTP/WS origins
are accepted only for loopback (`localhost`, `127.0.0.1`, `[::1]`) test services.
CORS configuration is separate: a regex CORS allowlist does not grant CSP access.
Do not copy example hosts without reviewing deployment requirements.

Styles allow `'self' 'unsafe-inline'` because React, Fluent UI and Monaco generate
style elements and attributes. This is an explicit CSS exception; scripts have
no unsafe execution exception. Fonts allow self/data; images allow self/data/blob;
media allows self/blob; workers allow self. Objects are forbidden. Forms, base
URLs and frame ancestors are restricted to self. Production upgrades insecure
requests. Development retains a permissive HMR policy without HTTPS upgrades.

The built SPA template is loaded once at backend startup (rebuild/restart to update it).
SPA HTML is served with a fresh cryptographic nonce and `Cache-Control: no-store`.
Reverse proxies must preserve CSP headers and must not cache/reuse SPA HTML.
Opaque-origin plugin frames inherit that policy: their approved bootstrap and
host-delivered plugin script receive the containing document's nonce. Frames
still omit `allow-same-origin`; plugin API restrictions are unchanged. Custom
widget HTML containing inline script or event handlers must migrate to approved
external script files before enforcement.

Existing uploaded-file CSP and plugin-bundle HTML sandbox headers remain
independently enforced, including during report-only rollout.

## Violation collection

`POST /v2/security/csp-reports` is public because browser-generated reports cannot
supply an application bearer token. It is mounted before authentication/database
middleware and before the general 50 MB JSON parser. It accepts legacy
`application/csp-report`, `application/reports+json` batches, and JSON. The policy
advertises the backward-compatible `report-uri` directive.

Limits: 16 KB per body, at most 20 reports per request, and 60 requests per minute
per IP per backend process. Valid reports return `204`; malformed/excessive batches return `400`,
oversized bodies `413`, and throttled requests `429`. The limiter remains active
independently of auth rate-limit configuration. Set `TRUST_PROXY` to match the
actual proxy topology.

Logs retain only directive, disposition and document/blocked/source **origins**
(or `inline`/`eval` resource markers). Paths, queries, fragments, credentials,
referrers, script samples, cookies and arbitrary body fields are discarded.
No reports are persisted in MongoDB. Configure the deployment's log retention
and aggregation to cover the observation period.

See the [Helmet reference](https://helmetjs.github.io/) and
[MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
