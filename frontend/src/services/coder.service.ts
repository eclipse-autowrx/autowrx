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
  status: string
  appUrl: string
  sessionToken?: string | null
  repoUrl: string
}

export interface WorkspaceStatus {
  exists: boolean
  workspaceId?: string
  status?: string
  transition?: string
}

/**
 * Get workspace URL and session token for a prototype
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
 * Get workspace status
 */
export const getWorkspaceStatus = async (prototypeId: string): Promise<WorkspaceStatus> => {
  const response = await serverAxios.get<WorkspaceStatus>(`/system/coder/workspace/${prototypeId}/status`)
  return response.data
}
