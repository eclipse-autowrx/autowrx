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

const createModel = catchAsync(async (req, res) => {
  let { cvi, custom_apis, extended_apis, api_data_url, ...reqBody } = req.body;

  if (api_data_url) {
    const result = await modelService.processApiDataUrl(api_data_url);
    if (result) {
      extended_apis = result.extended_apis;
      reqBody.api_version = result.api_version;
      reqBody.main_api = result.main_api;
    }
  }

  const model = await modelService.createModel(req.user.id, {
    ...reqBody,
  });

  try {
    if (extended_apis) {
      await Promise.all(
        extended_apis.map((api) =>
          extendedApiService.createExtendedApi({
            ...api,
            model: model._id,
            isWishlist: api.isWishlist || false,
          })
        )
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
              model: model._id,
              apiName: api.name || api.apiName || 'Vehicle',
              description: api.description || '',
              skeleton: api.skeleton || '{}',
              tags: api.tags || [],
              type: api.type || 'branch',
              datatype: api.datatype || (api.type !== 'branch' ? 'string' : null),
              isWishlist: api.isWishlist || false,
              unit: api.unit,
            })
          )
        );
      }
    }
  } catch (error) {
    logger.warn(`Error in creating model (creating extended_apis): ${error}`);
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
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const advanced = pick(req.query, ['is_contributor']);
  const models = await modelService.queryModels(filter, options, advanced, req.user?.id);
  res.json(models);
});

const listAllModels = catchAsync(async (req, res) => {
  const options = pick(req.query, ['fields']);

  const ownedModels = await modelService.queryModels(
    {
      created_by: req.user?.id,
    },
    {
      ...options,
      limit: 1000,
    },
    {},
    req.user?.id
  );

  const contributedModels = req.user?.id
    ? await modelService.queryModels(
        {},
        {
          ...options,
          limit: 1000,
        },
        {
          is_contributor: req.user?.id,
        },
        req.user?.id
      )
    : { results: [] };

  const publicReleasedModels = await modelService.queryModels(
    {
      visibility: 'public',
      state: 'released',
    },
    {
      ...options,
      limit: 1000,
    },
    {},
    req.user?.id
  );

  if (options.fields) {
    return res.status(200).send({
      ownedModels: {
        results: ownedModels.results,
      },
      contributedModels: {
        results: contributedModels.results,
      },
      publicReleasedModels: {
        results: publicReleasedModels.results,
      },
    });
  }

  const cacheResult = new Map();

  const processStats = async (model) => {
    if (!model) {
      throw new Error("Error in processStats: model can't be null");
    }
    const modelId = model._id || model.id;
    if (cacheResult.has(modelId)) {
      model.stats = cacheResult.get(modelId);
      return;
    }
    const stats = await modelService.getModelStats(model);
    model.stats = stats;
    cacheResult.set(modelId, stats);
  };

  // Add stats to each model
  for (const model of ownedModels.results) {
    await processStats(model);
  }
  for (const model of contributedModels.results) {
    await processStats(model);
  }
  for (const model of publicReleasedModels.results) {
    await processStats(model);
  }

  res.status(200).send({
    ownedModels: {
      results: ownedModels.results,
    },
    contributedModels: {
      results: contributedModels.results,
    },
    publicReleasedModels: {
      results: publicReleasedModels.results,
    },
  });
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
    finalResult.contributors = contributors;
    finalResult.members = members;
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
    req.user.id
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
    modelService.addAuthorizedUser(req.params.id, { userId, role: req.body.role }, req.user.id)
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
    req.user.id
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
  const { extended_apis, api_version, main_api } = await modelService.processApiDataUrl(req.body.api_data_url);

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
    for (const extended_api of extended_apis) {
      const error = await extendedApiService.validateExtendedApi({
        ...extended_api,
        model: modelId,
      });
      if (error) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Error in validating extended API ${extended_api.name || extended_api.apiName} - ${error.details.join(', ')}`
        );
      }
    }
  }

  await modelService.updateModelById(modelId, updateBody, req.user?.id);
  await extendedApiService.deleteExtendedApisByModelId(modelId);

  await Promise.all(
    (extended_apis || []).map((api) =>
      extendedApiService.createExtendedApi({
        ...api,
        model: modelId,
        isWishlist: api.isWishlist || false,
      })
    )
  );

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
  getApiDetail,
  replaceApi,
};
