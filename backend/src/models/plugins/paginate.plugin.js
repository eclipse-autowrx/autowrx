// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-param-reassign */

const config = require('../../config/config');

const paginate = (schema) => {
  /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
   * @param {string} [options.populate] - Populate data fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * @param {number} [options.limit] - Maximum number of results per page (default = config.constraints.defaultPageSize)
   * @param {number} [options.page] - Current page (default = 1)
   * @param {number} [options.fields] - Fields to select
   * @returns {Promise<QueryResult>}
   */
  schema.statics.paginate = async function (filter, options) {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit =
      options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : config.constraints.defaultPageSize;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const skip = (page - 1) * limit;

    let match = {};

    if ('id' in filter) {
      filter._id = filter.id;
      delete filter.id;
    }

    if (Object.keys(filter).length > 0) {
      match = Object.keys(filter).reduce((acc, key) => {
        acc[key] = typeof filter[key] === 'string' ? filter[key].split(',') : filter[key];
        return acc;
      }, {});
    }

    const countPromise = this.countDocuments(match).exec();
    let docsPromise = this.find(match).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      docsPromise = docsPromise.populate(...options.populate);
    }

    if (options.fields) {
      docsPromise = docsPromise.select(options.fields.split(',').join(' '));
    }

    docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      return Promise.resolve(result);
    });
  };
};

module.exports = paginate;
