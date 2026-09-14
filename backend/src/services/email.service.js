// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { default: axios } = require('axios');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../config/config');
const { resetPasswordTemplate, welcomeEmailTemplate, resetPasswordCodeTemplate } = require('../utils/emailTemplates');
const { decrypt } = require('../utils/encryption');
const logger = require('../config/logger');

/**
 * Get email config from site-config database.
 * Requires lazy import to avoid circular dependency with siteConfig.service.
 * @returns {Promise<Object|null>} Email config object or null
 */
const getEmailConfig = async () => {
  try {
    const { SiteConfig } = require('../models');
    const configDoc = await SiteConfig.findOne({ key: 'EMAIL_CONFIG', scope: 'site' });
    if (!configDoc || !configDoc.value || configDoc.value.provider === 'none') {
      return null;
    }
    const emailCfg = configDoc.value;

    // Decrypt secrets
    if (emailCfg.apiKey) {
      try {
        emailCfg.apiKey = decrypt(emailCfg.apiKey);
      } catch {
        // Value may not be encrypted yet (first save before encryption hook)
      }
    }
    if (emailCfg.smtpConfig && emailCfg.smtpConfig.pass) {
      try {
        emailCfg.smtpConfig.pass = decrypt(emailCfg.smtpConfig.pass);
      } catch {
        // Value may not be encrypted yet
      }
    }

    return emailCfg;
  } catch (error) {
    logger.error('Failed to load email config from site-config:', error.message);
    return null;
  }
};

/**
 * Send an email using site-config-based provider (Resend or SMTP).
 * Falls back to legacy env-based config if site-config is not set.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  const emailCfg = await getEmailConfig();

  if (emailCfg) {
    return sendWithSiteConfig(emailCfg, to, subject, html);
  }

  // Fallback to legacy env-based config
  return sendWithLegacyConfig(to, subject, html);
};

/**
 * Send email using site-config provider
 */
const sendWithSiteConfig = async (emailCfg, to, subject, html) => {
  const from = emailCfg.fromName
    ? `${emailCfg.fromName} <${emailCfg.fromEmail}>`
    : emailCfg.fromEmail;

  if (emailCfg.provider === 'resend') {
    const resend = new Resend(emailCfg.apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });
    if (error) {
      logger.error('Resend email error:', error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
    return;
  }

  if (emailCfg.provider === 'smtp') {
    const smtpCfg = emailCfg.smtpConfig;
    const transporter = nodemailer.createTransport({
      host: smtpCfg.host,
      port: smtpCfg.port || 587,
      secure: smtpCfg.secure || false,
      auth: smtpCfg.user ? {
        user: smtpCfg.user,
        pass: smtpCfg.pass,
      } : undefined,
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return;
  }

  throw new Error(`Unknown email provider: ${emailCfg.provider}`);
};

/**
 * Fallback: send email using legacy env-based config
 */
const sendWithLegacyConfig = async (to, subject, html) => {
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
 * @param {string} domain
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token, domain) => {
  const subject = 'Reset password';
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
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send reset password code email
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit reset code
 * @param {string} name - User's display name
 * @returns {Promise}
 */
const sendResetPasswordCodeEmail = async (to, code, name) => {
  const subject = 'Password Reset Code';
  const html = resetPasswordCodeTemplate(name || to, code);
  await sendEmail(to, subject, html);
};

/**
 * Send welcome email to a newly registered user
 * @param {string} to - User's email
 * @param {string} name - User's display name
 * @param {string} domain - Site base URL
 * @returns {Promise}
 */
const sendWelcomeEmail = async (to, name, domain) => {
  try {
    const emailCfg = await getEmailConfig();
    if (!emailCfg) {
      // Email not configured, silently skip
      return;
    }

    const siteName = emailCfg.fromName || 'Our Platform';
    const loginUrl = `${domain || config.client.baseUrl}/login`;
    const subject = `Welcome to ${siteName}!`;
    const html = welcomeEmailTemplate(name, siteName, loginUrl);
    await sendEmail(to, subject, html);
  } catch (error) {
    // Welcome email is non-critical, log but don't throw
    logger.error('Failed to send welcome email:', error.message);
  }
};

/**
 * Send a test email to verify configuration
 * @param {string} to - Recipient email
 * @returns {Promise}
 */
const sendTestEmail = async (to) => {
  const emailCfg = await getEmailConfig();
  if (!emailCfg) {
    throw new Error('Email service is not configured. Please configure it in Site Management > Email Config first.');
  }

  const subject = 'Test Email - Configuration Verified';
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:sans-serif;background-color:#f5f5f5;">
  <table width="100%" style="max-width:480px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td height="8" style="background-color:#222;"></td></tr>
    <tr>
      <td style="padding:24px;">
        <h2 style="margin:0 0 16px;">Email Configuration Test</h2>
        <p>This is a test email to confirm that your email service is configured correctly.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">Provider</td><td style="padding:8px;border:1px solid #eee;">${emailCfg.provider}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:600;">From</td><td style="padding:8px;border:1px solid #eee;">${emailCfg.fromName ? emailCfg.fromName + ' &lt;' + emailCfg.fromEmail + '&gt;' : emailCfg.fromEmail}</td></tr>
        </table>
        <p style="color:#666;font-size:0.875rem;">If you received this email, your configuration is working correctly.</p>
      </td>
    </tr>
    <tr><td height="8" style="background-color:#222;"></td></tr>
  </table>
</body>
</html>`;

  await sendWithSiteConfig(emailCfg, to, subject, html);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendResetPasswordCodeEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendTestEmail,
  getEmailConfig,
};
