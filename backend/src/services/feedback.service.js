// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const Feedback = require('../models/feedback.model');
const ApiError = require('../utils/ApiError');

const scoreAverage = (score) => {
  if (!score) {
    return 0;
  }
  const values = [score.easy_to_use, score.need_address, score.relevance].filter(
    (value) => typeof value === 'number' && value > 0,
  );
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((acc, cur) => acc + cur, 0);
  return total / values.length;
};

const resolveFeedbackAvgScore = (feedback) => {
  if (typeof feedback?.avg_score === 'number' && !Number.isNaN(feedback.avg_score)) {
    return feedback.avg_score;
  }
  return scoreAverage(feedback?.score);
};

const calcAvgScoreOfPrototype = async (prototype) => {
  const prototypeId = prototype?.id || prototype?._id;
  if (!prototypeId) {
    return null;
  }
  const feedbacks = await Feedback.find({ ref: prototypeId });
  if (!feedbacks.length) {
    return null;
  }
  const total = feedbacks.reduce((acc, cur) => acc + resolveFeedbackAvgScore(cur), 0);
  return total / feedbacks.length;
};

/**
 *
 * @param {string[]} prototypeIds
 * @returns {Promise<{[key: string]: number}>}
 */
const calcAvgScoreOfPrototypes = async (prototypeIds) => {
  const feedbacks = await Feedback.find({
    ref: {
      $in: prototypeIds,
    },
  });
  const result = feedbacks.reduce((acc, cur) => {
    const avgScore = resolveFeedbackAvgScore(cur);
    if (acc[cur.ref]) {
      acc[cur.ref].total += avgScore;
      acc[cur.ref].count += 1;
    } else {
      acc[cur.ref] = {
        total: avgScore,
        count: 1,
      };
    }
    return acc;
  }, {});

  Object.keys(result).forEach((key) => {
    result[key] = result[key].total / result[key].count;
  });

  return result;
};

/**
 * @param {Feedback.Score} score
 */
const calcAvgScore = async (score) => {
  return scoreAverage(score);
};

/**
 *
 * @param {Object} feedbackBody
 * @returns {Promise<Feedback.Feedback>}
 */
const createFeedback = async (feedbackBody) => {
  const { score } = feedbackBody;
  const feedback = await Feedback.create({
    ...feedbackBody,
    ...(score && {
      avg_score: await calcAvgScore(score),
    }),
  });
  return feedback;
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
const queryFeedbacks = async (filter, options) => {
  const feedbacks = await Feedback.paginate(filter, options);
  return feedbacks;
};

/**
 *
 * @param {Object} feedbackId
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<Feedback.Feedback>}
 */
const updateFeedbackById = async (feedbackId, updateBody, userId) => {
  const { score } = updateBody;

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }

  if (String(feedback.created_by) !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  Object.assign(feedback, {
    ...updateBody,
    ...(score && {
      avg_score: await calcAvgScore(score),
    }),
  });
  await feedback.save();
  return feedback;
};

/**
 *
 * @param {*} feedbackId
 * @param {*} userId
 * @returns {Promise<void>}
 */
const deleteFeedbackById = async (feedbackId, userId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }
  if (String(feedback.created_by) !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  await feedback.deleteOne();
};

module.exports = {
  createFeedback,
  queryFeedbacks,
  updateFeedbackById,
  deleteFeedbackById,
  calcAvgScore,
  calcAvgScoreOfPrototype,
  calcAvgScoreOfPrototypes,
};
