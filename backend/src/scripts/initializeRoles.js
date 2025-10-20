// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-await-in-loop */
const { ROLES } = require('../config/roles');
const Role = require('../models/role.model');
const logger = require('../config/logger');

const initializeRoles = async () => {
  try {
    // eslint-disable-next-line no-restricted-syntax

    for (let i = 0; i < Object.keys(ROLES).length; i += 1) {
      const role = Object.keys(ROLES)[i];
      const roleData = ROLES[role];
      const roleExist = await Role.findOne({
        ref: roleData.ref,
      });
      if (!roleExist) {
        await Role.create({
          name: roleData.name,
          permissions: roleData.permissions,
          ref: roleData.ref,
          not_feature: roleData.not_feature,
        });
      } else {
        await roleExist.updateOne({
          name: roleData.name,
          permissions: roleData.permissions,
          not_feature: roleData.not_feature,
          ref: roleData.ref,
        });
      }
    }
    logger.info('Role initialization completed.');
  } catch (error) {
    logger.error(`Error initializing roles: ${error}`);
  }
};

module.exports = initializeRoles;
