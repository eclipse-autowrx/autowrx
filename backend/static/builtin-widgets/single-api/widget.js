// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

let ASSOCIATED_API = '';
let interval = null;
function onWidgetLoaded(options) {
  if (options.api) {
    ASSOCIATED_API = options.api;
  }
  if (options.label) {
    document.getElementById('label').innerText = options.label;
  }
  if (options.labelClassname) {
    document.getElementById('label').className = options.labelClassname;
  }
  if (options.valueClassname) {
    document.getElementById('value').className = options.valueClassname;
  }
  if (options.boxClassname) {
    document.getElementById('api-widget').className = `p-4 rounded-lg shadow-lg ${options.boxClassname}`;
  }

  interval = setInterval(() => {
    if (ASSOCIATED_API) {
      let apiValueObject = getApiValue(ASSOCIATED_API);
      let apiValue = apiValueObject?.value || '0';
      document.getElementById('value').innerText = apiValue;
    }
  }, 100);
}

function onWidgetUnloaded(options) {
  if (interval) clearInterval(interval);
}
