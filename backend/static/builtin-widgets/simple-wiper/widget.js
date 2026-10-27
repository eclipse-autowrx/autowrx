// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

let interval = null;

function onWidgetLoaded(options) {
  const API_NAME = options.api || 'Vehicle.Body.Windshield.Front.Wiping.Mode';

  //console.log("API_NAME: ", API_NAME);

  interval = setInterval(() => {
    let apiValueObject = getApiValue(API_NAME);
    let apiValue = apiValueObject?.value || 'OFF';

    //console.log("API_VALUE: ", apiValue);

    const wiperIframe = document.getElementById('wiper');

    if (apiValue === 'MEDIUM') {
      wiperIframe.contentWindow.postMessage('LO', '*');
    } else if (apiValue === 'OFF') {
      wiperIframe.contentWindow.postMessage('OFF', '*');
    }
  }, options.dataUpdateInterval || 1000); // Default to 1 second if not provided
}

function onWidgetUnloaded(options) {
  if (interval) clearInterval(interval);
}
