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
const { Prototype } = require('../models');
const ApiError = require('../utils/ApiError');
const permissionService = require('./permission.service');
const { PERMISSIONS } = require('../config/roles');
const { default: axios, isAxiosError } = require('axios');
const coderConfig = require('../utils/coderConfig');
const logger = require('../config/logger');
const modelService = require('./model.service');
const apiService = require('./api.service');
const { sanitizePrototypeFolderName } = require('../utils/prototypePath');
const _ = require('lodash');

/**
 * Strip trailing number suffix from a prototype name.
 * e.g. "test_2" → "test", "test" → "test"
 * @param {string} name
 * @returns {string}
 */
const stripTrailingNumber = (name) => {
  return name.replace(/_\d+$/, '');
};

const IGNORED_DIRS = new Set(['.git', '.svn', '.hg', 'node_modules', '__pycache__', '.venv', 'venv']);
const ALLOWED_TEXT_EXTENSIONS = new Set([
  '.py',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.ini',
  '.sh',
  '.bash',
  '.zsh',
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.java',
  '.go',
  '.rs',
  '.sql',
  '.xml',
  '.html',
  '.css',
  '.md',
  '.txt',
  '.csv',
  '.log',
  '.makefile',
  '.cmake',
  'makefile',
  'cmakelists.txt',
  'dockerfile',
  '.dockerignore',
  '.gitignore',
  '.prettierrc',
  '.eslintrc',
  '.editorconfig',
  '.bashrc',
  '.profile',
  '.bash_profile',
  '.cfg',
  '.conf',
  '.cmake.in',
]);
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB/file
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5MB total scan budget

const SECRET_LIKE_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.development',
  '.env.test',
  '.env.production',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'credentials',
  'credentials.json',
  'credential.json',
  'secrets',
  'secrets.json',
  'secret',
  'secret.json',
  'token',
  'tokens.json',
  'access_token',
  'refresh_token',
]);

const SECRET_LIKE_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx']);

const resolvePrototypeFoldersAcrossUsers = (modelId, prototypeName) => {
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const resolvedRoot = path.resolve(prototypesRoot);
  const sanitizedFolderName = sanitizePrototypeFolderName(prototypeName);
  const resolvedModelId = String(modelId || '').trim();

  if (!resolvedModelId || !fs.existsSync(resolvedRoot)) {
    return [];
  }

  let userDirectories = [];
  try {
    userDirectories = fs.readdirSync(resolvedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  } catch (error) {
    logger.warn(`Failed to read prototypes root ${resolvedRoot}: ${error.message}`);
    return [];
  }

  return userDirectories.map((entry) => path.join(resolvedRoot, entry.name, resolvedModelId, sanitizedFolderName));
};

const resolveModelFoldersAcrossUsers = (modelId) => {
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const resolvedRoot = path.resolve(prototypesRoot);
  const resolvedModelId = String(modelId || '').trim();

  if (!resolvedModelId || !fs.existsSync(resolvedRoot)) {
    return [];
  }

  let userDirectories = [];
  try {
    userDirectories = fs.readdirSync(resolvedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  } catch (error) {
    logger.warn(`Failed to read prototypes root ${resolvedRoot}: ${error.message}`);
    return [];
  }

  return userDirectories.map((entry) => path.join(resolvedRoot, entry.name, resolvedModelId));
};

const deleteFolderSafely = (folderPath) => {
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const resolvedRoot = path.resolve(prototypesRoot);
  const resolvedTarget = path.resolve(folderPath);
  const isInsideRoot = resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
  if (!isInsideRoot) {
    logger.warn(`Skipped deleting path outside prototypes root: ${resolvedTarget}`);
    return false;
  }
  if (!fs.existsSync(resolvedTarget)) {
    return false;
  }
  fs.rmSync(resolvedTarget, { recursive: true, force: true });
  return true;
};

const cleanupPrototypeWorkspaceFolders = (modelId, prototypeName) => {
  const targets = resolvePrototypeFoldersAcrossUsers(modelId, prototypeName);
  let deletedCount = 0;
  targets.forEach((folderPath) => {
    try {
      if (deleteFolderSafely(folderPath)) {
        deletedCount += 1;
      }
    } catch (error) {
      logger.warn(`Failed to delete prototype workspace folder ${folderPath}: ${error.message}`);
    }
  });
  return deletedCount;
};

const cleanupModelWorkspaceFolders = (modelId) => {
  const targets = resolveModelFoldersAcrossUsers(modelId);
  let deletedCount = 0;
  targets.forEach((folderPath) => {
    try {
      if (deleteFolderSafely(folderPath)) {
        deletedCount += 1;
      }
    } catch (error) {
      logger.warn(`Failed to delete model workspace folder ${folderPath}: ${error.message}`);
    }
  });
  return deletedCount;
};

const shouldSkipSensitiveFile = (entryName) => {
  const name = String(entryName || '').trim();
  if (!name) return true;
  const lower = name.toLowerCase();
  if (SECRET_LIKE_BASENAMES.has(lower)) return true;
  if (lower.startsWith('.env.')) return true; // .env.*, .envrc, etc.
  const ext = path.extname(lower);
  if (SECRET_LIKE_EXTENSIONS.has(ext)) return true;
  return false;
};

const listTextFilesRecursively = (rootPath) => {
  const stack = [rootPath];
  const files = [];

  while (stack.length > 0) {
    const currentPath = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (error) {
      logger.warn(`Failed to read directory ${currentPath}: ${error.message}`);
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          stack.push(entryPath);
        }
        continue;
      }
      if (!entry.isFile()) continue;
      if (shouldSkipSensitiveFile(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (ext && !ALLOWED_TEXT_EXTENSIONS.has(ext)) continue;
      files.push(entryPath);
    }
  }

  return files;
};

const buildFileSystemTree = (rootPath, currentPath = '') => {
  const absolutePath = path.join(rootPath, currentPath);
  const stats = fs.statSync(absolutePath);

  const name = path.basename(absolutePath);
  const relativePath = currentPath || name;

  if (stats.isDirectory()) {
    const children = fs.readdirSync(absolutePath);
    const items = children
      .filter((child) => !IGNORED_DIRS.has(child))
      .map((child) => buildFileSystemTree(rootPath, path.join(currentPath, child)))
      .filter((item) => item !== null);

    return {
      type: 'folder',
      name: name === 'root' || currentPath === '' ? 'root' : name,
      path: currentPath,
      items,
    };
  }

  if (stats.isFile()) {
    // Skip sensitive files for security
    if (shouldSkipSensitiveFile(name)) return null;

    return {
      type: 'file',
      name,
      path: currentPath,
      content: '', // Do not load content for the tree
    };
  }

  return null;
};

const getPrototypeWorkspaceTree = async (id, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  if (!fs.existsSync(prototypeFolder)) {
    return [{ type: 'folder', name: 'root', items: [], path: '' }];
  }

  const tree = buildFileSystemTree(prototypeFolder);
  return [tree];
};

const getPrototypeFileContent = async (id, filePath, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  const fullPath = path.join(prototypeFolder, filePath);

  // Security check: ensure path is within prototype folder
  const resolvedTarget = path.resolve(fullPath);
  const resolvedRoot = path.resolve(prototypeFolder);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
  }

  if (!fs.existsSync(fullPath)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  return content;
};

const savePrototypeFileContent = async (id, filePath, content, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  const fullPath = path.join(prototypeFolder, filePath);

  // Security check: ensure path is within prototype folder
  const resolvedTarget = path.resolve(fullPath);
  const resolvedRoot = path.resolve(prototypeFolder);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
  }

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  return { success: true };
};

const createPrototypeFolder = async (id, folderPath, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  const fullPath = path.join(prototypeFolder, folderPath);

  // Security check
  const resolvedTarget = path.resolve(fullPath);
  const resolvedRoot = path.resolve(prototypeFolder);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
  }

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return { success: true };
};

const deletePrototypeFileSystemItem = async (id, itemPath, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  const fullPath = path.join(prototypeFolder, itemPath);

  // Security check
  const resolvedTarget = path.resolve(fullPath);
  const resolvedRoot = path.resolve(prototypeFolder);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
  }

  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  return { success: true };
};

const renamePrototypeFileSystemItem = async (id, oldPath, newPath, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototype.name),
  );

  const fullOldPath = path.join(prototypeFolder, oldPath);
  const fullNewPath = path.join(prototypeFolder, newPath);

  // Security check
  const resolvedOldTarget = path.resolve(fullOldPath);
  const resolvedNewTarget = path.resolve(fullNewPath);
  const resolvedRoot = path.resolve(prototypeFolder);
  if (!resolvedOldTarget.startsWith(resolvedRoot) || !resolvedNewTarget.startsWith(resolvedRoot)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
  }

  if (fs.existsSync(fullOldPath)) {
    // Ensure parent directory of new path exists
    const newDir = path.dirname(fullNewPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
    fs.renameSync(fullOldPath, fullNewPath);
  }
  return { success: true };
};

const readPrototypeCodeFromPrototypesPath = (userId, modelId, prototypeName) => {
  const prototypesRoot = coderConfig.getCoderConfigSync().prototypesPath || '/opt/autowrx/prototypes';
  const prototypeFolder = path.join(
    prototypesRoot,
    String(userId),
    String(modelId || ''),
    sanitizePrototypeFolderName(prototypeName),
  );

  if (!fs.existsSync(prototypeFolder)) {
    return {
      code: '',
      folderPath: prototypeFolder,
      source: 'prototypes_path',
    };
  }

  const textFiles = listTextFilesRecursively(prototypeFolder);
  const chunks = [];
  let totalBytes = 0;

  textFiles.forEach((filePath) => {
    if (totalBytes >= MAX_TOTAL_BYTES) return;

    try {
      const fileStat = fs.statSync(filePath);
      if (fileStat.size > MAX_FILE_SIZE_BYTES) return;
      if (totalBytes + fileStat.size > MAX_TOTAL_BYTES) return;

      const content = fs.readFileSync(filePath, 'utf8');
      if (!content || !content.trim()) return;

      const relativePath = path.relative(prototypeFolder, filePath);
      chunks.push(`# FILE: ${relativePath}\n${content}`);
      totalBytes += fileStat.size;
    } catch (error) {
      logger.warn(`Failed reading file ${filePath}: ${error.message}`);
    }
  });

  return {
    code: chunks.join('\n\n'),
    folderPath: prototypeFolder,
    source: 'prototypes_path',
  };
};

/**
 * Generate up to 1 available prototype name suggestion for a model.
 * @param {string} modelId
 * @param {string} baseName
 * @returns {Promise<string[]>}
 */
const getSuggestedNames = async (modelId, baseName) => {
  // Try clean sequential names first (user-friendly)
  for (let counter = 1; counter <= 50; counter++) {
    const candidateName = `${baseName}_${counter}`;
    const exists = await Prototype.existsPrototypeInModel(modelId, candidateName);
    if (!exists) {
      return [candidateName];
    }
  }
  // Fallback: timestamp (guaranteed unique, but unlikely to ever reach here)
  return [`${baseName}_${Date.now()}`];
};

/**
 * Handle duplicate prototype name error with suggestions.
 * @param {string} modelId
 * @param {string} prototypeName
 * @param {string} userId
 * @throws {ApiError}
 */
const throwDuplicateNameError = async (modelId, prototypeName, userId) => {
  const model = await modelService.getModelById(modelId, userId);
  const baseName = stripTrailingNumber(prototypeName);
  const suggestions = await getSuggestedNames(modelId, baseName);
  throw new ApiError(
    httpStatus.BAD_REQUEST,
    `The prototype name '${prototypeName}' is already in use for model '${model.name}'. Please choose another name like: ${suggestions.join(', ')}.`,
  );
};

/**
 *
 * @param {string} userId
 * @param {Object} prototypeBody
 * @returns {Promise<string>}
 */
const createPrototype = async (userId, prototypeBody) => {
  if (await Prototype.existsPrototypeInModel(prototypeBody.model_id, prototypeBody.name)) {
    await throwDuplicateNameError(prototypeBody.model_id, prototypeBody.name, userId);
  }

  if (prototypeBody.extend && typeof prototypeBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(prototypeBody.extend);
      prototypeBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed to parse 'extend' field: ${error}`);
    }
  }

  if (prototypeBody.requirements_data && typeof prototypeBody.requirements_data === 'string') {
    try {
      const parsedRequirementsData = JSON.parse(prototypeBody.requirements_data);
      prototypeBody.requirements_data = parsedRequirementsData;
    } catch (error) {
      logger.warn(`Failed to parse 'requirements_data' field: ${error}`);
    }
  }

  const prototype = await Prototype.create({
    ...prototypeBody,
    created_by: userId,
  });
  return prototype;
};

/**
 *
 * @param {string} userId
 * @param {Object[]} prototypes
 * @returns {Promise<string>}create
 */
const bulkCreatePrototypes = async (userId, prototypes) => {
  for (const prototype of prototypes) {
    if (await Prototype.existsPrototypeInModel(prototype.model_id, prototype.name)) {
      await throwDuplicateNameError(prototype.model_id, prototype.name, userId);
    }
  }

  const data = await Prototype.insertMany(
    prototypes.map((prototype) => ({
      ...prototype,
      created_by: userId,
    })),
  );
  return data.map((item) => item._id);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {fields} [options.fields] - Fields to select
 * @returns {Promise<QueryResult>}
 */
const queryPrototypes = async (filter, options) => {
  const prototypes = await Prototype.paginate(filter, {
    ...options,
    // Default sort by editors_choice and createdAt
    sortBy: options?.sortBy
      ? ['editors_choice:desc,createdAt:asc', options.sortBy].join(',')
      : 'editors_choice:desc,createdAt:asc',
  });
  return prototypes;
};

/**
 *
 * @param {string} id
 * @returns {Promise<import('../models/prototype.model').Prototype>}
 */
const getPrototypeById = async (id, userId) => {
  const prototype = await Prototype.findById(id).populate([
    {
      path: 'created_by',
      select: 'name image_file',
    },
    {
      path: 'model_id',
      select: 'name visibility',
    },
  ]);

  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  if (prototype.model_id.visibility === 'private') {
    if (!(await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, id))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  return prototype;
};

/**
 *
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} actionOwner
 * @returns {Promise<import("../models/prototype.model").Prototype>}
 */
const updatePrototypeById = async (id, updateBody, actionOwner) => {
  const prototype = await Prototype.findById(id);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  if (updateBody.name && (await Prototype.existsPrototypeInModel(prototype.model_id, updateBody.name, id))) {
    await throwDuplicateNameError(prototype.model_id, updateBody.name, actionOwner);
  }

  if (updateBody.extend && typeof updateBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(updateBody.extend);
      updateBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed to parse 'extend' field: ${error}`);
    }
  }

  if (updateBody.requirements_data && typeof updateBody.requirements_data === 'string') {
    try {
      const parsedRequirementsData = JSON.parse(updateBody.requirements_data);
      updateBody.requirements_data = parsedRequirementsData;
    } catch (error) {
      logger.warn(`Failed to parse 'requirements_data' field: ${error}`);
    }
  }

  updateBody.action_owner = actionOwner;
  Object.assign(prototype, updateBody);
  await prototype.save();

  return prototype;
};

/**
 *
 * @param {string} id
 * @param {string} actionOwner
 * @returns {Promise<void>}
 */
const deletePrototypeById = async (id, actionOwner) => {
  const prototype = await Prototype.findById(id);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  cleanupPrototypeWorkspaceFolders(prototype.model_id, prototype.name);
  prototype.action_owner = actionOwner;
  await prototype.deleteOne();
};

/**
 *
 * @param {string} userId
 */
const getRecentCachedPrototypes = async (userId) => {
  /**
   * @type {Array<import('../typedefs/cacheDef').CacheEntity>}
   */
  let recentData = [];
  try {
    recentData = (await axios.get(`${config.services.cache.url}/get-recent-activities/${userId}`)).data;
  } catch (error) {
    if (isAxiosError(error)) {
      logger.error('Error while getting recent prototypes from cache', error.response?.data?.message || error.message);
    } else {
      logger.error('Error while getting recent prototypes from cache', error.message);
    }
  }
  return recentData;
};

/**
 *
 * @param {string} userId
 */
const listRecentPrototypes = async (userId) => {
  const recentData = await getRecentCachedPrototypes(userId);

  // Create map
  const prototypeMap = new Map();
  recentData.forEach((data) => {
    prototypeMap.set(data.referenceId, data);
  });

  const prototypes = await Prototype.find({ _id: { $in: Array.from(prototypeMap.keys()) } })
    .select('name model_id description image_file executed_turns')
    .populate('model', 'name visibility')
    .populate('created_by', 'name image_file');

  const results = [];
  recentData.forEach((data) => {
    const correspondingPrototype = prototypes.find((prototype) => String(prototype._id) === data.referenceId);
    if (correspondingPrototype) {
      results.push({
        ...correspondingPrototype.toJSON(),
        last_visited: data.time,
        last_page: data.page,
      });
    }
  });
  return results;
};

/**
 *
 * @param {string} id
 * @param {Object} [body]
 * @returns {Promise<void>}
 */
const executeCode = async (id, _) => {
  const prototype = await Prototype.findById(id);
  prototype.executed_turns += 1;
  await prototype.save();
};

/**
 *
 * @returns {Promise<import('../typedefs/prototypeDef').Prototype[]>}
 */
const listPopularPrototypes = async () => {
  const publicModelIds = (
    await modelService.getModels({
      visibility: 'public',
    })
  ).map((model) => String(model._id));
  return Prototype.find({
    model_id: { $in: publicModelIds },
    state: 'Released',
  })
    .sort({ executed_turns: -1 })
    .limit(8)
    .select('name model_id description image_file executed_turns')
    .populate('model', 'name visibility')
    .populate('created_by', 'name image_file');
};

/**
 * Read prototype code from the user's prototypes workspace path and compute used APIs.
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<{folderPath: string, source: string, usedApiNames: string[]}>}
 */
const getPrototypeUsedApisFromWorkspace = async (id, userId) => {
  const prototype = await getPrototypeById(id, userId);
  const modelId = prototype.model_id?._id || prototype.model_id?.id || prototype.model_id;
  const codeData = readPrototypeCodeFromPrototypesPath(userId, modelId, prototype.name);

  const cvi = await apiService.computeVSSApi(modelId);
  const apiList = apiService.parseCvi(cvi);
  const usedApiNames = apiService.getUsedApis(codeData.code || '', apiList);

  return {
    folderPath: codeData.folderPath,
    source: codeData.source,
    usedApiNames,
  };
};

/**
 *
 * @param {object} filter
 * @param {string} actionOwner
 */
const deleteMany = async (filter, actionOwner) => {
  if (_.isEmpty(filter)) {
    throw new Error('Filter is required');
  }
  const prototypes = (await Prototype.find(filter)).filter((prototype) => prototype);
  await Promise.all(
    prototypes.map(async (prototype) => {
      cleanupPrototypeWorkspaceFolders(prototype.model_id, prototype.name);
      prototype.action_owner = actionOwner;
      await prototype.deleteOne();
    }),
  );
};

module.exports.createPrototype = createPrototype;
module.exports.queryPrototypes = queryPrototypes;
module.exports.getPrototypeById = getPrototypeById;
module.exports.updatePrototypeById = updatePrototypeById;
module.exports.deletePrototypeById = deletePrototypeById;
module.exports.listRecentPrototypes = listRecentPrototypes;
module.exports.executeCode = executeCode;
module.exports.listPopularPrototypes = listPopularPrototypes;
module.exports.bulkCreatePrototypes = bulkCreatePrototypes;
module.exports.deleteMany = deleteMany;
module.exports.getPrototypeUsedApisFromWorkspace = getPrototypeUsedApisFromWorkspace;
module.exports.cleanupModelWorkspaceFolders = cleanupModelWorkspaceFolders;
module.exports.getPrototypeWorkspaceTree = getPrototypeWorkspaceTree;
module.exports.getPrototypeFileContent = getPrototypeFileContent;
module.exports.savePrototypeFileContent = savePrototypeFileContent;
module.exports.createPrototypeFolder = createPrototypeFolder;
module.exports.deletePrototypeFileSystemItem = deletePrototypeFileSystemItem;
module.exports.renamePrototypeFileSystemItem = renamePrototypeFileSystemItem;
