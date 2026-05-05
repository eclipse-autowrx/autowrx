// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const path = require('path');
const { UserWorkspace } = require('../models');
const { WORKSPACE_KINDS } = require('../utils/workspaceKind');

const normalizePath = (p) => path.resolve(String(p || ''));
const normalizeWorkspaceKind = (workspaceKind) =>
  workspaceKind === WORKSPACE_KINDS.CPP
    ? WORKSPACE_KINDS.CPP
    : workspaceKind === WORKSPACE_KINDS.RUST
      ? WORKSPACE_KINDS.RUST
      : WORKSPACE_KINDS.PYTHON;

const getBindingByUser = async (userId, workspaceKind = WORKSPACE_KINDS.PYTHON) => {
  if (!userId) return null;
  return UserWorkspace.findOne({
    user_id: userId,
    workspace_kind: normalizeWorkspaceKind(workspaceKind),
  });
};

const getWorkspaceIdForUser = async (user, workspaceKind = WORKSPACE_KINDS.PYTHON) => {
  if (!user) return null;
  const kind = normalizeWorkspaceKind(workspaceKind);
  const binding = await getBindingByUser(user.id || user._id, kind);
  if (binding?.workspace_id) {
    return binding.workspace_id;
  }
  return null;
};

const upsertBinding = async ({
  userId,
  coderUserId,
  workspaceId,
  workspaceName,
  prototypesHostPath,
  templateName = 'docker-template-python',
  workspaceKind = WORKSPACE_KINDS.PYTHON,
}) => {
  const kind = normalizeWorkspaceKind(workspaceKind);
  return UserWorkspace.findOneAndUpdate(
    { user_id: userId, workspace_kind: kind },
    {
      $set: {
        coder_user_id: coderUserId || null,
        workspace_id: workspaceId || null,
        workspace_name: workspaceName || null,
        prototypes_host_path: prototypesHostPath ? normalizePath(prototypesHostPath) : null,
        template_name: templateName,
        status: 'active',
      },
    },
    { upsert: true, new: true }
  );
};

const markBindingStaleByWorkspaceId = async (workspaceId) => {
  if (!workspaceId) return null;
  return UserWorkspace.findOneAndUpdate(
    { workspace_id: workspaceId },
    {
      $set: {
        status: 'stale',
      },
      $unset: {
        workspace_id: '',
        workspace_name: '',
      },
    },
    { new: true }
  );
};

const markBindingStaleForUserWorkspace = async (userId, workspaceId) => {
  if (!userId || !workspaceId) return null;
  return UserWorkspace.findOneAndUpdate(
    { user_id: userId, workspace_id: workspaceId },
    {
      $set: {
        status: 'stale',
      },
      $unset: {
        workspace_id: '',
        workspace_name: '',
      },
    },
    { new: true }
  );
};

module.exports = {
  getBindingByUser,
  getWorkspaceIdForUser,
  upsertBinding,
  markBindingStaleByWorkspaceId,
  markBindingStaleForUserWorkspace,
};
