// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { SUPPORTED_SERVICES } = require('../services/serviceToken.service');

const getServiceToken = {
  query: Joi.object().keys({
    service: Joi.string()
      .required()
      .valid(...SUPPORTED_SERVICES),
  }),
};

module.exports = {
  getServiceToken,
};
