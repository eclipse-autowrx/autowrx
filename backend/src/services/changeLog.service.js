// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const ChangeLog = require('../models/changeLog.model');

/**
 *
 * @param {Object} filter
 * @param {Object} options
 * @param {string} options.sortBy - Sort option in the format: sortField:(desc|asc)
 * @param {number} options.limit - Maximum number of results per page (default = 10)
 * @param {number} options.page - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const listChangeLogs = async (filter, options) => {
  return ChangeLog.paginate(filter, options);
};

module.exports.listChangeLogs = listChangeLogs;
