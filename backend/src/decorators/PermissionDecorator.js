// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { PERMISSIONS_DESCRIPTION } = require('../config/roles');

class PermissionDecorator {
  constructor(permission) {
    this.permission = permission;
  }

  getPermission() {
    return {
      name: this.permission,
      description: PERMISSIONS_DESCRIPTION[this.permission],
    };
  }
}

module.exports = PermissionDecorator;
