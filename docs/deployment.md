# Deployment

## Environment Configuration

### Environment Variables

AutoWRX uses environment variables for configuration across different deployment environments. These variables control API endpoints, feature flags, and external service integrations.

#### Development Environment (`.env.local`)
```bash
# Backend Services
VITE_SERVER_BASE_URL=https://backend-core-dev.digital.auto
VITE_SERVER_BASE_WSS_URL=wss://backend-core-dev.digital.auto
VITE_SERVER_VERSION=v2

# External Services
VITE_CACHE_BASE_URL=https://cache.digitalauto.tech
VITE_KIT_SERVER_URL=https://kit.digitalauto.tech
VITE_INVENTORY_FRONTEND_URL=https://fe.inventory.digital.auto

# Authentication
VITE_GITHUB_CLIENT_ID=your_github_client_id

# Feature Flags
VITE_SHOW_PRIVACY_POLICY=false
VITE_SHOW_GENAI_WIZARD=false
VITE_DISABLE_EMAIL_LOGIN=false
VITE_STRICT_AUTH=false
VITE_ENABLE_SUPPORT=true

# Runtime Configuration
VITE_DEFAULT_MODEL_ID=665826e3194aff003dd2f67b
```

#### Staging Environment (`.env.staging`)
```bash
# Backend Services
VITE_SERVER_BASE_URL=https://backend-core-staging.digital.auto
VITE_SERVER_BASE_WSS_URL=wss://backend-core-staging.digital.auto
VITE_SERVER_VERSION=v2

# External Services
VITE_CACHE_BASE_URL=https://cache-staging.digitalauto.tech
VITE_KIT_SERVER_URL=https://kit-staging.digitalauto.tech
VITE_INVENTORY_FRONTEND_URL=https://fe-staging.inventory.digital.auto

# Authentication
VITE_GITHUB_CLIENT_ID=staging_github_client_id

# Feature Flags
VITE_SHOW_PRIVACY_POLICY=true
VITE_SHOW_GENAI_WIZARD=true
VITE_DISABLE_EMAIL_LOGIN=false
VITE_STRICT_AUTH=true
VITE_ENABLE_SUPPORT=true
```

#### Production Environment (`.env.production`)
```bash
# Backend Services
VITE_SERVER_BASE_URL=https://backend-core.digital.auto
VITE_SERVER_BASE_WSS_URL=wss://backend-core.digital.auto
VITE_SERVER_VERSION=v2

# External Services
VITE_CACHE_BASE_URL=https://cache.digitalauto.tech
VITE_KIT_SERVER_URL=https://kit.digitalauto.tech
VITE_INVENTORY_FRONTEND_URL=https://fe.inventory.digital.auto

# Authentication
VITE_GITHUB_CLIENT_ID=production_github_client_id

# Feature Flags
VITE_SHOW_PRIVACY_POLICY=true
VITE_SHOW_GENAI_WIZARD=true
VITE_DISABLE_EMAIL_LOGIN=false
VITE_STRICT_AUTH=true
VITE_ENABLE_SUPPORT=true
```

### Configuration Management

#### Configuration File (`src/configs/config.ts`)
```typescript
const config: any = {
  // Backend URLs
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL ||
    'https://backend-core-dev.digital.auto',
  serverBaseWssUrl:
    import.meta.env.VITE_SERVER_BASE_WSS_URL ||
    'wss://backend-core-dev.digital.auto',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  
  // External Services
  logBaseUrl: import.meta.env.PROD
    ? 'https://logs.digital.auto'
    : 'https://logs.digitalauto.asia',
  cacheBaseUrl:
    import.meta.env.VITE_CACHE_BASE_URL || 'https://cache.digitalauto.tech',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  
  // Feature Flags
  showPrivacyPolicy: import.meta.env.VITE_SHOW_PRIVACY_POLICY === 'true',
  showGenAIWizard: import.meta.env.VITE_SHOW_GENAI_WIZARD === 'true',
  disableEmailLogin: import.meta.env.VITE_DISABLE_EMAIL_LOGIN === 'true',
  strictAuth: import.meta.env.VITE_STRICT_AUTH === 'true',
  enableSupport: import.meta.env.VITE_ENABLE_SUPPORT === 'true',
  
  // Runtime Configuration
  defaultModelId: import.meta.env.VITE_DEFAULT_MODEL_ID || '665826e3194aff003dd2f67b',
  
  // Authentication
  sso: 'bosch',
  instance: 'digitalauto',
  
  // GenAI Configuration
  genAI: {
    wizardCover: '/imgs/default_prototype_cover.jpg',
    hideMarketplace: false,
    defaultEndpointUrl: 'https://backend-core-dev.digital.auto/v2/genai',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    agent: {
      url: 'https://workflow.digital.auto/webhook/e9b346c8-68be-4c9d-8453-6c03a0bdca96/chat'
    },
  },
}

export default config
```

## Docker Setup

### Development Docker

#### Development Dockerfile (`Dockerfile.dev`)
```dockerfile
# Development Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

#### Development Docker Compose (`docker-compose.dev.yml`)
```yaml
version: '3.8'

services:
  autowrx-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_SERVER_BASE_URL=https://backend-core-dev.digital.auto
      - VITE_SERVER_VERSION=v2
    networks:
      - autowrx-network

  # Optional: Add other services for development
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - autowrx-network

networks:
  autowrx-network:
    driver: bridge
```

### Production Docker

#### Production Dockerfile (`Dockerfile`)
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy environment-specific configuration
COPY nginx/nginx.prod.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Production Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  autowrx:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - VITE_SERVER_BASE_URL=https://backend-core.digital.auto
      - VITE_SERVER_VERSION=v2
    networks:
      - autowrx-network
    restart: unless-stopped

  # Optional: Add monitoring
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter
    ports:
      - "9113:9113"
    command:
      - -nginx.scrape-uri=http://autowrx/nginx_status
    networks:
      - autowrx-network

networks:
  autowrx-network:
    driver: bridge
```

### Preview Docker

#### Preview Docker Compose (`docker-compose.preview.yml`)
```yaml
version: '3.8'

services:
  autowrx-preview:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4173:80"
    environment:
      - NODE_ENV=production
      - VITE_SERVER_BASE_URL=https://backend-core-staging.digital.auto
      - VITE_SERVER_VERSION=v2
    networks:
      - autowrx-preview-network

networks:
  autowrx-preview-network:
    driver: bridge
```

## Nginx Configuration

### Main Nginx Configuration (`nginx/nginx.conf`)
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Application Configuration (`nginx/nginx.prod.conf`)
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # Cache HTML files
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://backend-core.digital.auto/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Nginx status (for monitoring)
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Build Process

### Vite Configuration (`vite.config.ts`)
```typescript
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
})
```

### Build Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite --port 3000 --host 0.0.0.0",
    "build": "tsc && vite build",
    "build:staging": "tsc && vite build --mode staging",
    "build:production": "tsc && vite build --mode production",
    "preview": "vite preview",
    "analyze": "npm run build && npx vite-bundle-analyzer dist",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            your-registry/autowrx:staging
            your-registry/autowrx:${{ github.sha }}
          build-args: |
            NODE_ENV=production
            VITE_SERVER_BASE_URL=${{ secrets.STAGING_SERVER_URL }}

      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            your-registry/autowrx:latest
            your-registry/autowrx:${{ github.sha }}
          build-args: |
            NODE_ENV=production
            VITE_SERVER_BASE_URL=${{ secrets.PRODUCTION_SERVER_URL }}

      - name: Deploy to production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."
```

### Deployment Scripts

#### Deploy Script (`scripts/deploy.sh`)
```bash
#!/bin/bash

# Deploy script for AutoWRX
set -e

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_IMAGE="your-registry/autowrx:${ENVIRONMENT}"
CONTAINER_NAME="autowrx-${ENVIRONMENT}"

echo "Deploying AutoWRX to ${ENVIRONMENT}..."

# Pull latest image
docker pull ${DOCKER_IMAGE}

# Stop existing container
docker stop ${CONTAINER_NAME} || true
docker rm ${CONTAINER_NAME} || true

# Start new container
docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p 80:80 \
  -e NODE_ENV=production \
  ${DOCKER_IMAGE}

echo "Deployment completed successfully!"
```

## Monitoring and Logging

### Health Checks

#### Application Health Check
```typescript
// src/utils/healthCheck.ts
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health')
    return response.ok
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}

// Usage in components
useEffect(() => {
  const checkHealth = async () => {
    const isHealthy = await healthCheck()
    if (!isHealthy) {
      // Handle unhealthy state
      console.error('Application is unhealthy')
    }
  }
  
  checkHealth()
  const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
  
  return () => clearInterval(interval)
}, [])
```

#### Docker Health Check
```dockerfile
# Add to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
```

### Logging Configuration

#### Application Logging
```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data)
    }
  }
}
```

#### Nginx Logging
```nginx
# Add to nginx.conf
log_format detailed '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log detailed;
error_log /var/log/nginx/error.log warn;
```

## Security Considerations

### Security Headers

#### Nginx Security Headers
```nginx
# Add to nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Environment Security

#### Secrets Management
```bash
# Use environment variables for secrets
export DATABASE_URL="postgresql://user:password@localhost:5432/db"
export JWT_SECRET="your-super-secret-jwt-key"
export API_KEY="your-api-key"

# Never commit secrets to version control
echo "*.env" >> .gitignore
echo "secrets/" >> .gitignore
```

## Performance Optimization

### Build Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# Optimize bundle
npm run build -- --mode production
```

#### Image Optimization
```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine AS builder
# ... build steps

FROM nginx:alpine
# Copy only necessary files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
```

### Runtime Optimization

#### Caching Strategy
```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API responses
location /api/ {
    proxy_cache_valid 200 1h;
    proxy_cache_valid 404 1m;
}
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint
```

#### Docker Issues
```bash
# Clean up Docker resources
docker system prune -a

# Check container logs
docker logs autowrx-container

# Restart container
docker restart autowrx-container
```

#### Nginx Issues
```bash
# Check nginx configuration
nginx -t

# Reload nginx configuration
nginx -s reload

# Check nginx logs
tail -f /var/log/nginx/error.log
```

### Debug Commands

#### Development Debugging
```bash
# Start with debug logging
DEBUG=* npm run dev

# Check environment variables
printenv | grep VITE_

# Check network connectivity
curl -I https://backend-core-dev.digital.auto
```

#### Production Debugging
```bash
# Check container status
docker ps -a

# Execute commands in container
docker exec -it autowrx-container sh

# Check nginx status
curl http://localhost/nginx_status
``` 