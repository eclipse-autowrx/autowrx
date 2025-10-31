// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { siteConfigService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const createSiteConfig = catchAsync(async (req, res) => {
  const siteConfigBody = {
    ...req.body,
    created_by: req.user.id,
  };
  const siteConfig = await siteConfigService.createSiteConfig(siteConfigBody);
  res.status(httpStatus.CREATED).send(siteConfig);
});

const getSiteConfigs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['secret', 'category', 'key', 'scope']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await siteConfigService.querySiteConfigs(filter, options);
  res.send(result);
});

const getSiteConfig = catchAsync(async (req, res) => {
  const siteConfig = await siteConfigService.getSiteConfigById(req.params.siteConfigId);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }
  res.send(siteConfig);
});

const getSiteConfigByKey = catchAsync(async (req, res) => {
  const siteConfig = await siteConfigService.getSiteConfigByKey(req.params.key);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }
  res.send(siteConfig);
});

const getSiteConfigValue = catchAsync(async (req, res) => {
  const value = await siteConfigService.getSiteConfigValue(req.params.key);
  res.send({ key: req.params.key, value });
});

const getSiteConfigsByKeys = catchAsync(async (req, res) => {
  const { keys } = req.body;
  const values = await siteConfigService.getSiteConfigValues(keys);
  res.send(values);
});

const getPublicSiteConfigs = catchAsync(async (req, res) => {
  const { scope = 'site', target_id } = req.query;
  const configs = await siteConfigService.getPublicSiteConfigs(scope, target_id);
  res.send(configs);
});

const getAllSiteConfigs = catchAsync(async (req, res) => {
  const { scope = 'site', target_id } = req.query;
  const configs = await siteConfigService.getAllSiteConfigs(scope, target_id);
  res.send(configs);
});

const getPublicConfigsByScope = catchAsync(async (req, res) => {
  const { scope, target_id } = req.params;
  const configs = await siteConfigService.getPublicSiteConfigs(scope, target_id);
  res.send(configs);
});

const getPublicConfigValueByScope = catchAsync(async (req, res) => {
  const { scope, target_id, key } = req.params;
  const value = await siteConfigService.getSiteConfigValue(key, scope, target_id);
  res.send({ key, value });
});

const getConfigsByScope = catchAsync(async (req, res) => {
  const { scope, target_id } = req.params;
  const filter = pick(req.query, ['secret', 'category', 'key']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Add scope and target_id to filter
  filter.scope = scope;
  if (target_id) {
    filter.target_id = target_id;
  }
  
  const result = await siteConfigService.querySiteConfigs(filter, options);
  res.send(result);
});

const getAllConfigsByScope = catchAsync(async (req, res) => {
  const { scope, target_id } = req.params;
  const configs = await siteConfigService.getAllSiteConfigs(scope, target_id);
  res.send(configs);
});

const updateSiteConfig = catchAsync(async (req, res) => {
  const updateBody = {
    ...req.body,
    updated_by: req.user.id,
  };
  const siteConfig = await siteConfigService.updateSiteConfigById(req.params.siteConfigId, updateBody);
  res.send(siteConfig);
});

const updateSiteConfigByKey = catchAsync(async (req, res) => {
  const updateBody = {
    ...req.body,
    updated_by: req.user.id,
  };
  const siteConfig = await siteConfigService.updateSiteConfigByKey(req.params.key, updateBody);
  res.send(siteConfig);
});

const deleteSiteConfig = catchAsync(async (req, res) => {
  await siteConfigService.deleteSiteConfigById(req.params.siteConfigId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteSiteConfigByKey = catchAsync(async (req, res) => {
  await siteConfigService.deleteSiteConfigByKey(req.params.key);
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkUpsertSiteConfigs = catchAsync(async (req, res) => {
  const { configs } = req.body;
  const result = await siteConfigService.bulkUpsertSiteConfigs(configs, req.user.id);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  createSiteConfig,
  getSiteConfigs,
  getSiteConfig,
  getSiteConfigByKey,
  getSiteConfigValue,
  getSiteConfigsByKeys,
  getPublicSiteConfigs,
  getAllSiteConfigs,
  getPublicConfigsByScope,
  getPublicConfigValueByScope,
  getConfigsByScope,
  getAllConfigsByScope,
  updateSiteConfig,
  updateSiteConfigByKey,
  deleteSiteConfig,
  deleteSiteConfigByKey,
  bulkUpsertSiteConfigs,
  // global.css helpers
  getGlobalCss: catchAsync(async (req, res) => {
    const cssPath = path.join(__dirname, '..', '..', 'static', 'global.css');
    const exists = fs.existsSync(cssPath);
    if (!exists) {
      throw new ApiError(httpStatus.NOT_FOUND, 'global.css not found');
    }
    const content = await fsp.readFile(cssPath, 'utf8');
    res.status(httpStatus.OK).send({ content });
  }),
  updateGlobalCss: catchAsync(async (req, res) => {
    const { content } = req.body || {};
    if (typeof content !== 'string') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'content must be a string');
    }
    const cssPath = path.join(__dirname, '..', '..', 'static', 'global.css');
    await fsp.writeFile(cssPath, content, 'utf8');
    res.status(httpStatus.OK).send({ success: true });
  }),
  restoreDefaultGlobalCss: catchAsync(async (req, res) => {
    const orgCssPath = path.join(__dirname, '..', '..', 'static', 'global_org.css');
    const cssPath = path.join(__dirname, '..', '..', 'static', 'global.css');

    // Check if original CSS file exists
    const orgExists = fs.existsSync(orgCssPath);
    if (!orgExists) {
      throw new ApiError(httpStatus.NOT_FOUND, 'global_org.css not found');
    }

    // Copy global_org.css to global.css
    await fsp.copyFile(orgCssPath, cssPath);

    // Read and return the content
    const content = await fsp.readFile(cssPath, 'utf8');
    res.status(httpStatus.OK).send({ content });
  }),
};
