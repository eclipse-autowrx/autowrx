// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { default: axios } = require('axios');
const config = require('../config/config');
const { resetPasswordTemplate } = require('../utils/emailTemplates');

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  if (!config.services.email.url)
    return axios.post(
      `${config.services.email.endpointUrl}`,
      {
        sender: {
          name: 'digital.auto',
          email: 'playground@digital.auto',
        },
        to: [
          {
            name: 'user',
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': config.services.email.apiKey,
        },
      }
    );
  else
    return axios.post(
      `${config.services.email.url}`,
      {
        to,
        subject,
        html,
      },
      {
        headers: {
          'api-key': config.services.email.apiKey,
        },
      }
    );
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token, domain) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${domain || config.client.baseUrl}/reset-password?token=${token}`;
  const html = resetPasswordTemplate(to, resetPasswordUrl);
  await sendEmail(to, subject, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
