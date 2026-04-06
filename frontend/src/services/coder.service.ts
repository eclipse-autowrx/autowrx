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
  repoUrl: string | null
  /** Container path for prototype folder (mount from host) */
  folderPath?: string | null
}

export interface WorkspaceStatus {
  exists: boolean
  workspaceId?: string
  status?: string
  transition?: string
}

export interface AgentConnectionTiming {
  started_at?: string | null
  ended_at?: string | null
  workspace_agent_id?: string
  workspace_agent_name?: string
  stage?: string
}

export interface AgentScriptTiming {
  started_at?: string
  ended_at?: string
  exit_code?: number
  stage?: string
  status?: string
  display_name?: string
  workspace_agent_id?: string
  workspace_agent_name?: string
}

export interface WorkspaceTimings {
  agent_connection_timings?: AgentConnectionTiming[]
  agent_script_timings?: AgentScriptTiming[]
  provisioner_timings?: unknown
}

export interface WorkspaceAgentLog {
  created_at?: string
  id?: number
  level?: 'debug' | 'error' | 'info' | 'trace' | 'warn'
  output?: string
  source_id?: string
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

/**
 * Get workspace timings (build timings) for a prototype
 */
export const getWorkspaceTimings = async (prototypeId: string): Promise<WorkspaceTimings> => {
  const response = await serverAxios.get<WorkspaceTimings>(`/system/coder/workspace/${prototypeId}/timings`)
  return response.data
}

/**
 * Get logs for a workspace (by prototype)
 */
export const getWorkspaceLogs = async (
  prototypeId: string,
  params?: { before?: number; after?: number; format?: 'json' | 'text' },
): Promise<WorkspaceAgentLog[] | string> => {
  const response = await serverAxios.get<WorkspaceAgentLog[] | string>(
    `/system/coder/workspace/${prototypeId}/logs`,
    { params },
  )
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
