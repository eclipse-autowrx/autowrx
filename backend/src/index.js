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
  // Some modules initialize Casbin or Mongoose plugins during require().
  const { init: initDataSync } = require('./sync');
  const initializeRoles = require('./scripts/initializeRoles');
  const { setupScheduledCheck, assignAdmins, convertLogsCap } = require('./scripts');
  const { init: initSocket } = require('./config/socket');
  const { seedPredefinedSiteConfigs, syncSiteConfigSnapshotsIfNeeded } = require('./services/siteConfig.service');
  const { seedProjectTemplates } = require('./services/projectTemplate.service');
  const PREDEFINED_SITE_CONFIGS = require('./config/predefinedSiteConfigs');
  const PREDEFINED_PROJECT_TEMPLATES = require('./config/predefinedProjectTemplates');

  // Register sync hooks before loading routes and models through the application.
  initDataSync();
  const app = require('./app');

  logger.info('Connected to MongoDB ');
  logger.info(`🚀 Backend running in ${config.env.toUpperCase()} mode`);
  logger.info(`📊 CORS Origins: ${config.cors.origins ? 'Custom function' : 'Default'}`);
  logger.info(`🍪 Cookie Config: secure=${config.jwt.cookie.options.secure}, sameSite=${config.jwt.cookie.options.sameSite}, httpOnly=${config.jwt.cookie.options.httpOnly}`);

  convertLogsCap();
  await initializeRoles();
  const adminUserId = await assignAdmins();

  if (adminUserId) {
    await seedPredefinedSiteConfigs(PREDEFINED_SITE_CONFIGS, adminUserId);
    await seedProjectTemplates(PREDEFINED_PROJECT_TEMPLATES, adminUserId);
  }

  await syncSiteConfigSnapshotsIfNeeded().catch((error) => {
    logger.warn(`Site config snapshot sync skipped: ${error.message}`);
  });

  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  initSocket(server);
  setupScheduledCheck();
};

start().catch((error) => {
  console.error('Application startup failed:', error.message);
  process.exit(1);
});
