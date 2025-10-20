// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { default: axios } = require('axios');
const config = require('./config');

const logAxios = axios.create({
  baseURL: config.services.log.url,
});

module.exports = { logAxios };
