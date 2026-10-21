// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const path = require('path');

// Uploads are served same-origin, so serve them as inert data: no sniffing, a
// locked-down CSP, and forced download for anything that is not a raster image,
// JSON or PDF (this also covers legacy .html/.svg files uploaded before the
// upload allowlist existed).
const INLINE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.json', '.pdf']);

const uploadStaticOptions = {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    if (!INLINE_EXTS.has(path.extname(filePath).toLowerCase())) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  },
};

module.exports = uploadStaticOptions;
