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

app.use(cors());
/*
app.use(
  cors({
    origin: config.cors.regex,
    credentials: true,
  })
);
*/
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use('/v2', routesV2);
app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/imgs', express.static(path.join(__dirname, '../static/imgs')));

// Setup proxy to other services
setupProxy(app);
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
