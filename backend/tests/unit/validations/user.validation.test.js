// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const userValidation = require('../../../src/validations/user.validation');

describe('user.validation getUsers', () => {
  const validate = (query) => userValidation.getUsers.query.validate(query);

  test('accepts an empty search, which means no filter', () => {
    const { error, value } = validate({ includeFullDetails: 'true', search: '', limit: '100', page: '1' });
    expect(error).toBeUndefined();
    expect(value.search).toBe('');
  });

  test('accepts a non-empty search', () => {
    const { error } = validate({ search: 'alice' });
    expect(error).toBeUndefined();
  });

  test('still rejects a non-string search', () => {
    const { error } = validate({ search: { $ne: '' } });
    expect(error).toBeDefined();
  });
});
