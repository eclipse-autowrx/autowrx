// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { feedbackService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createFeedback = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const feedback = await feedbackService.createFeedback({
    ...req.body,
    created_by: userId,
  });
  res.status(httpStatus.CREATED).send(feedback);
});

const listFeedbacks = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ref', 'ref_type', 'id', 'avg_score', 'model_id', 'created_by']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const feedbacks = await feedbackService.queryFeedbacks(filter, {
    ...options,
    populate: ['created_by', 'name image_file'],
  });
  res.send(feedbacks);
});

const updateFeedback = catchAsync(async (req, res) => {
  const feedback = await feedbackService.updateFeedbackById(req.params.id, req.body, req.user.id);
  res.send(feedback);
});

const deleteFeedback = catchAsync(async (req, res) => {
  await feedbackService.deleteFeedbackById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createFeedback,
  listFeedbacks,
  updateFeedback,
  deleteFeedback,
};
