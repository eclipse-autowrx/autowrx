# Plugin Deployment

After `./build.sh` produces `index.js`, you host that bundle somewhere the AutoWRX frontend can fetch it over HTTPS with CORS enabled, then point the plugin record's `url` at it.

## Requirements

- **HTTPS** — browsers won't load mixed-content scripts.
- **CORS** — the host loads your script with `crossOrigin="anonymous"`, so the response must allow the AutoWRX origin (or `*`):
  ```
  Access-Control-Allow-Origin: *
  Content-Type: application/javascript; charset=utf-8
  ```
- **Correct MIME type** — serve `.js` as `application/javascript`.

## Cache headers

- **Production**: `Cache-Control: public, max-age=31536000, immutable` (bundle content is stable; cache-bust with a versioned filename or query param when you ship a new version, e.g. `index.js?v=1.2.3` or `index-[hash].js`).
- **Development**: `Cache-Control: no-cache` so edits take effect immediately.

## Provider quick examples

**GitHub Pages** — push `index.js` to a `gh-pages` branch (or use the `actions/deploy-pages` action), then use `https://<user>.github.io/<repo>/index.js`. Confirm the served `.js` response includes an `Access-Control-Allow-Origin` header (GitHub Pages does serve JS assets permissively, but verify for your setup).

**Netlify** — `netlify.toml`:
```toml
[build]
  command = "./build.sh"
  publish = "."
[[headers]]
  for = "/index.js"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Content-Type = "application/javascript; charset=utf-8"
```
Deploy with `netlify deploy --prod`; URL `https://<site>.netlify.app/index.js`.

**Vercel** — `vercel.json`:
```json
{
  "buildCommand": "./build.sh",
  "headers": [
    { "source": "/index.js", "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Content-Type", "value": "application/javascript; charset=utf-8" }
    ]}
  ]
}
```

**S3 + CloudFront** — `aws s3 cp index.js s3://<bucket>/index.js` with a bucket CORS policy allowing `*`, fronted by a CloudFront distribution; URL `https://<distribution>.cloudfront.net/index.js`. Invalidate after a new upload.

**Your own server (Nginx)** —
```nginx
location /index.js {
  add_header Access-Control-Allow-Origin "*";
  add_header Content-Type "application/javascript; charset=utf-8";
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

## Alternative: internal zip upload (hosted by the backend)

If you'd rather not run a separate host, upload a zip of the built plugin directory:

```bash
zip -r my-plugin.zip .            # from the plugin dir containing index.js
curl -X POST -F "file=@my-plugin.zip" \
  -H "Authorization: Bearer <token>" \
  https://<your-autowrx-host>/v2/system/plugin/upload/<slug>
```

The backend extracts it to `backend/static/plugin/<slug>/`, auto-detects the entry file (`index.js` preferred, then `index.html`), and serves it at `/plugin/<slug>/<entry>` with `is_internal: true`. No CORS needed (same origin as the app).

## Verifying it loads

After registering the plugin and attaching it to a tab, open the tab and check the browser console:

```js
console.log('DAPlugins:', window.DAPlugins)   // should show { 'page-plugin': { components, mount, unmount } }
```

If nothing renders within ~15 s, the host times out waiting for registration — confirm your bundle sets `window.DAPlugins['page-plugin']` and that the script URL is reachable (check the Network tab for the `<script>` request status and CORS errors).