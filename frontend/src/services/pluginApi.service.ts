// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface PluginApiRelationship {
  name: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  target_api: string
  description?: string
}

export interface PluginAPI {
  id: string
  code: string
  name: string
  description?: string
  type: 'tree' | 'list' | 'graph'
  schema: string // JSON Schema as string
  id_format?: string | null
  relationships?: PluginApiRelationship[]
  tree_config?: any
  list_view_config?: {
    title?: string | null
    description?: string | null
    type?: string | null
  } | null
  schema_definition?: any
  version: string
  is_active: boolean
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

export interface ListPluginApiParams {
  name?: string
  code?: string
  type?: 'tree' | 'list' | 'graph'
  is_active?: boolean
  sortBy?: string
  limit?: number
  page?: number
}

export const listPluginAPIs = (params?: ListPluginApiParams): Promise<Paged<PluginAPI>> =>
  serverAxios.get('/system/plugin-api', { params }).then((r) => r.data)

export const getPluginAPIById = (id: string): Promise<PluginAPI> =>
  serverAxios.get(`/system/plugin-api/${id}`).then((r) => r.data)

export const createPluginAPI = (data: Partial<PluginAPI>): Promise<PluginAPI> =>
  serverAxios.post('/system/plugin-api', data).then((r) => r.data)

export const updatePluginAPI = (id: string, data: Partial<PluginAPI>): Promise<PluginAPI> =>
  serverAxios.patch(`/system/plugin-api/${id}`, data).then((r) => r.data)

export const deletePluginAPI = (id: string): Promise<void> =>
  serverAxios.delete(`/system/plugin-api/${id}`).then(() => {})

