// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface CustomApiSchemaRelationship {
  name: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  target_api: string
  description?: string
}

export interface CustomApiSchema {
  id: string
  code: string
  name: string
  description?: string
  type: 'tree' | 'list' | 'graph'
  schema: string // JSON Schema as string
  id_format?: string | null
  relationships?: CustomApiSchemaRelationship[]
  tree_config?: any
  list_view_config?: {
    title?: string | null
    description?: string | null
    type?: string | null
    style?: 'compact' | 'badge' | 'badge-image' | null
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

export interface ListCustomApiSchemaParams {
  name?: string
  code?: string
  type?: 'tree' | 'list' | 'graph'
  is_active?: boolean
  sortBy?: string
  limit?: number
  page?: number
}

export const listCustomApiSchemas = (params?: ListCustomApiSchemaParams): Promise<Paged<CustomApiSchema>> =>
  serverAxios.get('/system/custom-api-schema', { params }).then((r) => r.data)

export const getCustomApiSchemaById = (id: string): Promise<CustomApiSchema> =>
  serverAxios.get(`/system/custom-api-schema/${id}`).then((r) => r.data)

export const createCustomApiSchema = (data: Partial<CustomApiSchema>): Promise<CustomApiSchema> =>
  serverAxios.post('/system/custom-api-schema', data).then((r) => r.data)

export const updateCustomApiSchema = (id: string, data: Partial<CustomApiSchema>): Promise<CustomApiSchema> =>
  serverAxios.patch(`/system/custom-api-schema/${id}`, data).then((r) => r.data)

export const deleteCustomApiSchema = (id: string): Promise<void> =>
  serverAxios.delete(`/system/custom-api-schema/${id}`).then(() => {})

