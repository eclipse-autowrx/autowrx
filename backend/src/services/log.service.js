// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { logAxios } = require('../config/axios');

/**
 *
 * @param {{
 * name: string;
 * type: string;
 * created_by: string;
 * ref_type?: string;
 * ref_id?: string;
 * parent_id?: string
 * project_id?: string
 * image?: string
 * description?: string
 * }} message
 * @returns
 */
const createLog = async (message, options) => {
  return (await logAxios.post('/', message, options)).data;
};

module.exports = {
  createLog,
};
