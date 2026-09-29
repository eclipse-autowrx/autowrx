// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Example kit message hook. Copy to default.hook.js and adapt.
 *
 * Shows the three things a hook can do: rename a command, add fields, and
 * send one message as several. Every other message is sent unchanged.
 */
/* eslint-env browser */
(() => {
  // Commands the target kit only knows under another name.
  const RENAMED = {
    // old_cmd: 'new_cmd',
  };

  window.autowrxKitHook = {
    name: 'example',

    transform(payload, ctx) {
      const message = { ...payload };

      if (RENAMED[message.cmd]) message.cmd = RENAMED[message.cmd];

      // Add fields: tell the kit which user sent the deploy.
      if (message.cmd === 'deploy_request' && ctx.userName && !message.username) {
        message.username = ctx.userName;
      }

      // Send one message as several: also send the kebab-case spelling of
      // revert_vehicle_model for firmware that only knows that form.
      if (message.cmd === 'revert_vehicle_model') {
        return [message, { ...message, cmd: 'revert-vehicle-model' }];
      }

      return [message];
    },
  };
})();
