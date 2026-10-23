// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { faker } = require('@faker-js/faker');
const { User } = require('../../../src/models');

describe('User model', () => {
  describe('User validation', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };
    });

    test('should correctly validate a valid user', async () => {
      await expect(new User(newUser).validate()).resolves.toBeUndefined();
    });

    test('should throw a validation error if email is invalid', async () => {
      newUser.email = 'invalidEmail';
      await expect(new User(newUser).validate()).rejects.toThrow();
    });

    test('should throw a validation error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';
      await expect(new User(newUser).validate()).rejects.toThrow();
    });

    // The model only enforces a minimum password length (8); letter/number complexity is not a rule any more.
    test('should accept a password without numbers (only the minimum length is enforced)', async () => {
      newUser.password = 'password';
      await expect(new User(newUser).validate()).resolves.toBeUndefined();
    });

    test('should accept a password without letters (only the minimum length is enforced)', async () => {
      newUser.password = '11111111';
      await expect(new User(newUser).validate()).resolves.toBeUndefined();
    });

    // Roles are managed by RBAC (UserRole), not stored on the user document, so `role` is not part of the schema.
    test('should not keep a role field on the user document', async () => {
      newUser.role = 'invalid';
      const user = new User(newUser);
      await expect(user.validate()).resolves.toBeUndefined();
      expect(user.role).toBeUndefined();
    });
  });

  describe('User toJSON()', () => {
    test('should not return user password when toJSON is called', () => {
      const newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };
      expect(new User(newUser).toJSON()).not.toHaveProperty('password');
    });
  });
});
