// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import globalSetup from './e2e-env-guard';

export default async function cspSetup() {
  const response = await fetch(process.env.BASE_URL || '');
  const policy = response.headers.get('content-security-policy') || '';
  if (!policy.includes("default-src 'self'") || !policy.includes("script-src-attr 'none'") ||
      /script-src[^;]*(unsafe-inline|unsafe-eval|\*)/.test(policy) ||
      response.headers.has('content-security-policy-report-only')) {
    throw new Error('CSP suite requires the backend-served production build with CSP_MODE=enforce.');
  }
  await globalSetup();
}
