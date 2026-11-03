// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const catchAsync = require('../utils/catchAsync');
const genaiService = require('../services/genai.service');

const generate = catchAsync(async (req, res) => {
  const content = await genaiService.generate({ user: req.user, ...req.body });
  res.send({ content });
});

module.exports = {
  generate,
};
