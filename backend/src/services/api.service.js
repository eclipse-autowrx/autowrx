// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const crypto = require('crypto');
const { userService } = require('.');
const { Api, Model, ExtendedApi } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { sortObject } = require('../utils/sort');

/**
 *
 * @param {Object} apiBody
 * @returns {Promise<string>}
 */
const createApi = async (apiBody) => {
  const api = await Api.create(apiBody);
  return api._id;
};

/**
 *
 * @param {string} apiId
 * @returns {Promise<import('../models/api.model').Api>}
 */
const getApi = async (apiId) => {
  const api = await Api.findById(apiId);
  if (!api) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Api not found');
  }
  return api;
};

/**
 *
 * @param {string} modelId
 * @returns  {Promise<import('../models/api.model').Api>}
 */
const getApiByModelId = async (modelId) => {
  const api = await Api.findOne({ model: modelId });
  if (!api) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Api not found');
  }
  return api;
};

/**
 *
 * @param {string} apiId
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<string>}
 */
const updateApi = async (apiId, updateBody, userId) => {
  const api = await getApi(apiId);

  if (!api) {
    throw new Error('API not found');
  }

  const user = await userService.getUserById(userId);
  if (user.role !== 'admin' && String(api.created_by) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to update this api");
  }

  Object.assign(api, updateBody);
  await api.save();
  return api._id;
};

const deleteApi = async (apiId, userId) => {
  const api = await getApi(apiId);

  if (!api) {
    throw new ApiError(httpStatus.NOT_FOUND, 'API not found');
  }

  const user = await userService.getUserById(userId);
  if (user.role !== 'admin' && String(api.created_by) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to delete this api");
  }

  await api.deleteOne();
};

const listVSSVersions = async () => {
  let versions;
  try {
    const rawData = fs.readFileSync(path.join(__dirname, '../../data/vss.json'));
    versions = rawData ? JSON.parse(rawData, 'utf8') : [];
  } catch (error) {
    logger.error(error);
    versions = [];
  }
  return versions;
};

/**
 *
 * @param {string} name
 * @returns {Promise<object>}
 */
const getVSSVersion = async (name) => {
  // VSS version names are simple identifiers (e.g. "v4.1", "v6.0"). Reject
  // anything containing path separators or traversal sequences before it
  // reaches path.join — prevents reading arbitrary JSON files from the
  // filesystem via crafted api_version values.
  if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid VSS version name');
  }

  const dataDir = path.resolve(__dirname, '../../data');
  const filePath = path.resolve(dataDir, `${name}.json`);

  // Defense-in-depth: the resolved path must stay inside the data directory
  if (!filePath.startsWith(dataDir + path.sep)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid VSS version name');
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'VSS version not found');
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data;
};

/**
 *
 * @param {Object} cvi
 * @returns {Array}
 */
const parseCvi = (cvi) => {
  const traverse = (node, prefix = 'Vehicle') => {
    let ret = [];

    ret.push({ ...node, name: prefix });

    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        const newPrefix = `${prefix}.${key}`;
        node.children[key].name = newPrefix;
        ret = ret.concat(traverse(child, newPrefix));
      }
    }

    return ret;
  };

  const mainApi = Object.keys(cvi).at(0) || 'Vehicle';

  const ret = traverse(cvi[mainApi], mainApi);

  ret.forEach((item) => {
    if (item.type === 'branch') return;
    const arName = item.name.split('.');
    if (arName.length > 1) {
      item.shortName = `.${arName.slice(1).join('.')}`;
    } else {
      item.shortName = item.name; // Ensure root elements have their name as shortName
    }
  });

  ret.sort((a, b) => {
    const aParts = a.name.split('.');
    const bParts = b.name.split('.');

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
      if (aParts[i] !== bParts[i]) {
        return (aParts[i] || '').localeCompare(bParts[i] || '');
      }
    }

    return 0;
  });

  return ret;
};

/**
 *
 * @param {string} code
 * @param {Array<any>} apiList
 * @returns {Array<any>}
 */
const getUsedApis = (code, apiList) => {
  try {
    const apis = [];
    apiList.forEach((item) => {
      if (item.shortName) {
        if (code.includes(item.shortName)) {
          apis.push(item.name);
        }
      }
    });

    return apis;
  } catch (error) {
    logger.error(`Error while parsing/counting APIs number: ${error}`);
    return [];
  }
};

const ensureParentApiHierarchy = (root, api) => {
  if (!api) return root;

  let parentNode = root;

  for (const currentApi of api.split('.')) {
    parentNode.children ??= {};

    if (!Object.prototype.hasOwnProperty.call(parentNode.children, currentApi)) {
      Object.defineProperty(parentNode.children, currentApi, {
        value: { type: 'branch', children: {} },
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    parentNode = parentNode.children[currentApi];
  }

  parentNode.children ??= {};

  return parentNode;
};

const defineChild = (target, key, value) => {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
};

// VSS fields an ExtendedApi row owns. Every other key on an imported wishlist node (custom keys,
// name, children) stays as it was imported.
const WISHLIST_ROW_FIELDS = [
  'type',
  'datatype',
  'description',
  'unit',
  'min',
  'max',
  'allowed',
  'comment',
  'default',
  'deprecation',
  'isWishlist',
  'custom_properties',
];

/**
 * Merge an ExtendedApi row into the imported wishlist node, keeping the node's key order.
 * @param {object} node - wishlist node from the stored custom VSS tree
 * @param {object} row - ExtendedApi row as JSON
 * @returns {object}
 */
const mergeWishlistNode = (node, row) => {
  const merged = {};
  Object.keys(node).forEach((key) => {
    if (!WISHLIST_ROW_FIELDS.includes(key)) {
      defineChild(merged, key, node[key]);
    } else if (row[key] !== undefined) {
      defineChild(merged, key, row[key]);
    }
  });
  WISHLIST_ROW_FIELDS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(node, key) && row[key] !== undefined) {
      defineChild(merged, key, row[key]);
    }
  });
  return merged;
};

/**
 * Replace wishlist nodes of the stored custom VSS tree with their current ExtendedApi rows, in place.
 * Nodes whose row was deleted are removed.
 * @param {object} node
 * @param {string} prefix
 * @param {Map<string, object>} rowsByName
 * @param {Set<string>} mergedApiNames - receives the apiNames that were merged
 */
const overlayWishlistNodes = (node, prefix, rowsByName, mergedApiNames) => {
  if (!node || typeof node !== 'object' || !node.children || typeof node.children !== 'object') return;
  Object.keys(node.children).forEach((key) => {
    const child = node.children[key];
    const childPrefix = `${prefix}.${key}`;
    if (!child || typeof child !== 'object') return;
    if (child.isWishlist) {
      const apiName = child.name || childPrefix;
      const row = rowsByName.get(apiName);
      if (!row) {
        delete node.children[key];
        return;
      }
      defineChild(node.children, key, mergeWishlistNode(child, row));
      mergedApiNames.add(apiName);
    }
    overlayWishlistNodes(node.children[key], childPrefix, rowsByName, mergedApiNames);
  });
};

const traverse = (api, callback, prefix = '') => {
  if (!api) return;
  if (api.children) {
    for (const [key, child] of Object.entries(api.children)) {
      traverse(child, callback, `${prefix}.${key}`);
    }
  }
  callback(api, prefix);
};

/**
 *
 * @param {string} modelId
 */
const computeVSSApi = async (modelId, { raw = false } = {}) => {
  const model = await Model.findById(modelId);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }
  let ret = null;

  const mainApi = model.main_api || 'Vehicle';
  const apiVersion = model.api_version;
  if (model.custom_vss) {
    ret = _.cloneDeep(model.custom_vss);
  } else if (!apiVersion) {
    ret = {
      [mainApi]: {
        description: mainApi,
        type: 'branch',
        children: {},
      },
    };
  } else {
    ret = await getVSSVersion(apiVersion);
  }

  const extendedApis = await ExtendedApi.find({
    model: modelId,
  });
  const mergedApiNames = new Set();
  if (model.custom_vss && ret[mainApi]) {
    const rowsByName = new Map(extendedApis.map((extendedApi) => [extendedApi.apiName, extendedApi.toJSON()]));
    overlayWishlistNodes(ret[mainApi], mainApi, rowsByName, mergedApiNames);
  }
  extendedApis.forEach((extendedApi) => {
    if (mergedApiNames.has(extendedApi.apiName)) return;
    try {
      const name = extendedApi.apiName.split('.').slice(1).join('.');
      if (!name) return;

      // Only add the extended API if it doesn't exist in the current CVI
      const keys = name.split('.');
      let current = ret[mainApi];
      const exists = keys.every((key) => {
        if (!current.children || !Object.prototype.hasOwnProperty.call(current.children, key)) return false;
        current = current.children[key];
        return true;
      });
      if (exists) return;

      const jsonExtendedApi = extendedApi.toJSON();
      delete jsonExtendedApi._id;
      delete jsonExtendedApi.tags;
      delete jsonExtendedApi.skeleton;
      delete jsonExtendedApi.model;
      delete jsonExtendedApi.created_at;
      const parentNode = ensureParentApiHierarchy(ret[mainApi], keys.slice(0, -1).join('.'));
      Object.defineProperty(parentNode.children, keys.at(-1), {
        value: jsonExtendedApi,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } catch (error) {
      logger.warn(`Error while processing extended API ${extendedApi._id} with name ${extendedApi.apiName}: ${error}`);
    }
  });

  if (raw) return ret;

  try {
    ret[mainApi].children = sortObject(ret[mainApi].children);
  } catch (error) {
    logger.warn(`Error while sorting object: ${error}`);
  }

  // Refine tree
  traverse(
    ret[mainApi],
    (node, prefix) => {
      // Delete empty children
      if (_.isEmpty(node.children)) {
        delete node.children;
      }
      // Ensure name and id
      if (!node.name) {
        node.name = prefix;
      }
      if (!node.id) {
        node.id = crypto.randomBytes(12).toString('hex');
      }
      if (!node.description) {
        node.description = 'nan';
      }
      // Ensure datatype
      if (node.type === 'branch') {
        delete node.datatype;
      } else if (!node.datatype) {
        node.datatype = 'string';
      }
    },
    mainApi,
  );

  return ret;
};

const getApiDetail = async (modelId, apiName) => {
  const tree = await computeVSSApi(modelId);

  const mainApi = Object.keys(tree)[0] || 'Vehicle';
  let ret = null;

  traverse(
    tree[mainApi],
    (api, prefix) => {
      if (prefix === apiName || api?.name === apiName || api?.apiName === apiName) {
        ret = api;
      }
    },
    mainApi,
  );

  return ret;
};

module.exports.createApi = createApi;
module.exports.getApi = getApi;
module.exports.getApiByModelId = getApiByModelId;
module.exports.updateApi = updateApi;
module.exports.deleteApi = deleteApi;
module.exports.listVSSVersions = listVSSVersions;
module.exports.getVSSVersion = getVSSVersion;
module.exports.computeVSSApi = computeVSSApi;
module.exports.parseCvi = parseCvi;
module.exports.getUsedApis = getUsedApis;
module.exports.getApiDetail = getApiDetail;
module.exports.traverse = traverse;
