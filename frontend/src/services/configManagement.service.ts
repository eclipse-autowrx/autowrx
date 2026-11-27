// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'

export interface Config {
  id?: string
  key: string
  scope: 'site' | 'user' | 'model' | 'prototype' | 'api'
  target_id?: string
  value: any
  valueType:
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'array'
    | 'date'
    | 'color'
    | 'image_url'
  secret: boolean
  description?: string
  category?: string
  created_by?: string
  updated_by?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateConfigRequest {
  key: string
  scope: string
  target_id?: string
  value: any
  secret: boolean
  valueType: string
  category?: string
}

export interface UpdateConfigRequest {
  value?: any
  secret?: boolean
  description?: string
  category?: string
}

export interface ConfigQueryParams {
  scope?: 'site' | 'user' | 'model' | 'prototype' | 'api'
  target_id?: string
  secret?: boolean
  category?: string
  key?: string
  sortBy?: string
  limit?: number
  page?: number
}

export interface GetConfigsByKeysRequest {
  keys: string[]
}

export interface BulkUpsertRequest {
  configs: CreateConfigRequest[]
}

export interface RestoreSiteConfigSnapshotRequest {
  keys?: string[]
  categories?: string[]
  secret?: boolean
}

export interface RestoreSiteConfigSnapshotResponse {
  restored: number
  keys: string[]
  source?: 'snapshot' | 'predefined' | 'mixed' | 'none'
}

class ConfigManagementService {
  private baseUrl = '/site-config'

  // Public endpoints (no auth required)
  async getPublicConfigs(
    scope: string = 'site',
    target_id?: string,
  ): Promise<Record<string, any>> {
    const params: any = { scope }
    if (target_id) {
      params.target_id = target_id
    }
    const response = await serverAxios.get(`${this.baseUrl}/public`, { params })
    return response.data
  }

  async getPublicConfig(
    key: string,
    scope: string = 'site',
    target_id?: string,
  ): Promise<{ key: string; value: any }> {
    const params: any = { scope }
    if (target_id) {
      params.target_id = target_id
    }
    const response = await serverAxios.get(`${this.baseUrl}/public/${key}`, {
      params,
    })
    return response.data
  }

  // Scoped public endpoints
  async getPublicConfigsByScope(
    scope: string,
    target_id: string,
  ): Promise<Record<string, any>> {
    const response = await serverAxios.get(
      `${this.baseUrl}/public/${scope}/${target_id}`,
    )
    return response.data
  }

  async getPublicConfigByScope(
    scope: string,
    target_id: string,
    key: string,
  ): Promise<{ key: string; value: any }> {
    const response = await serverAxios.get(
      `${this.baseUrl}/public/${scope}/${target_id}/${key}`,
    )
    return response.data
  }

  // Runtime Admin UI visibility from backend process.env (printenv / container env)
  async getAdminUiConfig(): Promise<{
    cleanMode: boolean
    hiddenSiteConfigSections: string[]
    visibleFeatureCategories: string[] | null
  }> {
    const response = await serverAxios.get(`${this.baseUrl}/admin-ui`)
    return response.data
  }

  // Admin endpoints (auth required)
  async getAllConfigs(
    scope: string = 'site',
    target_id?: string,
  ): Promise<Record<string, any>> {
    const params: any = { scope }
    if (target_id) {
      params.target_id = target_id
    }
    const response = await serverAxios.get(`${this.baseUrl}/all`, { params })
    return response.data
  }

  // Scoped admin endpoints
  async getConfigsByScope(
    scope: string,
    target_id: string,
    params?: ConfigQueryParams,
  ): Promise<{
    results: Config[]
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }> {
    const response = await serverAxios.get(
      `${this.baseUrl}/${scope}/${target_id}`,
      { params },
    )
    return response.data
  }

  async getAllConfigsByScope(
    scope: string,
    target_id: string,
  ): Promise<Record<string, any>> {
    const response = await serverAxios.get(
      `${this.baseUrl}/${scope}/${target_id}/all`,
    )
    return response.data
  }

  async getConfigs(params?: ConfigQueryParams): Promise<{
    results: Config[]
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }> {
    const response = await serverAxios.get(this.baseUrl, { params })
    return response.data
  }

  async getConfigById(id: string): Promise<Config> {
    const response = await serverAxios.get(`${this.baseUrl}/${id}`)
    return response.data
  }

  async getConfigByKey(key: string): Promise<Config> {
    const response = await serverAxios.get(`${this.baseUrl}/key/${key}`)
    return response.data
  }

  async getConfigsByKeys(
    request: GetConfigsByKeysRequest,
  ): Promise<Record<string, any>> {
    const response = await serverAxios.post(`${this.baseUrl}/by-keys`, request)
    return response.data
  }

  async createConfig(config: CreateConfigRequest): Promise<Config> {
    const response = await serverAxios.post(this.baseUrl, config)
    return response.data
  }

  async updateConfigById(
    id: string,
    updates: UpdateConfigRequest,
  ): Promise<Config> {
    const response = await serverAxios.patch(`${this.baseUrl}/${id}`, updates)
    return response.data
  }

  async updateConfigByKey(
    key: string,
    updates: UpdateConfigRequest,
  ): Promise<Config> {
    const response = await serverAxios.patch(
      `${this.baseUrl}/key/${key}`,
      updates,
    )
    return response.data
  }

  async deleteConfigById(id: string): Promise<void> {
    await serverAxios.delete(`${this.baseUrl}/${id}`)
  }

  async deleteConfigByKey(key: string): Promise<void> {
    await serverAxios.delete(`${this.baseUrl}/key/${key}`)
  }

  /**
   * Load the site configs a settings section shows: the predefined keys of
   * `category`, plus any other config stored under that category. A predefined
   * key that is stored under another category (older seeds used "general") is
   * shown with its stored value. Only keys missing from the database are
   * created; bulk upsert overwrites values, so an existing key must never be
   * passed to it.
   */
  async loadSectionConfigs(
    category: string,
    predefined: CreateConfigRequest[],
  ): Promise<Config[]> {
    const res = await this.getConfigs({
      secret: false,
      scope: 'site',
      category,
      limit: 100,
    })
    const configs = res.results || []
    const found = new Set(configs.map((config) => config.key))

    const notInCategory = predefined.filter((config) => !found.has(config.key))
    const elsewhere = await Promise.all(
      notInCategory.map((config) =>
        this.getConfigByKey(config.key).catch((error) => {
          if (error?.response?.status === 404) return null
          throw error
        }),
      ),
    )
    elsewhere.forEach((config) => {
      if (config) {
        configs.push(config)
        found.add(config.key)
      }
    })

    const missing = predefined.filter((config) => !found.has(config.key))
    if (missing.length > 0) {
      configs.push(...(await this.bulkUpsertConfigs({ configs: missing })))
    }
    return configs
  }

  async bulkUpsertConfigs(request: BulkUpsertRequest): Promise<Config[]> {
    const response = await serverAxios.post(
      `${this.baseUrl}/bulk-upsert`,
      request,
    )
    return response.data
  }

  async restoreSiteConfigSnapshot(
    params: RestoreSiteConfigSnapshotRequest,
  ): Promise<RestoreSiteConfigSnapshotResponse> {
    const response = await serverAxios.post(
      `${this.baseUrl}/restore-snapshot`,
      params,
    )
    return response.data
  }

  // Global CSS helpers
  async getGlobalCss(): Promise<{ content: string }> {
    const response = await serverAxios.get(`${this.baseUrl}/global-css`)
    return response.data
  }

  async updateGlobalCss(content: string): Promise<{ success: boolean }> {
    const response = await serverAxios.put(`${this.baseUrl}/global-css`, {
      content,
    })
    return response.data
  }

  async restoreDefaultGlobalCss(): Promise<{ content: string }> {
    const response = await serverAxios.post(
      `${this.baseUrl}/global-css/restore-default`,
    )
    return response.data
  }
}

export const configManagementService = new ConfigManagementService()
