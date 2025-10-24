// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const { fileValidation } = require('../../../validations');
const fileController = require('../../../controllers').fileController;
const upload = require('../../../middlewares/upload');

const router = express.Router();

router
  .route('/upload/store-be')
  .post(
    auth(),
    upload.single('file'),
    fileController.uploadFile
  );

module.exports = router;
