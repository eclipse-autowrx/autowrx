// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

class PrototypeListDecorator {
  constructor(prototypeList) {
    this.prototypeList = prototypeList;
  }

  async getPrototypeList() {
    let _prototypeList = this.prototypeList;
    try {
      _prototypeList = _prototypeList.map((prototype) => prototype.toJSON());
    } catch {
      // Do nothing
    }
    return _prototypeList;
  }
}

module.exports = PrototypeListDecorator;
