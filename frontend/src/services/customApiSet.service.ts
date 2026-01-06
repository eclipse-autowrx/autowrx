// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface CustomApiSetItem {
  id: string
  path?: string
  parent_id?: string
  relationships?: Array<{
    relationship_name: string
    target_item_id: string
  }>
  [key: string]: any // Allow dynamic fields based on CustomApiSchema schema
}

export interface CustomApiSetData {
  items: CustomApiSetItem[]
  metadata?: any
}

export interface CustomApiSet {
  id: string
  custom_api_schema: string
  custom_api_schema_code: string
  scope: 'system' | 'user'
  owner: string
  name: string
  description?: string
  avatar?: string
  provider_url?: string
  data: CustomApiSetData
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

export interface ListCustomApiSetParams {
  custom_api_schema_code?: string
  scope?: 'system' | 'user'
  name?: string
  sortBy?: string
  limit?: number
  page?: number
}

export const listCustomApiSets = (params?: ListCustomApiSetParams): Promise<Paged<CustomApiSet>> =>
  serverAxios.get('/custom-api-sets', { params }).then((r) => r.data)

export const getCustomApiSetById = (id: string | any): Promise<CustomApiSet> => {
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
    throw new Error(`Invalid custom API set ID: ${id}`)
  }
  
  return serverAxios.get(`/custom-api-sets/${normalizedId}`).then((r) => r.data)
}

export const createCustomApiSet = (data: Partial<CustomApiSet>): Promise<CustomApiSet> =>
  serverAxios.post('/custom-api-sets', data).then((r) => r.data)

export const updateCustomApiSet = (id: string, data: Partial<CustomApiSet>): Promise<CustomApiSet> =>
  serverAxios.patch(`/custom-api-sets/${id}`, data).then((r) => r.data)

export const deleteCustomApiSet = (id: string): Promise<void> =>
  serverAxios.delete(`/custom-api-sets/${id}`).then(() => {})

// Item-level operations
export const addSetItem = (setId: string, item: CustomApiSetItem): Promise<CustomApiSet> =>
  serverAxios.post(`/custom-api-sets/${setId}/items`, { item }).then((r) => r.data)

export const updateSetItem = (setId: string, itemId: string, item: Partial<CustomApiSetItem>): Promise<CustomApiSet> =>
  serverAxios.patch(`/custom-api-sets/${setId}/items/${itemId}`, { item }).then((r) => r.data)

export const removeSetItem = (setId: string, itemId: string): Promise<CustomApiSet> =>
  serverAxios.delete(`/custom-api-sets/${setId}/items/${itemId}`).then((r) => r.data)

