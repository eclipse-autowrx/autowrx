# CORS Configuration Guide

## Issue Fixed
The CORS configuration has been updated to use the `CORS_ORIGINS` environment variable. Previously, it was hardcoded to only allow localhost and 127.0.0.1.

## How to Configure CORS_ORIGINS

The `CORS_ORIGINS` environment variable accepts **comma-separated regex patterns** for allowed origins. The code automatically adds both `http://` and `https://` prefixes to each pattern.

### Configuration Examples

#### 1. Allow localhost + your server IP (139.59.98.13)
```bash
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,139\.59\.98\.13:\d+
```
This allows:
- `http://localhost:3000`, `https://localhost:8080`, etc.
- `http://127.0.0.1:5000`, `https://127.0.0.1:9000`, etc.
- `http://139.59.98.13:80`, `https://139.59.98.13:443`, etc.

#### 2. Allow your domain name
```bash
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,example\.com,.*\.example\.com
```
This allows:
- localhost and 127.0.0.1 (development)
- `http://example.com` and `https://example.com`
- `http://subdomain.example.com` and `https://subdomain.example.com`

#### 3. Allow specific IP without port restrictions
```bash
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,139\.59\.98\.13
```
This allows only `http://139.59.98.13` and `https://139.59.98.13` (no port)

#### 4. Allow any subdomain and port
```bash
CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,.*\.yourdomain\.com:\d+
```

#### 5. Production example with specific domain
```bash
CORS_ORIGINS=autowrx\.com,.*\.autowrx\.com
```
This allows:
- `http://autowrx.com` and `https://autowrx.com`
- Any subdomain like `https://app.autowrx.com`, `https://api.autowrx.com`

## Important Notes

### Regex Escaping
- Use `\.` instead of `.` to match literal dots (e.g., `example\.com` not `example.com`)
- Use `\d+` to match any port number (e.g., `localhost:\d+`)
- Use `.*` to match any subdomain (e.g., `.*\.example\.com`)

### Security Considerations
1. **Be specific**: Don't use overly broad patterns like `.*` which would allow any origin
2. **Use HTTPS in production**: Make sure your production environment uses HTTPS
3. **Limit origins**: Only add origins you actually need

### How to Update

1. **Local Development (.env file)**:
   Edit your `backend/.env` file:
   ```bash
   CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,139\.59\.98\.13:\d+
   ```

2. **Production (Environment Variables)**:
   Set the environment variable in your deployment:
   ```bash
   export CORS_ORIGINS="localhost:\d+,127\.0\.0\.1:\d+,your-domain\.com,.*\.your-domain\.com"
   ```

3. **Docker Compose**:
   Add to your `docker-compose.yml`:
   ```yaml
   environment:
     - CORS_ORIGINS=localhost:\d+,127\.0\.0\.1:\d+,your-domain\.com
   ```

## Restart Required
After changing `CORS_ORIGINS`, you must **restart your backend server** for the changes to take effect.

## Troubleshooting

### Still getting CORS errors?
1. Check the server logs for "CORS blocked origin: [your-origin]" message
2. Verify your regex pattern is correct
3. Make sure you escaped special characters (`.` should be `\.`)
4. Verify the server was restarted after the change

### Example: Full origin in error log
If your error log shows:
```
CORS blocked origin: https://app.example.com:3000
```

Your CORS_ORIGINS should include:
```bash
CORS_ORIGINS=app\.example\.com:3000
```

Or to allow any subdomain with any port:
```bash
CORS_ORIGINS=.*\.example\.com:\d+
```

