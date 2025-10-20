// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const logger = require('../config/logger');
const { fileService } = require('../services');

const setLastCheckTime = () => {
  fs.writeFileSync(path.join(__dirname, '../../data/clock.txt'), moment().format());
};

const getLastCheckTime = () => {
  try {
    const lastCheckTime = fs.readFileSync(path.join(__dirname, '../../data/clock.txt'), 'utf8');
    return moment(lastCheckTime);
  } catch (error) {
    return moment().subtract(1, 'hour');
  }
};

/**
 *
 * @param {{name: string; published_at: string; browser_download_url: string}[]} releases
 */
const updateVSS = async (releases) => {
  try {
    fs.writeFileSync(path.join(__dirname, '../../data/vss.json'), JSON.stringify(releases, null, 2));
    logger.info('Updated VSS version list');
    logger.info('Downloading VSS versions data');
    const promises = releases.map((release) =>
      fileService.downloadFile(release.browser_download_url, path.join(__dirname, `../../data/${release.name}.json`))
    );
    await Promise.all(promises);
    logger.info('Downloaded VSS versions data');
  } catch (error) {
    logger.error(error);
  }
};

const checkUpdateVSS = async () => {
  try {
    const vssReleases = (await axios.get('https://api.github.com/repos/COVESA/vehicle_signal_specification/releases')).data;
    setLastCheckTime();
    const regex = /v(\d+\.\d+)/;

    const filtered = vssReleases
      ?.filter((release) => {
        const match = release.name.match(regex);
        if (match) {
          return Number(match[1]) >= 3.0;
        }
      })
      ?.map((release) => {
        return {
          name: release.name,
          published_at: release.published_at,
          browser_download_url: release.assets?.find((asset) => asset.name.endsWith('.json'))?.browser_download_url,
        };
      });

    const vssFilePath = path.join(__dirname, '../../data/vss.json');

    try {
      if (fs.existsSync(vssFilePath) && _.isEqual(filtered, JSON.parse(fs.readFileSync(vssFilePath, 'utf8')))) return;
    } catch (error) {
      logger.warn(error);
    }

    await updateVSS(filtered);
  } catch (error) {
    logger.warn(error);
  }
};

let interval = null;

const setupScheduledCheck = () => {
  const dataDirExist = fs.existsSync(path.join(__dirname, '../../data'));
  if (!dataDirExist) {
    fs.mkdirSync(path.join(__dirname, '../../data'));
  }
  const lastCheckTime = getLastCheckTime();
  if (moment().diff(lastCheckTime, 'seconds') > 120) {
    checkUpdateVSS();
  }
  if (!interval) {
    interval = setInterval(checkUpdateVSS, 1000 * 60 * 60 * 24);
  }
};

module.exports = setupScheduledCheck;
