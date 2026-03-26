// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export const BACKUP_SECTIONS = [
  { key: 'models', label: 'Models' },
  { key: 'prototypes', label: 'Prototypes' },
  { key: 'plugins', label: 'Plugins (with files)' },
  { key: 'siteConfigs', label: 'Site Configurations' },
  { key: 'modelTemplates', label: 'Model Templates' },
  { key: 'dashboardTemplates', label: 'Dashboard Templates' },
  { key: 'customApiSchemas', label: 'Custom API Schemas' },
  { key: 'customApiSets', label: 'Custom API Sets' },
  { key: 'uploads', label: 'Uploaded Assets (/d/)' },
  { key: 'imgs', label: 'Site Images (/imgs/)' },
  { key: 'globalCss', label: 'Global CSS (global.css)' },
] as const

export type SectionKey = (typeof BACKUP_SECTIONS)[number]['key']

export interface ConflictItem {
  id: string
  name: string
  description: string
  existingId: string
  resolution: 'skip' | 'replace'
}

export interface ConflictReport {
  models?: ConflictItem[]
  prototypes?: ConflictItem[]
  plugins?: ConflictItem[]
  siteConfigs?: ConflictItem[]
  modelTemplates?: ConflictItem[]
  dashboardTemplates?: ConflictItem[]
  customApiSchemas?: ConflictItem[]
  customApiSets?: ConflictItem[]
  uploads?: ConflictItem[]
  imgs?: ConflictItem[]
  globalCss?: ConflictItem[]
}

export interface BackupManifest {
  version: string
  createdAt: string
  sections: SectionKey[]
  counts: Partial<Record<SectionKey, number>>
}

export interface UploadAnalysisResult {
  sessionId: string
  manifest: BackupManifest
  conflicts: ConflictReport
}

export interface RestoreResult {
  imported: Partial<Record<SectionKey, number>>
  skipped: Partial<Record<SectionKey, number>>
  errors: Array<{ type: string; id: string; error: string }>
}

export interface Resolution {
  id: string
  resolution: 'skip' | 'replace'
}

/**
 * Request a backup zip download. Returns a Blob.
 */
export const downloadBackup = async (selections: SectionKey[]): Promise<Blob> => {
  const response = await serverAxios.post(
    '/system/backup',
    { selections },
    { responseType: 'blob' },
  )
  return response.data as Blob
}

/**
 * Upload a backup zip for conflict analysis.
 */
export const uploadBackup = (file: File): Promise<UploadAnalysisResult> => {
  const fd = new FormData()
  fd.append('backup', file)
  return serverAxios.post('/system/backup/restore/upload', fd).then((r) => r.data)
}

/**
 * Apply restore with conflict resolutions.
 */
export const applyRestore = (sessionId: string, resolutions: Resolution[]): Promise<RestoreResult> =>
  serverAxios
    .post('/system/backup/restore/apply', { sessionId, resolutions })
    .then((r) => r.data)
