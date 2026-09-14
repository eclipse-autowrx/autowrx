// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const path = require('path');
const dotenv = require('dotenv');
const { loadKeyVaultSecrets } = require('./config/keyVault');

dotenv.config({ path: path.join(__dirname, '../.env') });

const start = async () => {
  await loadKeyVaultSecrets();

  // Load configuration only after Key Vault values have been placed in process.env.
  const mongoose = require('mongoose');
  const config = require('./config/config');
  const logger = require('./config/logger');

  let server;

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
  });

  await mongoose.connect(config.mongoose.url, {
    ...config.mongoose.options,
    serverSelectionTimeoutMS: 10000,
  });

  // Load database-dependent modules only after MongoDB is connected.
  const initializeRoles = require('./scripts/initializeRoles');
  const { setupScheduledCheck, assignAdmins, convertLogsCap } = require('./scripts');

  // Load routes and socket configuration only after MongoDB is connected.
  // Some Casbin initialization runs during route loading and accesses MongoDB.
  const app = require('./app');
  const { init } = require('./config/socket');

  logger.info('Connected to MongoDB ');
  logger.info(`🚀 Backend running in ${config.env.toUpperCase()} mode`);
  logger.info(`📊 CORS Origins: ${config.cors.origins ? 'Custom function' : 'Default'}`);
  logger.info(`🍪 Cookie Config: secure=${config.jwt.cookie.options.secure}, sameSite=${config.jwt.cookie.options.sameSite}, httpOnly=${config.jwt.cookie.options.httpOnly}`);

  convertLogsCap();
  initializeRoles().then(() => assignAdmins());
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  init(server);
  setupScheduledCheck();
};

start().catch((error) => {
  console.error('Application startup failed:', error.message);
  process.exit(1);
});
