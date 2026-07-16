# Plugin Deployment Guide

Learn how to deploy your plugin to production and make it available to users.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [GitHub Pages](#github-pages)
- [Netlify](#netlify)
- [Vercel](#vercel)
- [AWS S3 + CloudFront](#aws-s3--cloudfront)
- [Custom Server](#custom-server)
- [CDN Configuration](#cdn-configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Deployment Overview

To deploy a plugin, you need to:

1. **Build** the plugin (`./build.sh`)
2. **Upload** `index.js` (and optionally `index.js.map`) to a hosting service
3. **Configure CORS** headers on the hosting service
4. **Register** the plugin URL in digital.auto admin panel

### Requirements

Your hosting must:
- ✅ Serve files over HTTPS (required for production)
- ✅ Allow CORS (Cross-Origin Resource Sharing)
- ✅ Serve `Content-Type: application/javascript` header
- ✅ Have high availability and low latency

---

## GitHub Pages

**Best for**: Personal projects, open-source plugins, prototypes

### Step 1: Create Repository

```bash
# Initialize git in your plugin directory
cd vehicle-dashboard
git init

# Create .gitignore
echo "node_modules" > .gitignore
echo ".DS_Store" >> .gitignore

# Initial commit
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
gh repo create my-plugin --public --source=. --remote=origin --push
# Or manually create repo on GitHub and push
```

### Step 2: Configure GitHub Pages

**Option A: Via GitHub Website**
1. Go to repository settings
2. Navigate to "Pages" section
3. Select source: "Deploy from a branch"
4. Select branch: `main` or `master`
5. Select folder: `/` (root)
6. Click "Save"

**Option B: Via GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Plugin

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Build plugin
        run: ./build.sh

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### Step 3: Get Plugin URL

Your plugin will be available at:
```
https://username.github.io/repository-name/index.js
```

Example:
```
https://johndoe.github.io/vehicle-dashboard/index.js
```

### Step 4: Register in digital.auto

In the admin panel:
- **Name**: Vehicle Dashboard
- **Slug**: `vehicle-dashboard`
- **URL**: `https://johndoe.github.io/vehicle-dashboard/index.js`

---

## Netlify

**Best for**: Modern web apps, automatic deployments, edge functions

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Build Your Plugin

```bash
./build.sh
```

### Step 3: Deploy

**Option A: Manual Deploy**

```bash
# Deploy current directory
netlify deploy --prod

# Follow prompts:
# - Create new site? Yes
# - Publish directory: . (current directory)

# Your plugin will be deployed to:
# https://random-name-123.netlify.app/index.js
```

**Option B: Connect GitHub Repository**

1. Create `netlify.toml` in your repository:

```toml
[build]
  command = "./build.sh"
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Content-Type = "application/javascript; charset=utf-8"
```

2. Push to GitHub

3. Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - Click "Deploy site"

4. Your plugin will be at:
```
https://your-site-name.netlify.app/index.js
```

### Step 4: Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Add your domain (e.g., `plugins.example.com`)
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic with Let's Encrypt)

Your plugin will be at:
```
https://plugins.example.com/index.js
```

---

## Vercel

**Best for**: Next.js apps, serverless functions, edge computing

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
# From your plugin directory
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? vehicle-dashboard
# - In which directory is your code? ./
# - Want to override settings? No

# Your plugin will be at:
# https://vehicle-dashboard.vercel.app/index.js
```

### Step 3: Configure for Production

Create `vercel.json`:

```json
{
  "buildCommand": "./build.sh",
  "outputDirectory": ".",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    }
  ]
}
```

### Step 4: Deploy to Production

```bash
vercel --prod
```

### Step 5: Custom Domain (Optional)

```bash
# Add domain
vercel domains add plugins.example.com

# Follow DNS configuration instructions
```

---

## AWS S3 + CloudFront

**Best for**: Enterprise deployments, high traffic, custom CDN configuration

### Step 1: Create S3 Bucket

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure

# Create bucket
aws s3 mb s3://my-plugin-bucket

# Enable static website hosting
aws s3 website s3://my-plugin-bucket \
  --index-document index.js
```

### Step 2: Configure Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-plugin-bucket/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket my-plugin-bucket \
  --policy file://bucket-policy.json
```

### Step 3: Configure CORS

Create `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:

```bash
aws s3api put-bucket-cors \
  --bucket my-plugin-bucket \
  --cors-configuration file://cors.json
```

### Step 4: Upload Plugin

```bash
# Build plugin
./build.sh

# Upload to S3
aws s3 cp index.js s3://my-plugin-bucket/ \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000"

# Optional: Upload source map
aws s3 cp index.js.map s3://my-plugin-bucket/ \
  --content-type "application/json"
```

### Step 5: Create CloudFront Distribution

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name my-plugin-bucket.s3.amazonaws.com \
  --default-root-object index.js

# Note the Distribution ID and Domain Name
# Domain: d1234567890abc.cloudfront.net
```

Your plugin will be at:
```
https://d1234567890abc.cloudfront.net/index.js
```

### Step 6: Custom Domain (Optional)

1. Create SSL certificate in AWS Certificate Manager
2. Configure CloudFront to use custom domain
3. Update DNS CNAME record

Plugin will be at:
```
https://plugins.example.com/index.js
```

### Step 7: Automated Deployment

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Building plugin..."
./build.sh

echo "Uploading to S3..."
aws s3 cp index.js s3://my-plugin-bucket/ \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.js"

echo "✅ Deployment complete!"
```

---

## Custom Server

**Best for**: Full control, existing infrastructure

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name plugins.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/plugins;

    location ~* \.js$ {
        add_header Access-Control-Allow-Origin *;
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "public, max-age=31536000";
    }

    location ~* \.map$ {
        add_header Access-Control-Allow-Origin *;
        add_header Content-Type "application/json";
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName plugins.example.com

    DocumentRoot /var/www/plugins

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    <FilesMatch "\.js$">
        Header set Access-Control-Allow-Origin "*"
        Header set Content-Type "application/javascript; charset=utf-8"
        Header set Cache-Control "public, max-age=31536000"
    </FilesMatch>

    <FilesMatch "\.map$">
        Header set Access-Control-Allow-Origin "*"
        Header set Content-Type "application/json"
    </FilesMatch>
</VirtualHost>
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy plugin files
COPY index.js /usr/share/nginx/html/
COPY index.js.map /usr/share/nginx/html/

EXPOSE 80
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;

    location ~* \.js$ {
        add_header Access-Control-Allow-Origin *;
        add_header Content-Type "application/javascript; charset=utf-8";
    }
}
```

Build and run:

```bash
docker build -t my-plugin .
docker run -p 8080:80 my-plugin

# Plugin available at:
# http://localhost:8080/index.js
```

---

## CDN Configuration

### Cloudflare

1. Sign up at [Cloudflare](https://www.cloudflare.com)
2. Add your domain
3. Update nameservers
4. Create Page Rule:
   - URL: `plugins.example.com/*.js`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 year
5. Configure CORS in Workers (optional):

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Content-Type', 'application/javascript')
  return newResponse
}
```

---

## Best Practices

### Versioning

**Approach 1: Query Parameters**
```
https://example.com/plugin.js?v=1.2.3
```

**Approach 2: Path-based**
```
https://example.com/v1.2.3/plugin.js
```

**Approach 3: Hash-based (Recommended)**
```
https://example.com/plugin-abc123.js
```

Update `vite.config.js`:

```javascript
export default defineConfig({
  build: {
    lib: {
      fileName: () => `index-[hash].js`
    }
  }
})
```

### Cache Strategy

**For Production Builds**:
```
Cache-Control: public, max-age=31536000, immutable
```

**For Development**:
```
Cache-Control: no-cache
```

### Source Maps

**Upload source maps** for debugging:

```bash
# Upload both files
aws s3 cp index.js s3://bucket/
aws s3 cp index.js.map s3://bucket/
```

**Or keep source maps private**:

```bash
# Upload only .js file
aws s3 cp index.js s3://bucket/
```

### Health Checks

Create a health check endpoint:

Create `health.json`:
```json
{
  "status": "ok",
  "plugin": "vehicle-dashboard",
  "version": "1.0.0",
  "updated": "2025-01-14T00:00:00Z"
}
```

Upload:
```bash
aws s3 cp health.json s3://bucket/
```

Check health:
```bash
curl https://example.com/health.json
```

### Monitoring

**Track plugin loads**:

```typescript
// Add to plugin
console.log('[Plugin] Loaded at', new Date().toISOString());

// Send analytics
if (window.gtag) {
  window.gtag('event', 'plugin_load', {
    plugin_name: 'vehicle-dashboard',
    plugin_version: '1.0.0'
  });
}
```

---

## Troubleshooting

### CORS Errors

**Error**: `Access to script at 'https://...' from origin 'https://...' has been blocked by CORS`

**Solution**: Add CORS headers:
```
Access-Control-Allow-Origin: *
```

### Wrong Content-Type

**Error**: Plugin doesn't execute

**Solution**: Ensure Content-Type header:
```
Content-Type: application/javascript; charset=utf-8
```

### Cache Issues

**Error**: Old version loads after update

**Solution**:
1. Use versioned URLs: `plugin.js?v=1.2.3`
2. Clear CDN cache
3. Use cache busting: `plugin-[hash].js`

### SSL Certificate Errors

**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution**:
1. Use Let's Encrypt for free SSL
2. Ensure certificate is valid and not expired
3. Test with: `curl -v https://example.com/plugin.js`

### Plugin Not Loading

**Check**:
1. ✅ URL is accessible: `curl https://example.com/plugin.js`
2. ✅ Returns JavaScript code
3. ✅ CORS headers present
4. ✅ HTTPS (not HTTP)
5. ✅ Content-Type is `application/javascript`
6. ✅ Plugin registers on `window.DAPlugins['page-plugin']`

### Debugging

**Enable verbose logging**:

```typescript
// Add to plugin
console.log('[Plugin] Initializing...');
console.log('[Plugin] Data:', data);
console.log('[Plugin] API:', api);
console.log('[Plugin] Config:', config);

// In host app, check:
console.log('DAPlugins:', window.DAPlugins);
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Plugin builds without errors
- [ ] Tested locally with `npx serve`
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Content-Type header correct
- [ ] Cache headers configured
- [ ] Source maps uploaded (optional)
- [ ] Plugin registered in admin panel
- [ ] Tested in production environment
- [ ] Monitoring/analytics configured
- [ ] Documentation updated
- [ ] Version tagged in git

---

## Next Steps

- 📚 Review all documentation
- 🛠️ Build and deploy your plugin
- 💡 Share your plugin with the community
- 🚀 Explore [Advanced Topics](./05-advanced.md) for optimization

## Resources

- **Hosting Providers**:
  - [GitHub Pages](https://pages.github.com/)
  - [Netlify](https://www.netlify.com/)
  - [Vercel](https://vercel.com/)
  - [Cloudflare Pages](https://pages.cloudflare.com/)
  - [AWS S3](https://aws.amazon.com/s3/)

- **SSL Certificates**:
  - [Let's Encrypt](https://letsencrypt.org/)
  - [Cloudflare SSL](https://www.cloudflare.com/ssl/)

- **CDN Services**:
  - [Cloudflare](https://www.cloudflare.com/)
  - [AWS CloudFront](https://aws.amazon.com/cloudfront/)
  - [Fastly](https://www.fastly.com/)
