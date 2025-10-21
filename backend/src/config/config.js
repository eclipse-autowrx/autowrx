// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(8080),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    CORS_ORIGINS: Joi.string().default('localhost:\\d+,127\\.0\\.0\\.1:\\d+').description('Allowed CORS origins (comma-separated regex patterns)'),
    // JWT
    JWT_SECRET: Joi.string().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    JWT_COOKIE_NAME: Joi.string().default('token').description('JWT cookie name'),
    JWT_COOKIE_DOMAIN: Joi.string().default('').description('JWT cookie domain'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_BASE_URL: Joi.string().description('Client base url').default('http://localhost:3000'),
    GITHUB_CLIENT_ID: Joi.string().description('Github client id'),
    GITHUB_CLIENT_SECRET: Joi.string().description('Github client secret'),
    // Upload service
    UPLOAD_PORT: Joi.number().required().description('Upload port'),
    UPLOAD_DOMAIN: Joi.string().required().description('Upload domain'),
    // Log service URL
    LOG_URL: Joi.string().description('Log base url'),
    // Cache service URL
    CACHE_URL: Joi.string().description('Cache base url'),
    // Auth service
    AUTH_URL: Joi.string().description('Auth service url'),
    // GenAI service
    GENAI_URL: Joi.string().description('GenAI service url'),
    // Email URL
    EMAIL_URL: Joi.string().description('URL to your custom email service'),
    EMAIL_API_KEY: Joi.string().description('API key for default email service (Brevo)'),
    EMAIL_ENDPOINT_URL: Joi.string().description('Endpoint url for default email service (Brevo)'),
    // AWS,
    AWS_PUBLIC_KEY: Joi.string().description('AWS public key'),
    AWS_SECRET_KEY: Joi.string().description('AWS secret key'),
    // OpenAI,
    OPENAI_API_KEY: Joi.string().description('OpenAI API key'),
    OPENAI_ENDPOINT_URL: Joi.string().description('OpenAI endpoint url'),
    // Homologation
    HOMOLOGATION_URL: Joi.string().description('Homologation service url'),
    STRICT_AUTH: Joi.boolean().description('Strict auth'),
    // Admin emails
    ADMIN_EMAILS: Joi.string().description('Admin emails'),
    ADMIN_PASSWORD: Joi.string().description('Admin password'),
    // Change Logs max size
    LOGS_MAX_SIZE: Joi.number().default(100).description('Max size of change logs in megabytes'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  strictAuth: envVars.STRICT_AUTH,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationValue: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    accessExpirationUnit: 'minutes',
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookie: {
      name: envVars.JWT_COOKIE_NAME,
      options: {
        secure: envVars.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: envVars.NODE_ENV === 'production' ? 'None' : 'Lax',
        ...(envVars.NODE_ENV === 'production' && { domain: envVars.JWT_COOKIE_DOMAIN }),
      },
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  client: {
    baseUrl: envVars.CLIENT_BASE_URL,
  },
  cors: {
    origins: (origin, callback) => {
      // Allow requests from localhost and 127.0.0.1 with any port
      const allowedOrigins = [
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^https:\/\/127\.0\.0\.1:\d+$/
      ];
      
      // Check if origin matches any of the allowed patterns
      const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  },
  constraints: {
    model: {
      maximumAuthorizedUsers: 1000,
    },
    defaultPageSize: 100,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  services: {
    upload: {
      port: envVars.UPLOAD_PORT,
      domain: envVars.UPLOAD_DOMAIN,
    },
    log: {
      port: envVars.LOG_PORT || 9600,
    },
    cache: {
      url: envVars.CACHE_URL,
    },
    auth: {
      url: envVars.AUTH_URL,
    },
    genAI: {
      url: envVars.GENAI_URL,
    },
    email: {
      url: envVars.EMAIL_URL, // This is the URL for your custom email service
      apiKey: envVars.EMAIL_API_KEY,
      endpointUrl: envVars.EMAIL_ENDPOINT_URL, // This is the endpoint URL for the default email service: Brevo
    },
    log: {
      url: envVars.LOG_URL,
    },
    homologation: {
      url: envVars.HOMOLOGATION_URL,
    },
  },
  openai: {
    apiKey: envVars.OPENAI_API_KEY,
    endpointUrl: envVars.OPENAI_ENDPOINT_URL,
  },
  aws: {
    publicKey: envVars.AWS_PUBLIC_KEY,
    secretKey: envVars.AWS_SECRET_KEY,
  },
  githubIssueSubmitUrl: 'https://api.github.com/repos/digital-auto/vehicle_signal_specification/issues',
  sso: {
    msGraphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  },
  adminEmails: envVars.ADMIN_EMAILS?.split(',') || [],
  adminPassword: envVars.ADMIN_PASSWORD,
  logsMaxSize: envVars.LOGS_MAX_SIZE,
};

if (config.env === 'development') {
  config.jwt.accessExpirationUnit = 'days';
}

module.exports = config;
