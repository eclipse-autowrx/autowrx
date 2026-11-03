// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { recordRequest } = require('../services/metrics.service');

const UNMATCHED = 'unmatched';
const WILDCARD_PATHS = new Set(['*', '/*', '(.*)', '/(.*)']);

const routePathToString = (routePath) => (typeof routePath === 'string' ? routePath : String(routePath));

/**
 * Count requests and their latency by route template (e.g. /v2/model/:id), never
 * the raw URL, so label cardinality stays bounded and no ids leak into metrics.
 *
 * Express assigns req.route when a route matches, while req.baseUrl still holds
 * that router's full mount path. By the time the response finishes, an error
 * bubbling up (e.g. a 401 from auth) has already restored req.baseUrl to a
 * parent, so the template is captured at assignment time instead.
 */
const requestMetrics = (req, res, next) => {
  const start = process.hrtime.bigint();
  let routeTemplate = null;
  let currentRoute = req.route;

  Object.defineProperty(req, 'route', {
    configurable: true,
    enumerable: true,
    get: () => currentRoute,
    set: (route) => {
      currentRoute = route;
      if (route && route.path !== undefined) {
        const routePath = routePathToString(route.path);
        // Catch-alls (the app-level SPA fallback app.get('*')) match /v2 paths
        // only to call next() into the 404 handler: that's still unmatched.
        if (WILDCARD_PATHS.has(routePath)) {
          routeTemplate = null;
          return;
        }
        // router.get('/') under a mount reads better as the mount path itself
        routeTemplate = routePath === '/' && req.baseUrl ? req.baseUrl : `${req.baseUrl}${routePath}`;
      }
    },
  });

  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordRequest({
      method: req.method,
      route: routeTemplate || UNMATCHED,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
};

module.exports = requestMetrics;
