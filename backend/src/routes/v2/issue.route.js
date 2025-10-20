// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../middlewares/validate');
const issueValidation = require('../../validations/issue.validation');
const issueController = require('../../controllers/issue.controller');
const config = require('../../config/config');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(
    auth({
      optional: !config.strictAuth,
    }),
    validate(issueValidation.createIssue),
    issueController.createIssue
  )
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(issueValidation.getIssues),
    issueController.getIssues
  );

router.route('/by-api').get(
  auth({
    optional: !config.strictAuth,
  }),
  validate(issueValidation.getIssueByApi),
  issueController.getIssueByApi
);

router
  .route('/:issueId')
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(issueValidation.getIssue),
    issueController.getIssue
  )
  .patch(
    auth({
      optional: !config.strictAuth,
    }),
    validate(issueValidation.updateIssue),
    issueController.updateIssue
  )
  .delete(
    auth({
      optional: !config.strictAuth,
    }),
    validate(issueValidation.deleteIssue),
    issueController.deleteIssue
  );

module.exports = router;
