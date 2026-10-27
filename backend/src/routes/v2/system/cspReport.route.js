// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../../../config/logger');

const router = express.Router();

// Deliberately public: browser reports cannot supply a bearer token. Reports
// are untrusted telemetry, never a source of auth/configuration decisions.
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const safeOrigin = (value) => {
  if (['inline', 'eval', 'data', 'blob', 'self'].includes(value)) return value;
  if (typeof value !== 'string' || value.length > 4096) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'ws:', 'wss:'].includes(url.protocol) ? url.origin : undefined;
  } catch {
    return undefined;
  }
};

const summarizeReport = (entry) => {
  const body = entry?.['csp-report'] || (entry?.type === 'csp-violation' && entry.body);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const directive = body['effective-directive'] || body.effectiveDirective;
  if (typeof directive !== 'string' || !/^[a-z-]{1,64}$/.test(directive)) return null;
  return {
    directive,
    disposition: body.disposition === 'enforce' ? 'enforce' : 'report',
    documentOrigin: safeOrigin(body['document-uri'] || body.documentURL),
    blockedOrigin: safeOrigin(body['blocked-uri'] || body.blockedURL),
    sourceOrigin: safeOrigin(body['source-file'] || body.sourceFile),
  };
};

router.post(
  '/',
  reportLimiter,
  express.json({ type: ['application/csp-report', 'application/reports+json', 'application/json'], limit: '16kb' }),
  (req, res) => {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    if (!entries.length || entries.length > 20) return res.sendStatus(400);
    const reports = entries.map(summarizeReport);
    if (reports.some((report) => !report)) return res.sendStatus(400);
    reports.forEach((report) => logger.info(`CSP violation ${JSON.stringify(report)}`));
    return res.sendStatus(204);
  },
);

// Keep parser failures bounded and opaque instead of passing untrusted JSON
// error details through the application's general error converter/logger.
router.use((err, _req, res, next) => {
  if (!['entity.too.large', 'entity.parse.failed', 'encoding.unsupported', 'charset.unsupported'].includes(err.type)) {
    return next(err);
  }
  return res.sendStatus(err.type === 'entity.too.large' ? 413 : 400);
});

module.exports = router;
