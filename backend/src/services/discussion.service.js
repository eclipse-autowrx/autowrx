// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const Discussion = require('../models/discussion.model');
const ApiError = require('../utils/ApiError');

/**
 *
 * @param {Object} discussionBody
 * @returns {Promise<Discussion.Discussion>}
 */
const createDiscussion = async (discussionBody) => {
  const discussion = await Discussion.create(discussionBody);
  return discussion;
};

/**
 *
 * @param {Object} filter
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {fields} [options.fields] - Fields to select
 * @returns {Promise<QueryResult>}
 */
const queryDiscussions = async (filter, options) => {
  const discussions = await Discussion.paginate(filter, options);
  return discussions;
};

/**
 *
 * @param {Object} filter
 * @returns {Promise<Discussion.Discussion[]>}
 */
const listDiscussions = async (filter) => {
  const discussions = await Discussion.find(filter).populate('created_by');
  return discussions;
};

/**
 *
 * @param {Object} discussionId
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<Discussion.Discussion>}
 */
const updateDiscussionById = async (discussionId, updateBody, userId) => {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Discussion not found');
  }

  if (String(discussion.created_by) !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  Object.assign(discussion, updateBody);
  await discussion.save();
  return discussion;
};

/**
 *
 * @param {*} discussionId
 * @param {*} userId
 * @returns {Promise<void>}
 */
const deleteDiscussionById = async (discussionId, userId) => {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Discussion not found');
  }
  if (String(discussion.created_by) !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  return Promise.all([discussion.deleteOne(), Discussion.deleteMany({ parent: discussionId })]);
};

module.exports = {
  createDiscussion,
  queryDiscussions,
  listDiscussions,
  updateDiscussionById,
  deleteDiscussionById,
};
