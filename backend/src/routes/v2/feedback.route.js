// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { feedbackValidation } = require('../../validations');
const { feedbackController } = require('../../controllers');
const config = require('../../config/config');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(feedbackValidation.createFeedback), feedbackController.createFeedback)
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(feedbackValidation.listFeedbacks),
    feedbackController.listFeedbacks
  );

router
  .route('/:id')
  .patch(auth(), validate(feedbackValidation.updateFeedback), feedbackController.updateFeedback)
  .delete(auth(), validate(feedbackValidation.deleteFeedback), feedbackController.deleteFeedback);

module.exports = router;
