// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const PrototypeDecorator = require('./PrototypeDecorator');
const feedbackService = require('../services/feedback.service');

class FeedbackPrototypeDecorator extends PrototypeDecorator {
  async getPrototype() {
    const _prototype = await super.getPrototype();

    const avg_score = await feedbackService.calcAvgScoreOfPrototype(_prototype);
    _prototype.avg_score = avg_score;

    return _prototype;
  }
}

module.exports = FeedbackPrototypeDecorator;
