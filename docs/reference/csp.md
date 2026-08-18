# Content Security Policy (CSP) Configuration

## Overview
The application uses Helmet.js to set Content Security Policy headers that control which resources can be loaded by the browser. This helps prevent XSS attacks and other security vulnerabilities.

> ⚠️ **The shipped CSP is more permissive than Helmet's defaults.** The current
> `backend/src/app.js` sets an effectively **wildcard** policy in both dev and
> production (`defaultSrc ['*']`, `scriptSrc`/`connectSrc` including `'*'`). The
> values documented below are what is actually shipped; a more restrictive,
> per-origin policy is a future target, not the current state. See
> [../architecture/auth-security.md](../architecture/auth-security.md) (§6).

## Location
CSP configuration is in `backend/src/app.js` (lines 44-83)

## Shipped configuration

`app.js` sets an effectively **wildcard** policy in both dev and production — not the restrictive policy Helmet defaults to. The only restrictive directive is `objectSrc: ['none']`. This is a known gap (see [../architecture/auth-security.md](../architecture/auth-security.md) §6); the per-origin allowlists (and the historical `cdn.jsdelivr.net` Monaco entry) that appeared in older revisions of this doc describe a **target policy, not what is shipped**.

### Development (lines 44-63)
```javascript
defaultSrc: ["*"],
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
styleSrc: ["'self'", "'unsafe-inline'", "*"],
imgSrc: ["*", "data:", "blob:"],
connectSrc: ["*", "ws:", "wss:"],
fontSrc: ["*", "data:"],
objectSrc: ["'none'"],
mediaSrc: ["*"],
frameSrc: ["*"],
workerSrc: ["'self'", "blob:", "*"],
upgradeInsecureRequests: null,   // disabled in dev
```

### Production (lines 64-83)
```javascript
defaultSrc: ["*"],
scriptSrc: ["'unsafe-inline'", "'unsafe-eval'", "*"],
scriptSrcElem: ["'unsafe-inline'", "'unsafe-eval'", "*"],
styleSrc: ["'unsafe-inline'", "*"],
imgSrc: ["*", "data:", "blob:"],
connectSrc: ["*"],
fontSrc: ["*", "data:"],
objectSrc: ["'none'"],
mediaSrc: ["*"],
frameSrc: ["*"],
workerSrc: ["'self'", "blob:", "*"],
```

## CSP Directives Explained

| Directive | Purpose | Shipped value |
|-----------|---------|----------------|
| `defaultSrc` | Fallback for other directives | `*` |
| `scriptSrc` | JavaScript sources | `'self'` (dev), inline, eval, `*` |
| `scriptSrcElem` | `<script>` element sources | `'self'` (dev), inline, eval, `*` |
| `styleSrc` | CSS sources | `'self'` (dev), inline, `*` |
| `imgSrc` | Image sources | `*`, `data:`, `blob:` |
| `connectSrc` | XHR, fetch, WebSocket sources | `*`, `ws:`, `wss:` (dev) |
| `fontSrc` | Font sources | `*`, `data:` |
| `workerSrc` | Web Worker sources | `'self'`, `blob:`, `*` |
| `objectSrc` | `<object>`, `<embed>` sources | `'none'` (blocked) |
| `mediaSrc` | Audio/Video sources | `*` |
| `frameSrc` | iframe sources | `*` |

## Adding New CDN Sources

> ℹ️ The shipped policy already allows `*` for script/style/connect/font/img
> sources, so adding a specific CDN origin is only relevant **once the policy
> is tightened** away from the wildcard. The examples below assume such a
> restrictive policy.

If you need to add another CDN (e.g., Google Fonts, other libraries), update the relevant directives in `backend/src/app.js`:

### Example: Adding Google Fonts
```javascript
styleSrc: [
  "'self'", 
  "'unsafe-inline'", 
  "https:", 
  "https://cdn.jsdelivr.net",
  "https://fonts.googleapis.com"  // Add this
],
fontSrc: [
  "'self'", 
  "https:", 
  "data:", 
  "https://cdn.jsdelivr.net",
  "https://fonts.gstatic.com"  // Add this
],
```

### Example: Adding Analytics
```javascript
scriptSrc: [
  "'self'", 
  "'unsafe-inline'", 
  "'unsafe-eval'", 
  "https://cdn.jsdelivr.net",
  "https://www.googletagmanager.com"  // Add this
],
connectSrc: [
  "'self'", 
  "https://cdn.jsdelivr.net",
  "https://www.google-analytics.com"  // Add this
],
```

## Common CSP Error Messages

### Script Loading Error
```
Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```
**Fix**: Add the domain to `scriptSrc` and `scriptSrcElem`

### Style Loading Error
```
Refused to apply inline style because it violates the following Content Security Policy directive: "style-src 'self'"
```
**Fix**: Add `'unsafe-inline'` to `styleSrc` or add the specific domain

### WebSocket Connection Error
```
Refused to connect to 'wss://example.com/socket' because it violates the following Content Security Policy directive: "connect-src 'self'"
```
**Fix**: Add the domain or `wss:` to `connectSrc`

### Font Loading Error
```
Refused to load the font 'https://example.com/font.woff2' because it violates the following Content Security Policy directive: "font-src 'self'"
```
**Fix**: Add the domain to `fontSrc`

## Security Considerations

### ⚠️ Unsafe Directives
The following directives reduce security and should be avoided if possible:

- `'unsafe-inline'` - Allows inline scripts/styles (required by some frameworks)
- `'unsafe-eval'` - Allows eval() and similar functions (required by Monaco Editor)
- `'unsafe-hashes'` - Allows specific inline scripts by hash

**Current Usage**: We use `'unsafe-inline'` and `'unsafe-eval'` because:
- Monaco Editor requires `eval()` for its functionality
- React/Vite uses inline styles during development
- Many UI libraries use inline styles

### ✅ Best Practices
1. **Be specific**: Use exact domains instead of wildcards when possible
2. **Test thoroughly**: Changes to CSP can break functionality
3. **Use https:**: Only allow HTTPS sources in production
4. **Monitor violations**: Use CSP reporting to detect issues
5. **Restart required**: CSP changes require backend restart

## Testing CSP Changes

1. **Update** the CSP configuration in `backend/src/app.js`
2. **Restart** the backend server
3. **Check** browser console for CSP violation errors
4. **Verify** all resources load correctly

### Browser Console
CSP violations appear in the browser console with clear error messages showing:
- What was blocked
- Which directive blocked it
- The full CSP that was violated

## Restart After Changes
```bash
# Backend restart required (dev)
cd backend && yarn dev

# Or with PM2
pm2 restart autowrx

# Or with Docker
docker compose -f ../instance-setup/docker-compose.prod.yml --env-file ../instance-setup/.env.prod restart autowrx
```

## Related Files
- Configuration: `backend/src/app.js` (lines 44-83)
- CORS Configuration: See [./cors.md](./cors.md)

## Additional Resources
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

