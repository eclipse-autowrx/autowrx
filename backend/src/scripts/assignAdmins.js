// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const config = require('../config/config');
const logger = require('../config/logger');
const { Role } = require('../models');
const { userService, permissionService } = require('../services');

const assignAdmins = async () => {
  const adminEmails = config.adminEmails;
  if (!adminEmails || !adminEmails.length) {
    logger.info('No admin emails found to assign. Skipping...');
    return;
  }

  let users = [];
  try {
    const promises = adminEmails.map((email) => userService.getUserByEmail(email));
    users = (await Promise.all(promises)).filter((user) => user);
  } catch (error) {
    logger.error('Error assigning admins');
    logger.error(error);
  }

  let newUsers = [];
  if (users.length !== adminEmails.length) {
    const missingEmails = adminEmails.filter((email) => !users.some((user) => user.email === email));
    try {
      newUsers = await Promise.all(
        missingEmails.map((email) =>
          userService.createUser({
            email,
            name: email.split('@')[0],
            ...(config.adminPassword ? { password: config.adminPassword } : {}),
          })
        )
      );
    } catch (error) {
      logger.error('Error creating rest users');
      logger.error(error?.message || error);
    }
  }

  let adminRole;
  try {
    adminRole = await Role.findOne({ ref: 'admin' });
  } catch (error) {
    logger.error('Error getting admin role id');
    logger.error(error);
  }

  if (!adminRole) {
    logger.info('No admin role found to assign');
    return;
  }

  const allAdmins = [...users, ...newUsers];
  try {
    await Promise.all(allAdmins.map((user) => permissionService.assignRoleToUser(user.id || user._id, adminRole._id)));
  } catch (error) {
    logger.error('Error assigning admin role to users');
    logger.error(error);
  }

  logger.info('Admins assigned successfully');
};

module.exports = assignAdmins;
