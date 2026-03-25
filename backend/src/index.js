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
    await assignAdmins();
    // Seed predefined configs first (code defaults), then instance bundle (overrides defaults)
    await seedPredefinedSiteConfigs(PREDEFINED_SITE_CONFIGS);
    const systemUser = await require('./services/user.service').getUserByEmail(process.env.ADMIN_EMAILS?.split(',')[0]?.trim());
    await seedFromInstanceBundle(systemUser?._id);
  });
  // config.port is loaded from the PORT environment variable, defaulting to 8080 (see backend/src/config/config.js).
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  init(server);
});

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

setupScheduledCheck();
