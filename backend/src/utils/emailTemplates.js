// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 *
 * @param {string} fullName
 * @param {string} link
 * @returns {string}
 */
const resetPasswordTemplate = (fullName, link) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>

  </head>
  <body style="margin:0;width:100%;font-size:1rem;table-layout:fixed;background-color:#ccc;">
    <table class="main" width="100%" style="border-spacing:0;max-width:480px;width:100%;margin:0 auto;background-color:#fff;font-family:sans-serif;color:#222222;">
      <!-- TOP BORDER -->
      <tr>
        <td height="8" style="padding:0;background-color: #222;"></td>
      </tr>
      <!-- MAIN SECTION -->
      <tr>
        <td class="content" style="padding:0;width:100%;padding:12px 24px;">
          <h1>Reset your password</h1>
          <p>Hi ${fullName},</p>
          <p class="color:#222222">
            Let's reset your password so you can continue accessing latest
            features.
          </p>
          <button class="reset-password-btn" style="background-color:#000;color:#fff;border-radius:6px;width:100%;height:48px;outline:0;border:0;cursor:pointer;">
            <a style="
                text-decoration: none !important;
                text-decoration: none;
                color: white;
                font-size: 1rem;
                font-weight: 600;
                width: 100%;
                height: 100%;
                line-height: 48px;
                display:block;
              " href="${link}">Reset Password</a>
          </button>
          <p>
            or <a href="${link}">click here</a> to reset password if you cannot open the page.
          </p>
          <p>
            If you did not reset your password, you should visit
            <a href="#">your recent accesses</a>
            to this account.
          </p>
          <p class="author" style="font-size:0.875rem;font-weight:600;">digital.auto</p>
        </td>
      </tr>
      <!-- FOOTER -->
      <tr>
        <td class="footer" height="120" style="padding:0;background-image:linear-gradient(to left, #aebd38, #005072);background-color: #222;"></td>
      </tr>
    </table>
  </body>
</html>`;

module.exports = { resetPasswordTemplate };
