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
  RUST: 'rust',
};

const resolveWorkspaceKindFromLanguage = (language) => {
  const lang = String(language || '')
    .trim()
    .toLowerCase();
  if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
    return WORKSPACE_KINDS.CPP;
  }
  if (lang === 'rust' || lang === 'rs') {
    return WORKSPACE_KINDS.RUST;
  }
  // Any unknown language falls back to python workspace.
  return WORKSPACE_KINDS.PYTHON;
};

const resolveWorkspaceKindFromPrototype = (prototype) =>
  resolveWorkspaceKindFromLanguage(prototype?.language);

const getTemplateNameForWorkspaceKind = (workspaceKind) =>
  workspaceKind === WORKSPACE_KINDS.CPP
    ? 'docker-template-cpp'
    : workspaceKind === WORKSPACE_KINDS.RUST
      ? 'docker-template-rust'
      : 'docker-template-python';

module.exports = {
  WORKSPACE_KINDS,
  resolveWorkspaceKindFromLanguage,
  resolveWorkspaceKindFromPrototype,
  getTemplateNameForWorkspaceKind,
};
