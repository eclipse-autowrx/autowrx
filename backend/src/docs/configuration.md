# Configuration Variables Documentation

## Top-Level Variables

| Variable                      | Description                                                         | Default     |
| ----------------------------- | ------------------------------------------------------------------- | ----------- |
| `config.env`                  | Application environment ('production', 'development', 'test')       | Required    |
| `config.port`                 | Port number on which the server runs                                | `8080`      |
| `config.strictAuth`           | When enabled, enforces authentication on every routes               | `false`     |
| `config.logsMaxSize`          | Maximum size of change logs in megabytes. Auto truncate if exceeds. | `100`       |
| `config.adminEmails`          | Array of administrator email addresses                              | `[]`        |
| `config.adminPassword`        | Password for admin accounts created at startup                      | `undefined` |

## Database Configuration

| Variable                  | Description                                                  | Default       |
| ------------------------- | ------------------------------------------------------------ | ------------- |
| `config.mongoose.url`     | MongoDB connection URL (appends '-test' in test environment) | Required      |
| `config.mongoose.options` | MongoDB connection options                                   | Fixed options |

## Authentication Configuration

| Variable                                    | Description                                                           | Default          |
| ------------------------------------------- | --------------------------------------------------------------------- | ---------------- |
| `config.jwt.secret`                         | Secret key used for JWT signing/verification                          | Required         |
| `config.jwt.accessExpirationValue`          | Value for access token expiration                                     | `30`             |
| `config.jwt.accessExpirationUnit`           | Unit for access token expiration ('minutes' or 'days' in development) | `'minutes'`      |
| `config.jwt.refreshExpirationDays`          | Days until refresh tokens expire                                      | `30`             |
| `config.jwt.resetPasswordExpirationMinutes` | Minutes until password reset tokens expire                            | `10`             |
| `config.jwt.verifyEmailExpirationMinutes`   | Minutes until email verification tokens expire                        | `10`             |
| `config.jwt.cookie.name`                    | Name of the JWT cookie                                                | `'token'`        |
| `config.jwt.cookie.options`                 | Cookie configuration options                                          | Secure HTTP-only |

## Service URLs

| Variable                            | Description                               | Default     |
| ----------------------------------- | ----------------------------------------- | ----------- |
| `config.services.upload.port`       | File upload service port                  | Required    |
| `config.services.upload.domain`     | File upload service domain                | Required    |
| `config.services.log.port`          | Logging service port                      | `9600`      |
| `config.services.log.url`           | Logging service URL                       | `undefined` |
| `config.services.cache.url`         | Cache service URL                         | `undefined` |
| `config.services.auth.url`          | Authentication service URL                | `undefined` |
| `config.services.email.url`         | Custom email service URL                  | `undefined` |
| `config.services.email.apiKey`      | API key for default email service (Brevo) | `undefined` |
| `config.services.email.endpointUrl` | Endpoint URL for default email service    | `undefined` |

## Email Configuration (legacy)

This is not likely be used anywhere

| Variable                      | Description          | Default     |
| ----------------------------- | -------------------- | ----------- |
| `config.email.smtp.host`      | SMTP server hostname | `undefined` |
| `config.email.smtp.port`      | SMTP server port     | `undefined` |
| `config.email.smtp.auth.user` | SMTP username        | `undefined` |
| `config.email.smtp.auth.pass` | SMTP password        | `undefined` |
| `config.email.from`           | Email sender address | `undefined` |

## Integration Services

| Variable                       | Description                          | Default                   |
| ------------------------------ | ------------------------------------ | ------------------------- |
| `config.client.baseUrl`        | Base URL of the client application   | `'http://localhost:3000'` |
| `config.github.clientId`       | GitHub OAuth client ID               | `undefined`               |
| `config.github.clientSecret`   | GitHub OAuth client secret           | `undefined`               |
| `config.openai.apiKey`         | OpenAI API key                       | `undefined`               |
| `config.openai.endpointUrl`    | OpenAI API endpoint URL              | `undefined`               |
| `config.aws.publicKey`         | AWS public key                       | `undefined`               |
| `config.aws.secretKey`         | AWS secret key                       | `undefined`               |
| `config.sso.msGraphMeEndpoint` | Microsoft Graph API endpoint for SSO | Fixed value               |

## System Constraints

| Variable                                          | Description                      | Default |
| ------------------------------------------------- | -------------------------------- | ------- |
| `config.constraints.model.maximumAuthorizedUsers` | Maximum users per model (legacy) | `1000`  |
| `config.constraints.defaultPageSize`              | Default pagination size          | `100`   |
