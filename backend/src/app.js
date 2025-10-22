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
app.use(helmet());

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
app.use('/imgs', express.static(path.join(__dirname, '../static/imgs')));
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
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:3210',
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    onError: (err, req, res) => {
      console.log('Frontend proxy error:', err.message);
      res.status(503).send('Frontend service unavailable');
    },
    // Only proxy non-API routes
    filter: (pathname, req) => {
      // Don't proxy API routes, static files, or uploads
      return !pathname.startsWith('/v2') && 
             !pathname.startsWith('/static') && 
             !pathname.startsWith('/imgs') && 
             !pathname.startsWith('/d') &&
             !pathname.startsWith('/api');
    }
  }));
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
