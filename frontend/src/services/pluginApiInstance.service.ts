// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface PluginApiInstanceItem {
  id: string
  path?: string
  parent_id?: string
  relationships?: Array<{
    relationship_name: string
    target_item_id: string
  }>
  [key: string]: any // Allow dynamic fields based on PluginAPI schema
}

export interface PluginApiInstanceData {
  items: PluginApiInstanceItem[]
  metadata?: any
}

export interface PluginApiInstance {
  id: string
  plugin_api: string
  plugin_api_code: string
  scope: 'system' | 'user'
  owner: string
  name: string
  description?: string
  avatar?: string
  provider_url?: string
  data: PluginApiInstanceData
  created_by: string
  updated_by: string
  createdAt: string
  updatedAt: string
}

export interface Paged<T> {
  results: T[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

export interface ListPluginApiInstanceParams {
  plugin_api_code?: string
  scope?: 'system' | 'user'
  name?: string
  sortBy?: string
  limit?: number
  page?: number
}

export const listPluginApiInstances = (params?: ListPluginApiInstanceParams): Promise<Paged<PluginApiInstance>> =>
  serverAxios.get('/plugin-api-instances', { params }).then((r) => r.data)

export const getPluginApiInstanceById = (id: string | any): Promise<PluginApiInstance> => {
  // Normalize ID to string (handle MongoDB ObjectIds and other object types)
  let normalizedId: string
  if (typeof id === 'string') {
    normalizedId = id
  } else if (id && typeof id === 'object' && 'toString' in id) {
    normalizedId = id.toString()
  } else {
    normalizedId = String(id)
  }
  
  if (!normalizedId || normalizedId === '[object Object]' || normalizedId === 'undefined' || normalizedId === 'null') {
    throw new Error(`Invalid plugin API instance ID: ${id}`)
  }
  
  return serverAxios.get(`/plugin-api-instances/${normalizedId}`).then((r) => r.data)
}

export const createPluginApiInstance = (data: Partial<PluginApiInstance>): Promise<PluginApiInstance> =>
  serverAxios.post('/plugin-api-instances', data).then((r) => r.data)

export const updatePluginApiInstance = (id: string, data: Partial<PluginApiInstance>): Promise<PluginApiInstance> =>
  serverAxios.patch(`/plugin-api-instances/${id}`, data).then((r) => r.data)

export const deletePluginApiInstance = (id: string): Promise<void> =>
  serverAxios.delete(`/plugin-api-instances/${id}`).then(() => {})

// Item-level operations
export const addInstanceItem = (instanceId: string, item: PluginApiInstanceItem): Promise<PluginApiInstance> =>
  serverAxios.post(`/plugin-api-instances/${instanceId}/items`, { item }).then((r) => r.data)

export const updateInstanceItem = (instanceId: string, itemId: string, item: Partial<PluginApiInstanceItem>): Promise<PluginApiInstance> =>
  serverAxios.patch(`/plugin-api-instances/${instanceId}/items/${itemId}`, { item }).then((r) => r.data)

export const removeInstanceItem = (instanceId: string, itemId: string): Promise<PluginApiInstance> =>
  serverAxios.delete(`/plugin-api-instances/${instanceId}/items/${itemId}`).then((r) => r.data)

