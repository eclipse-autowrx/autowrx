// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { modelService, apiService, permissionService, extendedApiService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const { PERMISSIONS } = require('../config/roles');
const logger = require('../config/logger');
const ModelTemplate = require('../models/modelTemplate.model');
const { Model, ExtendedApi } = require('../models');
const config = require('../config/config');
const syncService = require('../sync');
const { maskUserEmail } = require('../utils/maskEmail');
const { publiclyVisibleVisibilities } = require('../config/enums');

const listAllModels = catchAsync(async (req, res) => {
  const options = pick(req.query, ['fields']);

  const ownedModels = req.user?.id
    ? await modelService.queryModels(
        { created_by: req.user?.id },
        { ...options, limit: config.constraints.defaultPageSize, page: 1 },
        {},
        req.user?.id,
      )
    : { results: [] };

  const contributedModels = req.user?.id
    ? await modelService.queryModels(
        {},
        { ...options, limit: config.constraints.defaultPageSize, page: 1 },
        { is_contributor: req.user?.id },
        req.user?.id,
      )
    : { results: [] };

  const publicReleasedModels = await modelService.queryModels(
    { visibility: { $in: publiclyVisibleVisibilities }, state: 'released' },
    { ...options, limit: config.constraints.defaultPageSize, page: 1 },
    {},
    req.user?.id,
  );

  if (options.fields) {
    return res.status(200).send({
      ownedModels: { results: ownedModels.results },
      contributedModels: { results: contributedModels.results },
      publicReleasedModels: { results: publicReleasedModels.results },
    });
  }

  const cacheResult = new Map();
  const processStats = async (model) => {
    if (!model) return;
    const doc = model;
    const modelId = doc._id || doc.id;
    if (cacheResult.has(modelId)) {
      doc.stats = cacheResult.get(modelId);
      return;
    }
    const stats = await modelService.getModelStats(doc);
    doc.stats = stats;
    cacheResult.set(modelId, stats);
  };

  const allModels = [...ownedModels.results, ...contributedModels.results, ...publicReleasedModels.results];
  await Promise.all(allModels.map((model) => processStats(model)));

  return res.status(200).send({
    ownedModels: { results: ownedModels.results },
    contributedModels: { results: contributedModels.results },
    publicReleasedModels: { results: publicReleasedModels.results },
  });
});

const createModel = catchAsync(async (req, res) => {
  const { cvi, custom_apis, api_data_url, extended_apis: initialExtendedApis, ...reqBody } = req.body;
  let extended_apis = initialExtendedApis;

  if (api_data_url) {
    const result = await modelService.processApiDataUrl(api_data_url);
    if (result) {
      extended_apis = result.extended_apis;
      reqBody.api_version = result.api_version;
      reqBody.main_api = result.main_api;
    }
  }

  const modelId = await syncService.runWithSkipSync(async () => {
    const createdModelId = await modelService.createModel(req.user.id, {
      ...reqBody,
    });

    try {
      if (extended_apis) {
        await Promise.all(
          extended_apis.map((api) =>
            extendedApiService.createExtendedApi({
              ...api,
              model: createdModelId,
              isWishlist: api.isWishlist || false,
            }),
          ),
        );
      }
    } catch (error) {
      logger.warn(`Error in creating model (creating extended_apis): ${error}`);
    }

    try {
      if (custom_apis) {
        let apis = custom_apis;
        try {
          apis = JSON.parse(custom_apis);
        } catch (error) {
          // Do nothing
        }

        if (Array.isArray(apis)) {
          await Promise.all(
            apis.map((api) =>
              extendedApiService.createExtendedApi({
                model: createdModelId,
                apiName: api.name || api.apiName || 'Vehicle',
                description: api.description || '',
                skeleton: api.skeleton || '{}',
                tags: api.tags || [],
                type: api.type || 'branch',
                datatype: api.datatype || (api.type !== 'branch' ? 'string' : null),
                isWishlist: api.isWishlist || false,
                unit: api.unit,
              }),
            ),
          );
        }
      }
    } catch (error) {
      logger.warn(`Error in creating model (creating extended_apis): ${error}`);
    }

    return createdModelId;
  });

  const model = await Model.findById(modelId);
  if (!model) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Model not found after create');
  }

  const hasApiList = (value) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === 'Empty') return false;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.length > 0;
      } catch (_err) {
        // Non-JSON string — treat as present payload
      }
      return true;
    }
    return Boolean(value);
  };
  // [] is truthy in JS — do not treat empty arrays as bulk replace.
  const hasExtendedApis = hasApiList(extended_apis) || hasApiList(custom_apis);
  const modelSnapshot = model.toObject();

  if (hasExtendedApis) {
    const extendedApisAfter = await ExtendedApi.find({ model: modelId }).lean();
    await syncService.triggerSync({
      action: 'BULK_REPLACE',
      resourceType: 'ExtendedApi',
      resourceId: String(modelId),
      modelId: String(modelId),
      document: { model: modelSnapshot, extendedApis: extendedApisAfter },
      changes: { previousModel: null, previousExtendedApis: [] },
      userId: req.user?.id,
    });
  } else {
    await syncService.triggerSync({
      action: 'CREATE',
      resourceType: 'Model',
      resourceId: String(modelId),
      modelId: String(modelId),
      document: modelSnapshot,
      userId: req.user?.id,
    });
  }

  res.status(httpStatus.CREATED).send(model);
});

const listModels = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'name',
    'visibility',
    'state',
    'tenant_id',
    'vehicle_category',
    'main_api',
    'id',
    'created_by',
  ]);
  if (Array.isArray(filter.visibility)) {
    filter.visibility = { $in: filter.visibility };
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const includeStats = req.query.include_stats;
  if (typeof options.limit === 'undefined') {
    options.limit = config.constraints.defaultPageSize;
  }
  const advanced = pick(req.query, ['is_contributor']);
  const models = await modelService.queryModels(filter, options, advanced, req.user?.id);

  if (includeStats && Array.isArray(models.results) && models.results.length > 0) {
    const statsById = await modelService.getModelStatsSummaryByIds(models.results);
    models.results = models.results.map((model) => ({
      ...model,
      stats: statsById[String(model.id)] || undefined,
    }));
  }

  res.json(models);
});

const listModelStatsByIds = catchAsync(async (req, res) => {
  const ids = req.body?.ids || [];
  const requestedIds = Array.isArray(ids) ? ids : [];

  if (requestedIds.length === 0) {
    return res.json({ statsById: {} });
  }

  const userId = req.user?.id;
  let allowedIds = requestedIds;

  // Fast path for anonymous/public-only.
  if (!userId) {
    const publicModels = await Model.find({
      _id: { $in: requestedIds },
      visibility: { $in: publiclyVisibleVisibilities },
    }).select('_id');
    const publicIds = new Set(publicModels.map((m) => String(m._id)));
    allowedIds = requestedIds.filter((id) => publicIds.has(String(id)));
  } else {
    const readable = await permissionService.listReadableModelIds(userId);
    if (readable !== '*') {
      const readableSet = new Set((readable || []).map((id) => String(id)));
      allowedIds = requestedIds.filter((id) => readableSet.has(String(id)));
    }
  }

  if (allowedIds.length === 0) {
    return res.json({ statsById: {} });
  }

  const statsById = await modelService.getModelStatsSummaryByIds(allowedIds);
  return res.json({ statsById });
});

const getModel = catchAsync(async (req, res) => {
  const hasWritePermission = await permissionService.hasPermission(req.user?.id, PERMISSIONS.WRITE_MODEL, req.params.id);

  const model = await modelService.getModelById(req.params.id, req.user?.id, hasWritePermission);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }

  const finalResult = model.toJSON();

  // If model has model_template_id, populate custom_template from template
  // Only if model.custom_template is null/undefined (owner hasn't customized it yet)
  if (model.model_template_id && !model.custom_template) {
    try {
      const template = await ModelTemplate.findById(model.model_template_id);
      if (template && template.config) {
        // Use template's config as custom_template only if model doesn't have one
        finalResult.custom_template = template.config;
      }
    } catch (error) {
      logger.warn(`Error fetching template for model ${req.params.id}: ${error.message}`);
      // Continue without template if there's an error
    }
  }

  if (hasWritePermission) {
    const contributors = await permissionService.listAuthorizedUser({
      role: 'model_contributor',
      ref: req.params.id,
    });
    const members = await permissionService.listAuthorizedUser({
      role: 'model_member',
      ref: req.params.id,
    });
    finalResult.contributors = contributors.map(maskUserEmail);
    finalResult.members = members.map(maskUserEmail);

    if (finalResult.created_by) {
      finalResult.created_by = maskUserEmail(finalResult.created_by);
    }
  }
  res.send(finalResult);
});

const updateModel = catchAsync(async (req, res) => {
  const model = await modelService.updateModelById(
    req.params.id,
    {
      ...req.body,
      ...(req.body.custom_apis && { custom_apis: JSON.parse(req.body.custom_apis) }),
    },
    req.user.id,
  );
  res.send(model);
});

const deleteModel = catchAsync(async (req, res) => {
  await modelService.deleteModelById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const addAuthorizedUser = catchAsync(async (req, res) => {
  const userIds = req.body.userId?.split(',');
  const promises = userIds.map((userId) =>
    modelService.addAuthorizedUser(req.params.id, { userId, role: req.body.role }, req.user.id),
  );
  await Promise.all(promises).catch((err) => {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  });
  res.status(httpStatus.CREATED).send();
});

const deleteAuthorizedUser = catchAsync(async (req, res) => {
  await modelService.deleteAuthorizedUser(
    req.params.id,
    {
      role: req.query.role,
      userId: req.query.userId,
    },
    req.user.id,
  );
  res.status(httpStatus.NO_CONTENT).send();
});

const getComputedVSSApi = catchAsync(async (req, res) => {
  if (!(await permissionService.canAccessModel(req.user?.id, req.params.id))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const data = await apiService.computeVSSApi(req.params.id);
  res.send(data);
});

const getApiDetail = catchAsync(async (req, res) => {
  if (!(await permissionService.canAccessModel(req.user?.id, req.params.id))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const api = await apiService.getApiDetail(req.params.id, req.params.apiName);
  if (!api) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Api not found');
  }
  res.send(api);
});

const replaceApi = catchAsync(async (req, res) => {
  const modelId = req.params.id;
  const apiDataUrl = req.body.api_data_url;

  if (!apiDataUrl) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'api_data_url is required');
  }

  logger.info(`Replacing API for model ${modelId} with URL: ${apiDataUrl}`);

  let extended_apis;
  let api_version;
  let main_api;
  try {
    const result = await modelService.processApiDataUrl(apiDataUrl);
    extended_apis = result.extended_apis;
    api_version = result.api_version;
    main_api = result.main_api;
  } catch (error) {
    logger.error(`Error processing API data URL: ${error.message}`);
    logger.error(error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to process API data: ${error.message || 'Invalid API data URL or file format'}`,
    );
  }

  const updateBody = {
    custom_apis: [], // Remove all custom_apis
    main_api,
    api_version: null,
  };
  if (api_version) {
    updateBody.api_version = api_version;
  }

  // Validate extended_apis
  if (Array.isArray(extended_apis)) {
    const validated = await Promise.all(
      extended_apis.map(async (extendedApi) => {
        const validationError = await extendedApiService.validateExtendedApi({
          ...extendedApi,
          model: modelId,
        });
        return { extendedApi, validationError };
      }),
    );
    const firstInvalid = validated.find((r) => r.validationError);
    if (firstInvalid) {
      const { validationError: error, extendedApi } = firstInvalid;
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Error in validating extended API ${extendedApi.name || extendedApi.apiName} - ${error.details.join(', ')}`,
      );
    }
  }

  const modelBefore = await Model.findById(modelId).lean();
  const extendedApisBefore = await ExtendedApi.find({ model: modelId }).lean();

  await syncService.runWithSkipSync(async () => {
    await modelService.updateModelById(modelId, updateBody, req.user?.id);
    await extendedApiService.deleteExtendedApisByModelId(modelId);

    await Promise.all(
      (extended_apis || []).map((api) =>
        extendedApiService.createExtendedApi({
          ...api,
          model: modelId,
          isWishlist: api.isWishlist || false,
        }),
      ),
    );
  });

  const modelAfter = await Model.findById(modelId).lean();
  const extendedApisAfter = await ExtendedApi.find({ model: modelId }).lean();

  await syncService.triggerSync({
    action: 'BULK_REPLACE',
    resourceType: 'ExtendedApi',
    resourceId: modelId,
    modelId,
    document: { model: modelAfter, extendedApis: extendedApisAfter },
    changes: { previousModel: modelBefore, previousExtendedApis: extendedApisBefore },
    userId: req.user?.id,
  });

  res.status(httpStatus.OK).send();
});

module.exports = {
  createModel,
  listModels,
  getModel,
  updateModel,
  deleteModel,
  addAuthorizedUser,
  deleteAuthorizedUser,
  getComputedVSSApi,
  listAllModels,
  listModelStatsByIds,
  getApiDetail,
  replaceApi,
};
