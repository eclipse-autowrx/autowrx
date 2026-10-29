// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

let ASSOCIATED_API = '';
let interval = null;
let defaultImgUrl = '';

function onWidgetLoaded(options) {
  if (options.api) {
    ASSOCIATED_API = options.api;
  }

  if (options.defaultImgUrl) {
    defaultImgUrl = options.defaultImgUrl;
  }

  const valueMaps = options.valueMaps || [];
  const displayExactMatch = options.displayExactMatch || false;

  interval = setInterval(() => {
    if (ASSOCIATED_API) {
      let apiValueObject = getApiValue(ASSOCIATED_API);
      let apiValue = apiValueObject?.value || 0;
      updateImage(apiValue, valueMaps, displayExactMatch);
    }
  }, options.dataUpdateInterval || 1000); // Default to 1 second if not provided
}

function updateImage(value, valueMaps, displayExactMatch) {
  let imageUrl = defaultImgUrl;
  let foundExactMatch = false;

  if (displayExactMatch) {
    for (let map of valueMaps) {
      if (value === map.value) {
        imageUrl = map.imgUrl;
        foundExactMatch = true;
        break; // Exit loop once exact match is found
      }
    }
    // If displayExactMatch is true and no exact match was found, use the default image
    if (!foundExactMatch) {
      imageUrl = defaultImgUrl;
    }
  } else {
    for (let map of valueMaps) {
      if (value >= map.value) {
        imageUrl = map.imgUrl;
      }
    }
  }

  const imageElement = document.getElementById('api-image');
  imageElement.style.display = 'block'; // Reset display in case it was hidden due to an error
  imageElement.src = imageUrl;
}

function onWidgetUnloaded(options) {
  if (interval) clearInterval(interval);
}
