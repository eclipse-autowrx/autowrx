// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const path = require('path');
const { UserWorkspace } = require('../models');

const normalizePath = (p) => path.resolve(String(p || ''));

const getBindingByUser = async (userId) => {
  if (!userId) return null;
  return UserWorkspace.findOne({ user_id: userId });
};

const getWorkspaceIdForUser = async (user) => {
  if (!user) return null;
  const binding = await getBindingByUser(user.id || user._id);
  if (binding?.workspace_id) {
    return binding.workspace_id;
  }
  // Legacy fallback: read the old user fields and persist a canonical binding.
  if (user.coder_workspace_id) {
    await upsertBinding({
      userId: user.id || user._id,
      workspaceId: user.coder_workspace_id,
      workspaceName: user.coder_workspace_name || null,
      templateName: 'docker-template',
    });
    return user.coder_workspace_id;
  }
  return null;
};

const upsertBinding = async ({
  userId,
  coderUserId,
  workspaceId,
  workspaceName,
  prototypesHostPath,
  templateName = 'docker-template',
}) => {
  return UserWorkspace.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        coder_user_id: coderUserId || null,
        workspace_id: workspaceId || null,
        workspace_name: workspaceName || null,
        prototypes_host_path: prototypesHostPath ? normalizePath(prototypesHostPath) : null,
        template_name: templateName,
        status: 'active',
      },
      $setOnInsert: {
        user_id: userId,
      },
    },
    { upsert: true, new: true }
  );
};

module.exports = {
  getBindingByUser,
  getWorkspaceIdForUser,
  upsertBinding,
};
