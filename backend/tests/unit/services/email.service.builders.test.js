// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #641: unit coverage for email.service config loading, provider routing and message builders.

jest.mock('../../../src/models', () => ({ SiteConfig: { findOne: jest.fn() } }));
jest.mock('../../../src/utils/encryption', () => ({ decrypt: jest.fn() }));
jest.mock('axios', () => {
  const instance = { post: jest.fn() };
  return { __esModule: true, default: instance, post: instance.post };
});
jest.mock('resend', () => ({ Resend: jest.fn() }));
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const axios = require('axios').default;
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { SiteConfig } = require('../../../src/models');
const { decrypt } = require('../../../src/utils/encryption');
const config = require('../../../src/config/config');
const emailService = require('../../../src/services/email.service');

const resendSend = jest.fn();
const sendMail = jest.fn();

const siteConfig = (value) => SiteConfig.findOne.mockResolvedValue(value === undefined ? null : { value });
const resendCfg = (extra = {}) => ({ provider: 'resend', apiKey: 'enc-key', fromEmail: 'no-reply@x.io', ...extra });
const smtpCfg = (smtp = {}, extra = {}) => ({
  provider: 'smtp',
  fromEmail: 'no-reply@x.io',
  smtpConfig: { host: 'smtp.x.io', ...smtp },
  ...extra,
});

describe('email.service', () => {
  const originalEmail = { ...config.services.email };
  const originalBaseUrl = config.client.baseUrl;

  beforeAll(() => {
    config.client.baseUrl = 'https://app.example';
  });
  afterAll(() => {
    Object.assign(config.services.email, originalEmail);
    config.client.baseUrl = originalBaseUrl;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    decrypt.mockImplementation((v) => `dec(${v})`);
    resendSend.mockResolvedValue({ error: null });
    Resend.mockImplementation(() => ({ emails: { send: resendSend } }));
    sendMail.mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    axios.post.mockResolvedValue({});
    Object.assign(config.services.email, { url: undefined, endpointUrl: 'https://brevo.example/send', apiKey: 'k' });
  });

  describe('getEmailConfig', () => {
    test('returns null when unset or provider is none', async () => {
      siteConfig();
      await expect(emailService.getEmailConfig()).resolves.toBeNull();
      siteConfig({ provider: 'none' });
      await expect(emailService.getEmailConfig()).resolves.toBeNull();
    });

    test('decrypts the api key and smtp password', async () => {
      siteConfig(smtpCfg({ pass: 'enc-pass' }, { apiKey: 'enc-key' }));
      const cfg = await emailService.getEmailConfig();
      expect(cfg.apiKey).toBe('dec(enc-key)');
      expect(cfg.smtpConfig.pass).toBe('dec(enc-pass)');
    });

    test('keeps the raw value when decryption fails', async () => {
      decrypt.mockImplementation(() => {
        throw new Error('not encrypted');
      });
      siteConfig(resendCfg({ apiKey: 'plain' }));
      await expect(emailService.getEmailConfig()).resolves.toMatchObject({ apiKey: 'plain' });
    });

    test('returns null when the lookup fails', async () => {
      SiteConfig.findOne.mockRejectedValue(new Error('db down'));
      await expect(emailService.getEmailConfig()).resolves.toBeNull();
    });
  });

  describe('sendEmail provider routing', () => {
    test('resend: uses the decrypted key and "Name <email>" sender', async () => {
      siteConfig(resendCfg({ fromName: 'AutoWRX' }));
      await emailService.sendEmail('u@x.io', 'Subj', '<p>hi</p>');

      expect(Resend).toHaveBeenCalledWith('dec(enc-key)');
      expect(resendSend).toHaveBeenCalledWith({
        from: 'AutoWRX <no-reply@x.io>',
        to: ['u@x.io'],
        subject: 'Subj',
        html: '<p>hi</p>',
      });
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('resend: bare sender without fromName; API errors are thrown', async () => {
      siteConfig(resendCfg());
      resendSend.mockResolvedValue({ error: { message: 'quota' } });
      await expect(emailService.sendEmail('u@x.io', 's', 'h')).rejects.toThrow('Failed to send email via Resend: quota');
      expect(resendSend.mock.calls[0][0].from).toBe('no-reply@x.io');
    });

    test('smtp: defaults to port 587, not secure, no auth without a user', async () => {
      siteConfig(smtpCfg());
      await emailService.sendEmail('u@x.io', 's', 'h');

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.x.io',
        port: 587,
        secure: false,
        auth: undefined,
      });
      expect(sendMail).toHaveBeenCalledWith({ from: 'no-reply@x.io', to: 'u@x.io', subject: 's', html: 'h' });
    });

    test('smtp: passes explicit port, secure and credentials', async () => {
      siteConfig(smtpCfg({ port: 465, secure: true, user: 'me', pass: 'enc-pass' }));
      await emailService.sendEmail('u@x.io', 's', 'h');
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true, auth: { user: 'me', pass: 'dec(enc-pass)' } }),
      );
    });

    test('unknown provider throws', async () => {
      siteConfig({ provider: 'pigeon', fromEmail: 'a@x.io' });
      await expect(emailService.sendEmail('u@x.io', 's', 'h')).rejects.toThrow('Unknown email provider: pigeon');
    });

    test('legacy fallback posts a Brevo-shaped body to the endpoint URL', async () => {
      siteConfig();
      await emailService.sendEmail('u@x.io', 's', 'h');
      expect(axios.post).toHaveBeenCalledWith(
        'https://brevo.example/send',
        expect.objectContaining({ to: [{ name: 'user', email: 'u@x.io' }], subject: 's', htmlContent: 'h' }),
        { headers: { 'api-key': 'k' } },
      );
    });

    test('legacy fallback prefers a custom email service URL', async () => {
      siteConfig();
      config.services.email.url = 'https://mail.example/send';
      await emailService.sendEmail('u@x.io', 's', 'h');
      expect(axios.post).toHaveBeenCalledWith(
        'https://mail.example/send',
        { to: 'u@x.io', subject: 's', html: 'h' },
        { headers: { 'api-key': 'k' } },
      );
    });
  });

  describe('message builders', () => {
    const lastSent = () => resendSend.mock.calls[resendSend.mock.calls.length - 1][0];

    beforeEach(() => siteConfig(resendCfg({ fromName: 'AutoWRX' })));

    test('reset link honours an explicit domain and encodes the token', async () => {
      await emailService.sendResetPasswordEmail('u@x.io', 'a b&c', 'https://tenant.example');
      expect(lastSent().subject).toBe('Reset password');
      expect(lastSent().html).toContain('https://tenant.example/reset-password#token=a%20b%26c');
    });

    test('reset code email includes the code and greets by name', async () => {
      await emailService.sendResetPasswordCodeEmail('u@x.io', '482913', 'Ann');
      expect(lastSent().subject).toBe('Password Reset Code');
      expect(lastSent().html).toContain('482913');
      expect(lastSent().html).toContain('Ann');
    });

    test('reset code email falls back to the address when no name is given', async () => {
      await emailService.sendResetPasswordCodeEmail('u@x.io', '482913');
      expect(lastSent().html).toContain('u@x.io');
    });

    test('welcome email uses fromName as the site name and links to login', async () => {
      await emailService.sendWelcomeEmail('u@x.io', 'Ann');
      expect(lastSent().subject).toBe('Welcome to AutoWRX!');
      expect(lastSent().html).toContain('https://app.example/login');
    });

    test('welcome email defaults the site name', async () => {
      siteConfig(resendCfg());
      await emailService.sendWelcomeEmail('u@x.io', 'Ann', 'https://tenant.example');
      expect(lastSent().subject).toBe('Welcome to Our Platform!');
      expect(lastSent().html).toContain('https://tenant.example/login');
    });

    test('welcome email is skipped when email is not configured', async () => {
      siteConfig();
      await emailService.sendWelcomeEmail('u@x.io', 'Ann');
      expect(resendSend).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('welcome email swallows send failures', async () => {
      resendSend.mockResolvedValue({ error: { message: 'down' } });
      await expect(emailService.sendWelcomeEmail('u@x.io', 'Ann')).resolves.toBeUndefined();
    });

    test('sendTestEmail requires a site config', async () => {
      siteConfig();
      await expect(emailService.sendTestEmail('u@x.io')).rejects.toThrow('Email service is not configured');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('sendTestEmail reports the provider and sender', async () => {
      await emailService.sendTestEmail('u@x.io');
      expect(lastSent().subject).toBe('Test Email - Configuration Verified');
      expect(lastSent().html).toContain('resend');
      expect(lastSent().html).toContain('AutoWRX &lt;no-reply@x.io&gt;');
    });
  });
});
