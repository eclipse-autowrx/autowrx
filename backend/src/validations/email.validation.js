// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');

const sendEmail = {
  body: Joi.object().keys({
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    content: Joi.string().required(),
  }),
};

module.exports = { sendEmail };
