// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { slugify } = require('../utils/textProcessing');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const objectIdList = (value, helpers) => {
  const origin = value;
  value = value.split(',');
  for (const id of value) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return helpers.message('"{{#label}}" must be a list of valid mongo ids');
    }
  }
  return origin;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }

  return value;
};

const jsonString = (value, helpers) => {
  try {
    JSON.parse(value);
    return value;
  } catch (error) {
    return helpers.message('{{#label}} is invalid JSON string');
  }
};

const slug = (value, helpers) => {
  if (slugify(value) !== value) {
    return helpers.message('{{#label}} must be a slug-like string');
  }
  return value;
};

module.exports = {
  objectId,
  objectIdList,
  password,
  jsonString,
  slug,
};
