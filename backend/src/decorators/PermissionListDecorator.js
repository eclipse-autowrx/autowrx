// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const PermissionDecorator = require('./PermissionDecorator');

class PermissionListDecorator {
  constructor(permissions) {
    this.permissions = permissions;
  }

  getPermissionList() {
    return this.permissions.map((permission) => new PermissionDecorator(permission).getPermission());
  }
}

module.exports = PermissionListDecorator;
