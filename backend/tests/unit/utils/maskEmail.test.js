// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { maskEmail, maskUserEmail } = require('../../../src/utils/maskEmail');

describe('maskEmail', () => {
  test('should mask a normal email address', () => {
    expect(maskEmail('alice.smith@example.com')).toBe('ali***@example.com');
  });

  test('should mask short local-part emails', () => {
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  test('should return empty or invalid input unchanged', () => {
    expect(maskEmail('')).toBe('');
    expect(maskEmail('not-an-email')).toBe('not-an-email');
    expect(maskEmail(null)).toBe(null);
    expect(maskEmail(undefined)).toBe(undefined);
  });
});

describe('maskUserEmail', () => {
  test('should mask email on a plain user object', () => {
    const user = {
      id: 'user-1',
      name: 'Alice',
      email: 'alice.smith@example.com',
    };

    expect(maskUserEmail(user)).toEqual({
      id: 'user-1',
      name: 'Alice',
      email: 'ali***@example.com',
    });
  });

  test('should mask email on a mongoose-like user object', () => {
    const user = {
      id: 'user-2',
      name: 'Bob',
      email: 'bob@example.com',
      toJSON() {
        return {
          id: this.id,
          name: this.name,
          email: this.email,
        };
      },
    };

    expect(maskUserEmail(user)).toEqual({
      id: 'user-2',
      name: 'Bob',
      email: 'b***@example.com',
    });
  });

  test('should leave user without email unchanged', () => {
    const user = { id: 'user-3', name: 'No Email' };

    expect(maskUserEmail(user)).toEqual({ id: 'user-3', name: 'No Email' });
  });
});
