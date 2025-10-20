## Middlewares

This document describes the server middlewares, their purpose, configuration, inputs, and outputs.

### auth (Authentication)

- Location: `src/middlewares/auth.js`
- Usage: `auth(options?)`
- Options:
  - `optional` (boolean, default: false): when true, missing/invalid auth will not block the request; `req.user` may be undefined.
- Behavior:
  - If `config.services.auth.url` is set, forwards the incoming request (headers and body) to that URL to validate and get the user, sanitizes the user object, and sets `req.user`.
  - Otherwise uses `passport.authenticate('jwt')` to validate the bearer token and set `req.user`.
  - On failure: throws 401 unless `optional=true` (then calls next without user).

### validate (Joi schema validator)

- Location: `src/middlewares/validate.js`
- Usage: `validate({ params?, query?, body? })`
- Behavior:
  - Compiles provided Joi schemas for `params`, `query`, `body` and validates the corresponding parts of `req`.
  - On success: assigns coerced/validated values back to `req` and `next()`.
  - On failure: throws 400 with concatenated Joi error messages.

### permission.checkPermission (Authorization by resource)

- Location: `src/middlewares/permission.js`
- Usage: `checkPermission(permission, type?)`
- Behavior:
  - Reads `req.user.id` and a target resource id from `req.params` (`id`, `modelId`, or `prototypeId`).
  - Calls `permissionService.hasPermission(userId, permission, id, type)`.
  - On false: throws 403; otherwise continues.

### genaiPermission (Feature permission)

- Location: `src/middlewares/genaiPermission.js`
- Usage: `genaiPermission`
- Behavior:
  - Ensures requester has `GENERATIVE_AI` permission (reads `req.body.user` or `req.user.id`).
  - On missing permission: throws 403.

### rateLimiter.authLimiter (Login throttling)

- Location: `src/middlewares/rateLimiter.js`
- Export: `authLimiter`
- Config:
  - Window: 15 minutes
  - Max: 20 requests per window
  - `skipSuccessfulRequests: true`
- Typical use: wrap auth/login endpoints to mitigate brute-force attempts.

### error (Error conversion and handling)

- Location: `src/middlewares/error.js`
- Exports: `errorConverter`, `errorHandler`
- errorConverter:
  - Converts unknown errors (including Mongoose errors) into `ApiError` with proper `statusCode` and message.
- errorHandler:
  - Sends JSON `{ code, message, stack? }`.
  - In production, hides non-operational details; in development, includes stack and logs error.

### Notes

- All thrown errors use `ApiError` and will be handled by the error pipeline.
- For optional auth, routes should pass `auth({ optional: true })` when public read is allowed under `strictAuth=false`.

