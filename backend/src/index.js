// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const initializeRoles = require('./scripts/initializeRoles');
const { init } = require('./config/socket');
const { setupScheduledCheck, assignAdmins, convertLogsCap } = require('./scripts');
const { seedPredefinedSiteConfigs } = require('./services/siteConfig.service');
const PREDEFINED_SITE_CONFIGS = require('./config/predefinedSiteConfigs');
const { seedFromInstanceBundle } = require('./services/instanceSnapshot.service');

// console.log('>>>>>>>>>>>>> mongo_url', config.mongoose.url);
// console.log('>>>>>>>>>>>>> config', config);

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB ');
  logger.info(`🚀 Backend running in ${config.env.toUpperCase()} mode`);
  logger.info(`📊 CORS Origins: ${config.cors.origins ? 'Custom function' : 'Default'}`);
  logger.info(`🍪 Cookie Config: secure=${config.jwt.cookie.options.secure}, sameSite=${config.jwt.cookie.options.sameSite}, httpOnly=${config.jwt.cookie.options.httpOnly}`);

  convertLogsCap();
  initializeRoles().then(async () => {
    const adminUserId = await assignAdmins();
    await seedFromInstanceBundle(adminUserId);
    await seedPredefinedSiteConfigs(PREDEFINED_SITE_CONFIGS, adminUserId)
    // Run after seeding so VSS files from snapshot are in place before the
    // scheduled check can download/overwrite them from GitHub.
    setupScheduledCheck();
  });
  // config.port is loaded from the PORT environment variable, defaulting to 8080 (see backend/src/config/config.js).
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  init(server);
});

// setupScheduledCheck is now called inside the initializeRoles chain (after seedFromInstanceBundle)
// to avoid a race condition where it overwrites VSS files placed by the snapshot seed.

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
