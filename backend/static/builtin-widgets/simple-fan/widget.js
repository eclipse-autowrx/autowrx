// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

let interval = null;

function onWidgetLoaded(options) {
  console.log('On my widget loaded');

  let speedValue = document.getElementById('speedValue');
  let fan_icon = document.querySelector('.fan_icon');
  let API_NAME = options.api;

  interval = setInterval(() => {
    if (speedValue && API_NAME) {
      let apiValueObject = getApiValue(API_NAME);
      let apiValue = apiValueObject?.value || 0;
      speedValue.innerText = apiValue;
      let duration = -0.02 * apiValue + 2.02;
      if (!apiValue || apiValue === 0) {
        fan_icon.style.animationDuration = '0s';
      } else {
        fan_icon.style.animationDuration = `${duration}s`;
      }
    }
  }, 500);
}

function onWidgetUnloaded(options) {
  console.log('On my widget unloaded');
  if (interval) clearInterval(interval);
}
