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
  ownerEmail?: string | null
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

/** Trigger run request to AutoWRX Runner over workspace WebSocket hub. */
export const triggerWorkspaceRun = async (prototypeId: string): Promise<void> => {
  await serverAxios.post(`/system/coder/workspace/${prototypeId}/trigger-run`, {})
}

export interface WorkspaceRuntimeStateSnapshot {
  apisValue: Record<string, unknown>
  traceVars: Record<string, unknown>
  appLog: string
  status: string
  updatedAt: string
}

export const getWorkspaceRuntimeState = async (
  prototypeId: string,
): Promise<WorkspaceRuntimeStateSnapshot> => {
  const response = await serverAxios.get<WorkspaceRuntimeStateSnapshot>(
    `/system/coder/workspace/${prototypeId}/runtime-state`,
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
