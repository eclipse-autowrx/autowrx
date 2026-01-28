// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const giteaService = require('./gitea.service');
const { Model, User, UserRole } = require('../models');
const logger = require('../config/logger');

/**
 * Sync Gitea organization when model is created
 * @param {string} modelId - Model ID
 */
const syncModelToGitea = async (modelId) => {
  try {
    const model = await Model.findById(modelId);
    if (!model) {
      logger.warn(`Model ${modelId} not found for Gitea sync`);
      return;
    }

    const orgName = await giteaService.ensureOrganizationExists(modelId, model.name);
    
    // Update model with org name if not set
    if (!model.gitea_org_name) {
      model.gitea_org_name = orgName;
      await model.save();
    }

    logger.info(`Synced model ${modelId} to Gitea organization ${orgName}`);
  } catch (error) {
    logger.error(`Failed to sync model to Gitea: ${error.message}`);
    // Don't throw - this is a background sync operation
  }
};

/**
 * Sync Gitea repository when prototype is created
 * @param {string} prototypeId - Prototype ID
 */
const syncPrototypeToGitea = async (prototypeId) => {
  try {
    const { Prototype } = require('../models');
    const prototype = await Prototype.findById(prototypeId).populate('model_id');
    if (!prototype) {
      logger.warn(`Prototype ${prototypeId} not found for Gitea sync`);
      return;
    }

    const model = await Model.findById(prototype.model_id);
    if (!model) {
      logger.warn(`Model ${prototype.model_id} not found for Gitea sync`);
      return;
    }

    // Ensure model org exists first
    const orgName = model.gitea_org_name || await giteaService.sanitizeOrgName(model._id.toString(), model.name);
    if (!model.gitea_org_name) {
      await syncModelToGitea(model._id.toString());
      await model.reload();
    }

    // Check if repository needs to be created (check BEFORE creating)
    const repoJustCreated = !prototype.gitea_repo_url;
    logger.info(`[syncPrototypeToGitea] Starting for prototype ${prototypeId}, repoJustCreated=${repoJustCreated}, gitea_repo_url=${prototype.gitea_repo_url || 'null'}`);
    
    // Create repository and check if it was just created
    const repoResult = await giteaService.ensureRepositoryExists(orgName, prototype.name, prototypeId);
    const repoWasCreated = repoResult && repoResult._wasCreated === true;
    logger.info(`[syncPrototypeToGitea] Repository check: repoWasCreated=${repoWasCreated}, repoResult._wasCreated=${repoResult?._wasCreated}`);
    
    // Update prototype with repo URL
    const repoUrl = giteaService.getRepositoryUrl(orgName, prototype.name);
    if (!prototype.gitea_repo_url) {
      prototype.gitea_repo_url = repoUrl;
      await prototype.save();
      logger.info(`[syncPrototypeToGitea] Updated prototype with repo URL: ${repoUrl}`);
    }

    // Initialize repository with default Python project structure if it was just created
    // Check both conditions: repoJustCreated (prototype didn't have URL) OR repoWasCreated (repo didn't exist)
    const shouldInitialize = repoJustCreated || repoWasCreated;
    logger.info(`[syncPrototypeToGitea] Initialization check: shouldInitialize=${shouldInitialize} (repoJustCreated=${repoJustCreated}, repoWasCreated=${repoWasCreated})`);
    
    if (shouldInitialize) {
      logger.info(`[syncPrototypeToGitea] Repository ${orgName}/${prototype.name} was just created, initializing with default Python project files`);
      // Wait a moment for repository to be fully initialized by Gitea
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      try {
        logger.info(`[syncPrototypeToGitea] Calling initializeRepository for ${orgName}/${prototype.name}`);
        await giteaService.initializeRepository(orgName, prototype.name);
        logger.info(`[syncPrototypeToGitea] ✓ Repository initialization completed for ${orgName}/${prototype.name}`);
      } catch (initError) {
        logger.error(`[syncPrototypeToGitea] ✗ Repository initialization failed for ${orgName}/${prototype.name}: ${initError.message}`);
        logger.error(`[syncPrototypeToGitea] Init error stack: ${initError.stack}`);
        // Don't throw - continue even if initialization fails
      }
    } else {
      logger.info(`[syncPrototypeToGitea] Repository ${orgName}/${prototype.name} already exists and has URL, skipping initialization`);
    }

    logger.info(`Synced prototype ${prototypeId} to Gitea repository ${orgName}/${prototype.name}`);
  } catch (error) {
    logger.error(`Failed to sync prototype to Gitea: ${error.message}`);
    // Don't throw - this is a background sync operation
  }
};

/**
 * Sync user permissions to Gitea teams
 * @param {string} userId - User ID
 * @param {string} modelId - Model ID
 * @param {string} roleRef - Role reference (model_contributor, model_member, etc.)
 */
const syncUserPermissionToGitea = async (userId, modelId, roleRef) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User ${userId} not found for Gitea sync`);
      return;
    }

    const model = await Model.findById(modelId);
    if (!model) {
      logger.warn(`Model ${modelId} not found for Gitea sync`);
      return;
    }

    const orgName = model.gitea_org_name;
    if (!orgName) {
      // Model org not created yet, create it
      await syncModelToGitea(modelId);
      await model.reload();
    }

    const giteaUsername = user.coder_username || `user-${userId.toString().slice(-12)}`;
    
    // Ensure Gitea user exists
    await giteaService.ensureUserExists(giteaUsername, user.email);

    // Sync permissions
    await giteaService.syncUserPermissions(orgName, giteaUsername, roleRef);

    logger.info(`Synced user ${userId} permission to Gitea team in ${orgName}`);
  } catch (error) {
    logger.error(`Failed to sync user permission to Gitea: ${error.message}`);
    // Don't throw - this is a background sync operation
  }
};

/**
 * Remove user from Gitea teams when permission is removed
 * @param {string} userId - User ID
 * @param {string} modelId - Model ID
 */
const removeUserPermissionFromGitea = async (userId, modelId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return;
    }

    const model = await Model.findById(modelId);
    if (!model || !model.gitea_org_name) {
      return;
    }

    const giteaUsername = user.coder_username || `user-${userId.toString().slice(-12)}`;
    
    // Get organization teams
    const axios = require('axios');
    const config = require('../config/config');
    const GITEA_API_BASE = `${config.gitea.url}/api/v1`;

    const getAuthHeaders = () => {
      if (config.gitea.adminToken) {
        return {
          Authorization: `token ${config.gitea.adminToken}`,
          'Content-Type': 'application/json',
        };
      }
      const credentials = Buffer.from(`${config.gitea.adminUsername}:${config.gitea.adminPassword}`).toString('base64');
      return {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      };
    };

    const teamsResponse = await axios.get(`${GITEA_API_BASE}/orgs/${model.gitea_org_name}/teams`, {
      headers: getAuthHeaders(),
    });

    const teams = teamsResponse.data || [];

    // Remove user from all teams
    for (const team of teams) {
      try {
        await axios.delete(`${GITEA_API_BASE}/teams/${team.id}/members/${giteaUsername}`, {
          headers: getAuthHeaders(),
        });
        logger.info(`Removed user ${giteaUsername} from team ${team.name} in org ${model.gitea_org_name}`);
      } catch (error) {
        if (error.response?.status !== 404) {
          logger.error(`Failed to remove user from team: ${error.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Failed to remove user permission from Gitea: ${error.message}`);
    // Don't throw - this is a background sync operation
  }
};

/**
 * Lazy sync - check and sync permissions when accessing workspace
 * @param {string} userId - User ID
 * @param {string} modelId - Model ID
 */
const lazySyncUserPermissions = async (userId, modelId) => {
  try {
    const userRoles = await UserRole.find({ user: userId, ref: modelId }).populate('role');
    
    if (userRoles.length === 0) {
      // User has no permissions, skip sync
      return;
    }

    // Get the primary role (prefer contributor over member)
    const contributorRole = userRoles.find((ur) => ur.role?.ref === 'model_contributor' || ur.role?.name === 'model_contributor');
    const roleRef = contributorRole?.role?.ref || userRoles[0]?.role?.ref || 'model_member';

    await syncUserPermissionToGitea(userId, modelId, roleRef);
  } catch (error) {
    logger.error(`Failed to lazy sync user permissions: ${error.message}`);
    // Don't throw - this is a background sync operation
  }
};

module.exports = {
  syncModelToGitea,
  syncPrototypeToGitea,
  syncUserPermissionToGitea,
  removeUserPermissionFromGitea,
  lazySyncUserPermissions,
};
