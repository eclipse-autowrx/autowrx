// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const logger = require('../config/logger');
const config = require('../config/config');
const ChangeLog = require('../models/changeLog.model');

async function setLogsCap() {
  const db = mongoose.connection.db;
  const name = 'changelogs';
  const max = config.logsMaxSize * 1024 * 1024; // 100MB capped

  try {
    const collInfo = await db.listCollections({ name }).next();

    if (!collInfo) {
      await db.createCollection(name, { capped: true, size: max });
      return logger.info(`Created capped collection ${name} with ${max} bytes`);
    }

    const stats = await db.command({ collStats: name });
    if (stats.capped && stats.maxSize === max) {
      return logger.info(`Collection ${name} is already capped to ${max} bytes. Skipping...`);
    }

    await db.command({
      convertToCapped: name,
      size: max,
    });
    logger.info(`Capped collection ${name} to ${max} bytes`);
  } catch (error) {
    logger.error(`Error capping collection ${name}: %o`, error?.message || error);
  }
}

async function convertLogsCap() {
  try {
    await setLogsCap();
    await ChangeLog.createIndexes();
  } catch (error) {
    logger.error('Error converting logs cap: %o', error.message || error);
  }
}

module.exports = convertLogsCap;
