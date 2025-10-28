// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const discussionRoute = require('./discussion.route');
const feedbackRoute = require('./feedback.route');

const router = express.Router();

// Content Routes
router.use('/discussions', discussionRoute);
router.use('/feedbacks', feedbackRoute);

module.exports = router;
