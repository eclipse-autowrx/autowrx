// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const helmet = require('helmet');
const cookies = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const passport = require('passport');
const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const routesV2 = require('./routes/v2');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { setupProxy } = require('./config/proxyHandler');
const { init: initSocketIO } = require('./config/socket');
const auth = require('./middlewares/auth');

const app = express();

// Trust proxy when running behind Nginx or other reverse proxy
// This is essential for correct handling of X-Forwarded-* headers
app.set('trust proxy', true);

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// use cookies
app.use(cookies());

// set security HTTP headers
if (config.env === 'development') {
  // Permissive CSP for development — mirrors production
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['*'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
          scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
          styleSrc: ["'self'", "'unsafe-inline'", '*'],
          imgSrc: ['*', 'data:', 'blob:'],
          connectSrc: ['*', 'ws:', 'wss:'],
          fontSrc: ['*', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ['*'],
          frameSrc: ['*'],
          workerSrc: ["'self'", 'blob:', '*'],
          upgradeInsecureRequests: null, // Disable upgrade to HTTPS in development
        },
      },
    }),
  );
} else {
  // Production CSP - more restrictive but allows the frontend assets
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['*'],
          scriptSrc: ["'unsafe-inline'", "'unsafe-eval'", '*'],
          scriptSrcElem: ["'unsafe-inline'", "'unsafe-eval'", '*'],
          styleSrc: ["'unsafe-inline'", '*'],
          imgSrc: ['*', 'data:', 'blob:'],
          connectSrc: ['*'],
          fontSrc: ['*', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ['*'],
          frameSrc: ['*'],
          workerSrc: ["'self'", 'blob:', '*'],
        },
      },
    }),
  );
}

// parse json request body
app.use(express.json({ limit: '50mb', strict: false }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 10000 }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    exposedHeaders: ['X-Sync-Warning'],
  }),
);
app.options(
  '*',
  cors({
    origin: config.cors.origins,
    credentials: true,
    exposedHeaders: ['X-Sync-Warning'],
  }),
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Load auth configs into req.authConfig for synchronous access
const loadAuthConfigs = require('./middlewares/authConfig');

app.use(loadAuthConfigs);

const dataSync = require('./sync');
app.use('/v2', dataSync.middleware);

app.use('/v2', routesV2);
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/builtin-widgets', express.static(path.join(__dirname, '../static/builtin-widgets')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use('/static/plugin', express.static(path.join(__dirname, '../static/plugin'), { dotfiles: 'ignore' }));
app.use('/plugin', express.static(path.join(__dirname, '../static/plugin'), { dotfiles: 'ignore' }));
// Serve uploaded files with date-based directory structure
app.use(
  '/d',
  express.static(path.join(__dirname, '../static/uploads'), {
    setHeaders: (res, path) => {
      // Set appropriate headers for file downloads
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    },
  }),
);

// Serve VSS JSON files from /vss/ path
// Handles URLs like /vss/v5.0/vss_rel_5.0.json -> serves backend/data/v5.0.json
// Also handles /vss/v4.1.1/vss_rel_4.1.1.json, /vss/v5.1RC0/vss_rel_5.1RC0.json, etc.
// This route must be defined before the catch-all routes to ensure it's matched first
app.get('/vss/:version/:filename', (req, res, next) => {
  let { version } = req.params; // e.g., "v5.0", "v4.1.1", "v5.1RC0"
  const { filename } = req.params; // e.g., "vss_rel_5.0.json"

  // Accept any version format: vX.Y, vX.Y.Z, vX.YRCZ, etc.
  // Just ensure it starts with 'v' and contains at least one dot
  if (!version.match(/^v\d+\./)) {
    return res.status(400).json({ error: 'Invalid VSS version format' });
  }

  // Normalize version: convert RC to lowercase rc for file lookup
  // Files are stored as v4.1rc0.json but versions might be v4.1RC0
  version = version.replace(/RC/gi, 'rc');

  const filePath = path.join(__dirname, `../data/${version}.json`);

  console.log(
    `[VSS Route] Requested: ${req.path}, Version: ${version}, Filename: ${filename}, File: ${filePath}, Exists: ${fs.existsSync(filePath)}`,
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`[VSS Route] File not found: ${filePath}`);
    return res.status(404).json({ error: `VSS version ${version} not found` });
  }

  // Set JSON content type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache

  console.log(`[VSS Route] Serving file: ${filePath}`);

  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`[VSS Route] Error sending file:`, err);
      next(err);
    }
  });
});

// Setup proxy to other services
setupProxy(app);

// Proxy to internal kit-server (docker-compose service)
if (config.services.kitServer.url) {
  app.use(
    '/kit-server',
    createProxyMiddleware({
      target: config.services.kitServer.url,
      changeOrigin: true,
      ws: true,
      pathFilter: (pathname, req) => {
        const raw = String(req.originalUrl || req.url || pathname || '').split('?')[0];
        return raw === '/kit-server' || raw.startsWith('/kit-server/');
      },
      pathRewrite: { '^/kit-server': '' },
    }),
  );
}

// Runtime proxy — resolve RUNTIME_NAME → docker/K8s service via RUNTIME_SERVICE_MAPPINGS
const { getRuntimeTarget } = require('./config/runtimeConfig');

/**
 * Resolve proxy target for a runtime from RUNTIME_SERVICE_MAPPINGS
 * Strips RUNTIME_PREFIX if present (e.g., "Runtime-PUBLIC-01-..." → "PUBLIC-01-...")
 * @param {string} runtimeName
 * @returns {string|null} target URL
 */
function resolveRuntimeTarget(runtimeName) {
  const prefix = process.env.RUNTIME_PREFIX || '';
  let normalizedName = runtimeName;

  if (prefix && runtimeName.startsWith(prefix)) {
    normalizedName = runtimeName.substring(prefix.length);
    console.log(`[Proxy] Stripped prefix: "${runtimeName}" → "${normalizedName}"`);
  }

  const targetUrl = getRuntimeTarget(normalizedName);

  if (targetUrl) {
    console.log(`[Proxy] Resolved "${normalizedName}" → "${targetUrl}"`);
    return targetUrl;
  }

  console.warn(`[Proxy] No mapping found for "${normalizedName}" (original: "${runtimeName}")`);
  return null;
}

const RUNTIME_NAME_RE = /^[a-zA-Z0-9-]+$/;

/**
 * Resolve runtime name from an HTTP or WebSocket upgrade request.
 * Express sets originalUrl; raw upgrade events do not — fall back to req.url.
 */
function runtimeNameFromReq(req) {
  const original = String(req.originalUrl || '').split('?')[0];
  const fromOriginal = original.match(/^\/runtime-preview\/([^/]+)/);
  if (fromOriginal) return fromOriginal[1];

  const urlPath = String(req.url || '').split('?')[0];

  // Upgrade path: no Express, so originalUrl is empty — match the full prefix on req.url
  if (!original) {
    const fromUrl = urlPath.match(/^\/runtime-preview\/([^/]+)/);
    return fromUrl ? fromUrl[1] : null;
  }

  // After Express strip, url is /:name/...; only trust when originalUrl is under the mount
  if (original === '/runtime-preview' || original.startsWith('/runtime-preview/')) {
    const match = urlPath.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

function resolvePreviewProxyTarget(req) {
  const runtimeName = runtimeNameFromReq(req);
  if (!runtimeName || !RUNTIME_NAME_RE.test(runtimeName)) return null;
  return resolveRuntimeTarget(runtimeName);
}

const sendPreviewUnavailable = (res, status, payload) => {
  console.warn('[Proxy]', payload);
  if (!res || res.headersSent || typeof res.status !== 'function') return;
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<!DOCTYPE html><html><head></head><body></body></html>');
};

/**
 * iframe.src cannot set Authorization. Accept access_token query (same pattern as
 * socket.io) and/or a Path=/runtime-preview cookie set on the first preview load,
 * promote to Bearer for auth(), then strip the query so it is not forwarded to the kit.
 */
function promotePreviewAccessToken(req, res, next) {
  const cookieName = 'runtime_preview_at';
  let token;
  if (req.query && typeof req.query.access_token === 'string' && req.query.access_token) {
    token = req.query.access_token;
  } else if (req.cookies && typeof req.cookies[cookieName] === 'string') {
    token = req.cookies[cookieName];
  }

  if (!req.headers.authorization && token) {
    req.headers.authorization = `Bearer ${token}`;
  }

  // Persist for relative subresource requests under /runtime-preview (iframe cannot set headers)
  if (req.query && typeof req.query.access_token === 'string' && req.query.access_token) {
    res.cookie(cookieName, req.query.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/runtime-preview',
      secure: config.env === 'production',
      maxAge: 60 * 60 * 1000,
    });
  }

  if (req.query && Object.hasOwn(req.query, 'access_token')) {
    delete req.query.access_token;
  }
  if (req.url && req.url.includes('access_token=')) {
    const qIndex = req.url.indexOf('?');
    if (qIndex !== -1) {
      const pathOnly = req.url.slice(0, qIndex);
      const params = new URLSearchParams(req.url.slice(qIndex + 1));
      params.delete('access_token');
      const nextQs = params.toString();
      req.url = nextQs ? `${pathOnly}?${nextQs}` : pathOnly;
    }
  }
  next();
}

// Auth + gate + proxy on one mount so nameless paths cannot skip auth.
// pathFilter confines ws:true upgrades to /runtime-preview/* (Express mount alone does not).
// Upgrade path: resolve name from req.url; fail closed (destroy socket) when unresolvable
// so HPM never falls back to target http://127.0.0.1:80.
// Compose: /runtime-preview/PUBLIC-01-... → http://runtime-09:8080/
// Host-run: /runtime-preview/PUBLIC-01-... → http://127.0.0.1:8889/
app.use(
  '/runtime-preview',
  promotePreviewAccessToken,
  auth(),
  (req, res, next) => {
    const runtimeName = runtimeNameFromReq(req);

    if (!runtimeName || !RUNTIME_NAME_RE.test(runtimeName)) {
      return sendPreviewUnavailable(res, 400, {
        message: 'Invalid runtime name format',
        code: 'INVALID_RUNTIME_NAME',
        runtimeName,
      });
    }

    const targetUrl = resolveRuntimeTarget(runtimeName);
    if (!targetUrl) {
      return sendPreviewUnavailable(res, 502, {
        message: 'Runtime not found in configuration',
        code: 'RUNTIME_NOT_CONFIGURED',
        runtimeName,
      });
    }

    return next();
  },
  createProxyMiddleware({
    // Placeholder only — router must always override; upgrades fail closed in pathFilter.
    target: 'http://127.0.0.1',
    changeOrigin: true,
    ws: true,
    pathFilter: (pathname, req) => {
      const raw = String(req.originalUrl || req.url || pathname || '').split('?')[0];
      if (!(raw === '/runtime-preview' || raw.startsWith('/runtime-preview/'))) {
        return false;
      }

      const isUpgrade = String(req.headers.upgrade || '').toLowerCase() === 'websocket';
      if (!isUpgrade) return true;

      // Fail closed: do not let HPM dial the default loopback target
      if (!resolvePreviewProxyTarget(req)) {
        try {
          req.socket.destroy();
        } catch {
          // ignore
        }
        return false;
      }
      return true;
    },
    timeout: 3000,
    proxyTimeout: 3000,
    router: (req) => resolvePreviewProxyTarget(req) || undefined,
    pathRewrite: (_proxyPath, req) => {
      const runtimeName = runtimeNameFromReq(req);
      if (!runtimeName) return '/';
      const full = (req.originalUrl || req.url || '').split('?')[0];
      if (full.startsWith('/runtime-preview/')) {
        return full.replace(new RegExp(`^/runtime-preview/${runtimeName}`), '') || '/';
      }
      return full.replace(new RegExp(`^/${runtimeName}`), '') || '/';
    },
    on: {
      proxyReqWs: (_proxyReq, req, socket) => {
        // Belt-and-suspenders: never keep an upgrade alive without a resolved kit target
        if (!resolvePreviewProxyTarget(req)) {
          try {
            socket.destroy();
          } catch {
            // ignore
          }
        }
      },
      error: (err, req, proxyRes) => {
        sendPreviewUnavailable(proxyRes, 502, {
          message: `Runtime connection error: ${err.message}`,
          code: err.code,
          runtimeName: runtimeNameFromReq(req),
        });
      },
    },
  }),
);

// Development proxy to frontend
if (config.env === 'development') {
  // Only proxy the root route to frontend, let Vite handle all assets
  app.get(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:3210',
      changeOrigin: true,
      ws: true,
      onError: (err, req, res) => {
        console.log('Frontend proxy error:', err.message);
        res.status(503).send('Frontend service unavailable');
      },
    }),
  );

  // For all other non-API routes, redirect to frontend
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or backend static file
    if (
      req.path.startsWith('/v2') ||
      req.path.startsWith('/static') ||
      req.path.startsWith('/plugin') ||
      req.path.startsWith('/images') ||
      req.path.startsWith('/d') ||
      req.path.startsWith('/builtin-widgets') ||
      req.path.startsWith('/runtime-preview') ||
      req.path.startsWith('/api') ||
      req.path.startsWith('/vss')
    ) {
      return next();
    }

    // Redirect to frontend for all other routes
    res.redirect(`http://localhost:3210${req.path}`);
  });
} else {
  // Serve frontend-dist directory as the root route
  // Explicitly set Content-Type headers to ensure correct MIME types in Docker/production
  const frontendDistPath = path.join(__dirname, '../static/frontend-dist');
  app.use(
    '/',
    express.static(frontendDistPath, {
      setHeaders: (res, filePath) => {
        try {
          // Explicitly set Content-Type to prevent JSON responses for CSS/JS files
          // This is necessary because Express static may not always set correct MIME types
          // in certain Docker/production environments
          if (filePath && typeof filePath === 'string') {
            if (filePath.endsWith('.css')) {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
            } else if (filePath.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            }
          }
        } catch (err) {
          // Silently fail if setting headers fails - Express will use default
          console.error('Error setting headers for static file:', err.message);
        }
      },
    }),
  );

  // For all other non-API routes, serve the frontend's index.html
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or backend static file
    // Also skip /assets/ requests - if static middleware couldn't serve them, return 404
    if (
      req.path.startsWith('/v2') ||
      req.path.startsWith('/static') ||
      req.path.startsWith('/plugin') ||
      req.path.startsWith('/images') ||
      req.path.startsWith('/d') ||
      req.path.startsWith('/builtin-widgets') ||
      req.path.startsWith('/runtime-preview') ||
      req.path.startsWith('/api') ||
      req.path.startsWith('/vss') ||
      req.path.startsWith('/assets/')
    ) {
      // If it's an assets request that reached here, the file doesn't exist
      if (req.path.startsWith('/assets/')) {
        // Return proper content type based on file extension
        if (req.path.endsWith('.css')) {
          return res.status(404).type('text/css').send('/* File not found */');
        }
        if (req.path.endsWith('.js')) {
          return res.status(404).type('application/javascript').send('// File not found');
        }
        return res.status(404).type('text/plain').send('File not found');
      }
      return next();
    }

    // Serve the index.html for all other routes to enable client-side routing
    const indexPath = path.join(__dirname, '../static/frontend-dist/index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

const server = require('http').createServer(app);

initSocketIO(server);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// Test function
// (async () => {
//   try {
//   } catch (error) {
//     console.log(error);
//   }
// })();

module.exports = app;
