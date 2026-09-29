// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Default kit message hook — pass-through (sends every message unchanged).
 *
 * Replace this file per deployment to reshape the `messageToKit` socket
 * messages the frontend sends to the runtime / kit server (for example to
 * match what a specific kit firmware expects). Copy from
 * default.hook.example.js as a starting point.
 *
 * Served to the browser at /kit-hooks/hook.js and loaded before the app.
 * It runs in the browser, so it must be plain JavaScript (no require/import).
 *
 * transform(payload, ctx) returns the list of messages to send, in order:
 * - payload: the messageToKit object ({ cmd, to_kit_id, ... })
 * - ctx: { source, prototypeId, userId, userName }
 *     source is 'connector' (runtime panel, deploy, Manage Hardware Kit) or
 *     'plugin-helper' (VSS / signal-mapping helpers offered to plugins)
 *
 * If this file is missing, throws, or returns anything other than a non-empty
 * array of objects, the original message is sent unchanged.
 */
/* eslint-env browser */
window.autowrxKitHook = {
  name: 'default',

  transform(payload) {
    return [payload];
  },
};
