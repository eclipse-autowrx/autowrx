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
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const routesV2 = require('./routes/v2');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { setupProxy } = require('./config/proxyHandler');
const { init: initSocketIO } = require('./config/socket');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

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
  // More permissive CSP for development
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "http://localhost:3210", "https://localhost:3210"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:3210", "https://localhost:3210"],
        scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:3210", "https://localhost:3210"],
        styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:3210", "https://localhost:3210", "https:"],
        imgSrc: ["'self'", "data:", "http://localhost:3210", "https://localhost:3210", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3210", "https://localhost:3210"],
        fontSrc: ["'self'", "https:", "data:", "http://localhost:3210", "https://localhost:3210"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "http://localhost:3210", "https://localhost:3210"],
        frameSrc: ["'self'"],
        upgradeInsecureRequests: null, // Disable upgrade to HTTPS in development
      },
    },
  }));
} else {
  // Production CSP - more restrictive but allows the frontend assets
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
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
      },
    },
  }));
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
  })
);
app.options('*', cors({
  origin: config.cors.origins,
  credentials: true,
}));

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Load auth configs into req.authConfig for synchronous access
const loadAuthConfigs = require('./middlewares/authConfig');
app.use(loadAuthConfigs);

app.use('/v2', routesV2);
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/builtin-widgets', express.static(path.join(__dirname, '../static/builtin-widgets')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
app.use('/static/plugin', express.static(path.join(__dirname, '../static/plugin')));
app.use('/plugin', express.static(path.join(__dirname, '../static/plugin')));
// Serve uploaded files with date-based directory structure
app.use('/d', express.static(path.join(__dirname, '../static/uploads'), {
  setHeaders: (res, path) => {
    // Set appropriate headers for file downloads
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  }
}));

// Serve VSS JSON files from /vss/ path
// Handles URLs like /vss/v5.0/vss_rel_5.0.json -> serves backend/data/v5.0.json
// This route must be defined before the catch-all routes to ensure it's matched first
app.get('/vss/:version/:filename', (req, res, next) => {
  const version = req.params.version; // e.g., "v5.0"
  const filename = req.params.filename; // e.g., "vss_rel_5.0.json"
  
  // Validate version format (should be vX.Y)
  if (!version.match(/^v\d+\.\d+$/)) {
    return res.status(400).json({ error: 'Invalid VSS version format' });
  }
  
  const filePath = path.join(__dirname, `../data/${version}.json`);
  
  console.log(`[VSS Route] Requested: ${req.path}, Version: ${version}, Filename: ${filename}, File: ${filePath}, Exists: ${fs.existsSync(filePath)}`);
  
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

// Development proxy to frontend
if (config.env === 'development') {
  // Only proxy the root route to frontend, let Vite handle all assets
  app.get('/', createProxyMiddleware({
    target: 'http://localhost:3210',
    changeOrigin: true,
    ws: true,
    onError: (err, req, res) => {
      console.log('Frontend proxy error:', err.message);
      res.status(503).send('Frontend service unavailable');
    }
  }));
  
  // For all other non-API routes, redirect to frontend
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or backend static file
    if (req.path.startsWith('/v2') || 
        req.path.startsWith('/static') || 
        req.path.startsWith('/plugin') ||
        req.path.startsWith('/images') || 
        req.path.startsWith('/d') ||
        req.path.startsWith('/builtin-widgets') ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/vss')) {
      return next();
    }
    
    // Redirect to frontend for all other routes
    res.redirect(`http://localhost:3210${req.path}`);
  });
} else {
  // Serve frontend-dist directory as the root route
  // Explicitly set Content-Type headers to ensure correct MIME types in Docker/production
  const frontendDistPath = path.join(__dirname, '../static/frontend-dist');
  app.use('/', express.static(frontendDistPath, {
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
    }
  }));

  // For all other non-API routes, serve the frontend's index.html
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or backend static file
    // Also skip /assets/ requests - if static middleware couldn't serve them, return 404
    if (req.path.startsWith('/v2') ||
        req.path.startsWith('/static') ||
        req.path.startsWith('/plugin') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/d') ||
        req.path.startsWith('/builtin-widgets') ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/vss') ||
        req.path.startsWith('/assets/')) {
      // If it's an assets request that reached here, the file doesn't exist
      if (req.path.startsWith('/assets/')) {
        // Return proper content type based on file extension
        if (req.path.endsWith('.css')) {
          return res.status(404).type('text/css').send('/* File not found */');
        } else if (req.path.endsWith('.js')) {
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
