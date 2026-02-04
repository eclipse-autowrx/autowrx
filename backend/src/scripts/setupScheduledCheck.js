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
    logger.info(`Downloading VSS versions data for ${releases.length} versions`);
    
    // Download files with individual error handling so one failure doesn't stop others
    const downloadPromises = releases.map(async (release) => {
      const filePath = path.join(__dirname, `../../data/${release.name}.json`);
      try {
        await fileService.downloadFile(release.browser_download_url, filePath);
        // Verify file was actually downloaded
        if (fs.existsSync(filePath)) {
          logger.info(`Successfully downloaded ${release.name}.json`);
        } else {
          logger.warn(`Download reported success but file ${release.name}.json not found`);
        }
      } catch (error) {
        logger.error(`Failed to download ${release.name}.json from ${release.browser_download_url}: ${error.message}`);
        // Continue with other downloads even if this one fails
      }
    });
    
    await Promise.allSettled(downloadPromises);
    logger.info('Completed VSS versions data download (some may have failed)');
  } catch (error) {
    logger.error(`Error in updateVSS: ${error.message}`);
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
      })
      ?.filter((release) => {
        // Only include releases that have a valid download URL
        if (!release.browser_download_url) {
          logger.warn(`Release ${release.name} does not have a valid JSON download URL, skipping`);
          return false;
        }
        return true;
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
