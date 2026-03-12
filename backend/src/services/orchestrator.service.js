// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const coderService = require('./coder.service');
const giteaService = require('./gitea.service');
const permissionSyncService = require('./permissionSync.service');
const config = require('../config/config');
const { Prototype, Model, User } = require('../models');
const { UserRole } = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const { decrypt } = require('../utils/encryption');

/**
 * Prepare workspace for a prototype - complete orchestration flow
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace info with URL and session token
 */
const prepareWorkspaceForPrototype = async (userId, prototypeId) => {
  try {
    // 1. Get prototype and model data
    const prototype = await Prototype.findById(prototypeId).populate('model_id');
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    const model = await Model.findById(prototype.model_id);
    if (!model) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // 2. Ensure Gitea organization exists (from model)
    const orgName = model.gitea_org_name || giteaService.sanitizeOrgName(model._id.toString(), model.name);
    if (!model.gitea_org_name) {
      await giteaService.ensureOrganizationExists(model._id.toString(), model.name);
      // Update model with org name
      model.gitea_org_name = orgName;
      await model.save();
    } else {
      // Verify org still exists
      await giteaService.ensureOrganizationExists(model._id.toString(), model.name);
    }

    // 3. Ensure Gitea repository exists (from prototype)
    const repoName = prototype.name;
    const repoUrl = prototype.gitea_repo_url || giteaService.getRepositoryUrl(orgName, repoName);
    
    // Check if repository was just created (we need to initialize it)
    const repoJustCreated = !prototype.gitea_repo_url;
    
    if (repoJustCreated) {
      logger.info(`Creating new repository ${orgName}/${repoName} for prototype ${prototypeId}`);
      await giteaService.ensureRepositoryExists(orgName, repoName, prototypeId);
      
      // Wait a moment for repository to be fully initialized by Gitea
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Initialize with default Python Multiple Files project structure
      // (This will use the default structure from sampleProjects.ts)
      logger.info(`Initializing repository ${orgName}/${repoName} with default Python project files`);
      try {
        await giteaService.initializeRepository(orgName, repoName);
        logger.info(`✓ Repository initialization completed for ${orgName}/${repoName}`);
      } catch (initError) {
        logger.error(`✗ Repository initialization failed for ${orgName}/${repoName}: ${initError.message}`);
        logger.error(`Init error stack: ${initError.stack}`);
        // Don't throw - continue even if initialization fails
      }

      // Update prototype with repo URL
      prototype.gitea_repo_url = repoUrl;
      await prototype.save();
    } else {
      // Repository already exists, just verify it
      logger.info(`Repository ${orgName}/${repoName} already exists, verifying...`);
      await giteaService.ensureRepositoryExists(orgName, repoName, prototypeId);
    }

    // Get container-accessible URL with authentication for private repos
    // Use Gitea admin credentials for workspace access
    const giteaAdminUsername = config.gitea.adminUsername;
    const giteaAdminToken = config.gitea.adminToken || config.gitea.adminPassword;
    const containerRepoUrl = giteaService.getRepositoryUrlForContainer(
      orgName, 
      repoName, 
      giteaAdminUsername, 
      giteaAdminToken
    );

    // 4. Sync user permissions to Gitea (lazy sync)
    await permissionSyncService.lazySyncUserPermissions(userId, model._id.toString());
    
    const userRoles = await UserRole.find({ user: userId, ref: model._id }).populate('role');
    const giteaUsername = user.coder_username || `user-${userId.toString().slice(-12)}`;
    
    // Ensure Gitea user exists
    await giteaService.ensureUserExists(giteaUsername, user.email);

    // Sync permissions based on roles
    for (const userRole of userRoles) {
      const roleName = userRole.role?.ref || userRole.role?.name || 'model_member';
      await giteaService.syncUserPermissions(orgName, giteaUsername, roleName);
    }

    // 5. Ensure Coder user exists
    const coderUsername = user.coder_username || giteaUsername;
    if (!user.coder_username) {
      user.coder_username = coderUsername;
      await user.save();
    }

    const coderUser = await coderService.ensureUserExists(userId, coderUsername, user.email);

    // 6. Get or create Coder workspace
    // Use sanitized workspace name (Coder requires 1-32 chars, alphanumeric + hyphens only)
    const workspaceName = coderService.sanitizeWorkspaceName(prototypeId);
    const templateId = await coderService.getTemplateId('docker-template');
    
    // Get GitHub token if user has one (optional, decrypt if encrypted)
    let githubToken = null;
    if (user.github_token) {
      try {
        // Try to decrypt (if it's encrypted) or use as-is
        githubToken = decrypt(user.github_token);
      } catch (error) {
        // If decryption fails, assume it's stored in plain text (for backward compatibility)
        githubToken = user.github_token;
      }
    }

    let workspace = prototype.coder_workspace_id
      ? await coderService.getWorkspaceStatus(prototype.coder_workspace_id).catch(() => null)
      : null;

    if (!workspace || workspace.latest_build?.status !== 'running') {
      workspace = await coderService.getOrCreateWorkspace(
        coderUser.id,
        workspaceName,
        templateId,
        containerRepoUrl, // Use container-accessible URL with authentication
        githubToken
      );

      // Update prototype with workspace info
      prototype.coder_workspace_id = workspace.id;
      prototype.coder_workspace_name = workspaceName;
      await prototype.save();
    }

    // 7. Start workspace if stopped (or refresh status if build is in progress)
    const currentStatus = workspace.latest_build?.status;
    if (currentStatus !== 'running') {
      // startWorkspace will handle the case where a build is already active
      const updatedWorkspace = await coderService.startWorkspace(workspace.id);
      workspace = updatedWorkspace;
      
      // If workspace is starting, wait a bit
      if (workspace.latest_build?.status === 'starting') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 8. Get workspace app URL
    // In some cases the workspace may be running but the agent/app is not yet
    // fully initialized. In that case getWorkspaceAppUrl can return a 404
    // ("Workspace agent not found"). We don't want to fail the whole prepare
    // flow just because the app URL is not ready yet – the frontend can keep
    // polling until the URL becomes available.
    let appUrl = null;
    try {
      appUrl = await coderService.getWorkspaceAppUrl(workspace.id, 'code-server');
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === httpStatus.NOT_FOUND) {
        logger.warn(
          `Workspace app URL not ready yet for workspace ${workspace.id}: ${error.message}. ` +
            'Continuing without app URL so the frontend can poll until it is available.'
        );
        appUrl = null;
      } else {
        throw error;
      }
    }

    // 9. Generate session token for user
    const sessionToken = await coderService.generateSessionToken(coderUsername);

    logger.info(`Workspace prepared for prototype ${prototypeId}: ${workspace.id}`);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: workspace.latest_build?.status || 'unknown',
      appUrl,
      sessionToken,
      repoUrl: repoUrl, // Return the external URL for display
    };
  } catch (error) {
    logger.error(`Failed to prepare workspace for prototype: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to prepare workspace: ${error.message}`);
  }
};

/**
 * Get workspace status for a prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace status
 */
const getWorkspaceStatus = async (userId, prototypeId) => {
  try {
    const prototype = await Prototype.findById(prototypeId);
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    if (!prototype.coder_workspace_id) {
      return {
        exists: false,
        status: 'not_created',
      };
    }

    const workspace = await coderService.getWorkspaceStatus(prototype.coder_workspace_id);

    return {
      exists: true,
      workspaceId: workspace.id,
      status: workspace.latest_build?.status || 'unknown',
      transition: workspace.latest_build?.transition || null,
    };
  } catch (error) {
    logger.error(`Failed to get workspace status: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace status: ${error.message}`);
  }
};

/**
 * Get workspace timings for a prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace build timings
 */
const getWorkspaceTimings = async (userId, prototypeId) => {
  try {
    const prototype = await Prototype.findById(prototypeId);
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    if (!prototype.coder_workspace_id) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Workspace not found for this prototype. Create and start the workspace first.',
      );
    }

    const timings = await coderService.getWorkspaceTimings(prototype.coder_workspace_id);
    return timings;
  } catch (error) {
    logger.error(`Failed to get workspace timings: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace timings: ${error.message}`);
  }
};

module.exports = {
  prepareWorkspaceForPrototype,
  getWorkspaceStatus,
  getWorkspaceTimings,
};
