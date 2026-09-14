// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * @param {string} email
 * @returns {string}
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [username, domain] = email.split('@');

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }

  const visibleChars = Math.min(3, Math.floor(username.length / 3));
  const maskedUsername = username.substring(0, visibleChars) + '***';

  return `${maskedUsername}@${domain}`;
};

/**
 * @param {import('../models/user.model').User | Record<string, unknown>} user
 * @returns {Record<string, unknown>}
 */
const maskUserEmail = (user) => {
  const plain = user?.toJSON ? user.toJSON() : { ...user };

  if (plain.email) {
    plain.email = maskEmail(plain.email);
  }

  return plain;
};

module.exports = {
  maskEmail,
  maskUserEmail,
};
