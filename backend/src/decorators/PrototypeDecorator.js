// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

class PrototypeDecorator {
  constructor(prototype) {
    this.prototype = prototype;
  }

  async getPrototype() {
    let _prototype = this.prototype;
    try {
      _prototype = this.prototype.toJSON();
    } catch (error) {
      // Do nothing
    }

    return _prototype;
  }
}

module.exports = PrototypeDecorator;
