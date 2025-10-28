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
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

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
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
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

app.use('/v2', routesV2);
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/images', express.static(path.join(__dirname, '../static/images')));
// Serve uploaded files with date-based directory structure
app.use('/d', express.static(path.join(__dirname, '../static/uploads'), {
  setHeaders: (res, path) => {
    // Set appropriate headers for file downloads
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  }
}));

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
        req.path.startsWith('/images') || 
        req.path.startsWith('/d') ||
        req.path.startsWith('/api')) {
      return next();
    }
    
    // Redirect to frontend for all other routes
    res.redirect(`http://localhost:3210${req.path}`);
  });
} else {
  // Serve frontend-dist directory as the root route
  app.use('/', express.static(path.join(__dirname, '../static/frontend-dist')));

  // For all other non-API routes, serve the frontend's index.html
  app.get('*', (req, res, next) => {
    // Skip if it's an API route or backend static file
    if (req.path.startsWith('/v2') ||
        req.path.startsWith('/static') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/d') ||
        req.path.startsWith('/api')) {
      return next();
    }

    // Serve the index.html for all other routes to enable client-side routing
    res.sendFile(path.join(__dirname, '../static/frontend-dist/index.html'));
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
