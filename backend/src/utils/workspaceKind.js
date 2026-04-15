// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const WORKSPACE_KINDS = {
  PYTHON: 'python',
  CPP: 'cpp',
};

const resolveWorkspaceKindFromLanguage = (language) => {
  const lang = String(language || '')
    .trim()
    .toLowerCase();
  if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
    return WORKSPACE_KINDS.CPP;
  }
  // Includes rust and any other unknown language for now.
  return WORKSPACE_KINDS.PYTHON;
};

const resolveWorkspaceKindFromPrototype = (prototype) =>
  resolveWorkspaceKindFromLanguage(prototype?.language);

const getTemplateNameForWorkspaceKind = (workspaceKind) =>
  workspaceKind === WORKSPACE_KINDS.CPP
    ? 'docker-template-cpp'
    : 'docker-template-python';

module.exports = {
  WORKSPACE_KINDS,
  resolveWorkspaceKindFromLanguage,
  resolveWorkspaceKindFromPrototype,
  getTemplateNameForWorkspaceKind,
};
