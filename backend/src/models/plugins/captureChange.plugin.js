// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const _ = require('lodash');
const ChangeLog = require('../changeLog.model');
const logger = require('../../config/logger');

/**
 * Throttle logger class to enable logging changes in batches (eg. in case of bulk updates on frequently updated field like "code")
 */
class ThrottleLogger {
  constructor(throttleInterval = 60000) {
    this.throttleInterval = throttleInterval;
    /** @type {import('../changeLog.model').CodeChangeDocument} */
    this.data = null;
    this.timer = null;
    this.lastLoggedTime = 0;
    this.lastTouched = Date.now();
  }

  async updateData(incoming) {
    if (!this.data) {
      this.data = _.cloneDeep(incoming);
    } else {
      this.created_by = incoming.created_by;
      Object.entries(incoming.changes).forEach(([key, value]) => {
        if (this.data.changes[key]) {
          if (_.isEqual(this.data.changes[key].old, value.new)) {
            delete this.data.changes[key];
          } else {
            this.data.changes[key].new = value.new;
          }
        } else {
          this.data.changes[key] = value;
        }
      });
    }

    const now = Date.now();
    this.lastTouched = now;
    if (!this.lastLoggedTime) {
      this.lastLoggedTime = now;
    }
    const timeSyncLastLog = now - this.lastLoggedTime;

    if (timeSyncLastLog >= this.throttleInterval) {
      await this._logDataUpdate();
    } else {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      const timeRemaining = this.throttleInterval - timeSyncLastLog;

      this.timer = setTimeout(async () => {
        await this._logDataUpdate();
      }, timeRemaining);
    }
  }

  async _logDataUpdate() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      await ChangeLog.create(this.data);
    } catch (error) {
      logger.error(`Error saving change log to database for ${this.data.ref_type} with id ${this.data.ref}`);
      logger.error(error);
    } finally {
      this.lastLoggedTime = Date.now();
    }

    this.data = null;
  }
}

/**
 * @type {Map<string, ThrottleLogger>}
 */
const throttleLoggers = new Map();
const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 *
 * @param {string} ref_type
 * @param {string} ref
 */
function getThrottleLogger(ref_type, ref) {
  const key = `${ref_type}-${ref}`;
  if (!throttleLoggers.has(key)) {
    const instance = new ThrottleLogger();

    const originalLog = instance._logDataUpdate.bind(instance);
    instance._logDataUpdate = async function () {
      await originalLog();
      throttleLoggers.delete(key);
    };

    throttleLoggers.set(key, instance);
  }

  return throttleLoggers.get(key);
}

/**
 * @typedef {import('mongoose').Model} MongooseModel
 */

/**
 * Pre-save middleware to capture updates
 * @this {import('mongoose').Document}
 * @param {Function} next
 * @returns {Promise<void>}
 */
async function captureUpdates(next) {
  this.wasNew = this.isNew;
  /** @type {MongooseModel} */
  const thisConstructor = this.constructor;

  if (!this.isNew) {
    try {
      const original = await thisConstructor.findById(this._id).lean();
      if (original) {
        const changes = {};
        Object.keys(this._doc).forEach((field) => {
          if (
            field != '_id' &&
            field != '__v' &&
            field != 'updatedAt' &&
            field != 'createdAt' &&
            field != 'created_by' &&
            !_.isEqual(JSON.stringify(original[field]), JSON.stringify(this[field]))
          ) {
            changes[field] = {
              old: original[field],
              new: this[field],
            };
          }
        });
        if (!_.isEmpty(changes)) {
          const data = {
            created_by: this.action_owner,
            ref_type: thisConstructor.modelName,
            ref: this._id,
            action: 'UPDATE',
            changes,
          };
          await getThrottleLogger(data.ref_type, data.ref).updateData(data);
        }
      }
    } catch (error) {
      logger.error(`Error capturing updates for ${thisConstructor.modelName} with id ${this._id}`);
      logger.error(error);
    }
  }
  next();
}

/**
 * Post-save middleware to capture creation
 * @this {import('mongoose').Document}
 * @param {import('mongoose').Document} doc
 * @returns {Promise<void>}
 */
async function captureCreate(doc) {
  /** @type {MongooseModel} */
  const docConstructor = doc.constructor;
  try {
    if (this.wasNew) {
      await ChangeLog.create({
        created_by: doc.created_by,
        ref_type: docConstructor.modelName,
        ref: doc._id,
        action: 'CREATE',
        changes: doc.toObject(),
      });
    }
  } catch (error) {
    logger.error(`Error capturing create for ${doc.constructor.modelName} with id ${doc._id}`);
  }
}

/**
 * Post-remove middleware to capture creation
 * @this {import('mongoose').Document}
 * @param {import('mongoose').Document} doc
 * @returns {Promise<void>}
 */
async function captureRemove(doc) {
  try {
    await ChangeLog.create({
      created_by: doc.action_owner,
      ref_type: doc.constructor.modelName,
      ref: doc._id,
      action: 'DELETE',
      changes: doc.toObject(),
    });
  } catch (error) {
    logger.error(`Error capturing remove for ${doc.constructor.modelName} with id ${doc._id}`);
    logger.error(error);
  }
}

// Clean up stale throttle loggers
setInterval(() => {
  const now = Date.now();
  for (const [key, logger] of throttleLoggers.entries()) {
    const timeSyncLastTouched = now - logger.lastTouched;
    if (!logger.timer && timeSyncLastTouched >= STALE_THRESHOLD) {
      logger
        ._logDataUpdate()
        .catch((error) => {
          logger.error(`Error logging stale data for ${key}: %o`, error?.message || error);
        })
        .finally(() => {
          throttleLoggers.delete(key);
        });
    }
  }
}, STALE_THRESHOLD);

module.exports.captureUpdates = captureUpdates;
module.exports.captureCreate = captureCreate;
module.exports.captureRemove = captureRemove;
