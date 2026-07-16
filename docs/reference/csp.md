# Content Security Policy (CSP) Configuration

## Overview
The application uses Helmet.js to set Content Security Policy headers that control which resources can be loaded by the browser. This helps prevent XSS attacks and other security vulnerabilities.

## Location
CSP configuration is in `backend/src/app.js` (lines 43-79)

## Recent Fix
Added support for Monaco Editor CDN (`cdn.jsdelivr.net`) to resolve:
```
Refused to load the script 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js' because it violates the following Content Security Policy directive
```

## Current Configuration

### Development Environment
More permissive to allow local development with Vite:
```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:3210", "https://localhost:3210"]
styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:3210", "https://localhost:3210", "https:"]
connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3210", "https://localhost:3210"]
```

### Production Environment
More restrictive, but allows CDN resources:
```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"]
scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"]
styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdn.jsdelivr.net"]
connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
fontSrc: ["'self'", "https:", "data:", "https://cdn.jsdelivr.net"]
workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"]
```

## CSP Directives Explained

| Directive | Purpose | Current Values |
|-----------|---------|----------------|
| `defaultSrc` | Fallback for other directives | `'self'` only |
| `scriptSrc` | JavaScript sources | Self, inline, eval, CDN |
| `scriptSrcElem` | `<script>` element sources | Self, inline, eval, CDN |
| `styleSrc` | CSS sources | Self, inline, HTTPS, CDN |
| `imgSrc` | Image sources | Self, data URIs, HTTPS |
| `connectSrc` | XHR, fetch, WebSocket sources | Self, CDN |
| `fontSrc` | Font sources | Self, HTTPS, data URIs, CDN |
| `workerSrc` | Web Worker sources | Self, blob, CDN |
| `objectSrc` | `<object>`, `<embed>` sources | None (blocked) |
| `mediaSrc` | Audio/Video sources | Self only |
| `frameSrc` | iframe sources | Self only |

## Adding New CDN Sources

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
# Backend restart required
cd backend
npm restart

# Or with PM2
pm2 restart autowrx

# Or with Docker
docker-compose restart backend
```

## Related Files
- Configuration: `backend/src/app.js` (lines 43-79)
- CORS Configuration: See `CORS_CONFIGURATION.md`

## Additional Resources
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

