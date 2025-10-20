// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Jimp = require('jimp');
const logger = require('../config/logger');

/**
 *
 * @param {string} url1
 * @param {string} url2
 * @returns {Promise<number>}
 */
const diff = async (url1, url2) => {
  try {
    const image1 = await Jimp.read(url1);
    const image2 = await Jimp.read(url2);

    const res = Jimp.diff(image1, image2);
    return res.percent;
  } catch (error) {
    logger.info(`Error comparing images: ${JSON.stringify(error.message || error)}`);
    return -1;
  }
};

module.exports = {
  diff,
};
