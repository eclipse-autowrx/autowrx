// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'

export interface WorkspaceInfo {
  workspaceId: string
  workspaceName: string
  workspaceBuildId?: string | null
  status: string
  appUrl: string
  repoUrl: string | null
  /** Container path for prototype folder (mount from host) */
  folderPath?: string | null
}

export interface MyWorkspace {
  id: string
  name: string
  ownerName?: string | null
  status?: string
  openPath?: string | null
}

/**
 * Get workspace URL for a prototype
 */
export const getWorkspaceUrl = async (prototypeId: string): Promise<WorkspaceInfo> => {
  const response = await serverAxios.get<WorkspaceInfo>(`/system/coder/workspace/${prototypeId}`)
  return response.data
}

/**
 * Prepare workspace (create if needed)
 */
export const prepareWorkspace = async (prototypeId: string): Promise<WorkspaceInfo> => {
  const response = await serverAxios.post<WorkspaceInfo>(`/system/coder/workspace/${prototypeId}/prepare`)
  return response.data
}

/**
 * Write `.autowrx_run` on the server prototypes volume; VS Code extension picks it up via file watcher.
 * Run command is chosen on the server from `prototype.language`.
 */
export const triggerWorkspaceRun = async (prototypeId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspace/${prototypeId}/trigger-run`, {})
}

/** Body of `.autowrx_out` on the prototypes volume (`mtimeMs` for cheap change detection). */
export interface WorkspaceRunOutput {
  content: string
  mtimeMs: number
}

export const getWorkspaceRunOutput = async (
  prototypeId: string,
): Promise<WorkspaceRunOutput> => {
  const response = await serverAxios.get<WorkspaceRunOutput>(
    `/system/coder/workspace/${prototypeId}/run-output`,
  )
  return response.data
}

export const listMyWorkspaces = async (): Promise<MyWorkspace[]> => {
  const response = await serverAxios.get<{ workspaces: MyWorkspace[] }>('/system/coder/workspaces/me')
  return response.data?.workspaces || []
}

export const stopMyWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspaces/${workspaceId}/stop`, {})
}

export const startMyWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspaces/${workspaceId}/start`, {})
}

export const deleteMyWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.delete(`/system/coder/workspaces/${workspaceId}`)
}

export const listAdminWorkspaces = async (): Promise<MyWorkspace[]> => {
  const response = await serverAxios.get<{ workspaces: MyWorkspace[] }>('/system/coder/workspaces/admin')
  return response.data?.workspaces || []
}

export const startAdminWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspaces/admin/${workspaceId}/start`, {})
}

export const stopAdminWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspaces/admin/${workspaceId}/stop`, {})
}

export const deleteAdminWorkspace = async (workspaceId: string): Promise<void> => {
  await serverAxios.delete(`/system/coder/workspaces/admin/${workspaceId}`)
}
