// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { List } from '@/types/common.type'
import { serverAxios, cacheAxios } from './base'
import { Prototype } from '@/types/model.type'

export const PROTOTYPE_LIST_CARD_FIELDS = [
  'model_id',
  'name',
  'visibility',
  'image_file',
  'id',
  'created_at',
  'created_by',
  'tags',
  'state',
  'code',
  'executed_turns',
].join(',')

const PROTOTYPE_LIST_DEFAULT_FIELDS = [
  'model_id',
  'name',
  'visibility',
  'image_file',
  'id',
  'created_at',
  'created_by',
  'tags',
  'state',
].join(',')

export const listPopularPrototypes = async (): Promise<Prototype[]> => {
  const response = await serverAxios.get('/prototypes/popular')
  return response.data
}

export const listRecentPrototypes = async (): Promise<Prototype[]> => {
  const response = await serverAxios.get('/prototypes/recent')
  return response.data
}

export const listPrototypesPaged = async (params: {
  page: number
  limit: number
  sortBy?: string
  created_by?: string
  fields?: string
}): Promise<List<Prototype>> => {
  const requestParams = {
    fields: params.fields ?? PROTOTYPE_LIST_DEFAULT_FIELDS,
    ...params,
  }

  try {
    const response = await serverAxios.get<List<Prototype>>('/prototypes', {
      params: requestParams,
    })
    return response.data
  } catch (error) {
    console.error(`[listPrototypesPaged] Request failed:`, error)
    throw error
  }
}

export const listAllPrototypesFiltered = async (params?: {
  created_by?: string
  fields?: string
}): Promise<Prototype[]> => {
  let page = 1
  const limit = 50
  const allResults: Prototype[] = []
  let totalPages = 1
  const addedIds = new Set<string>()

  do {
    const response = await serverAxios.get<List<Prototype>>('/prototypes', {
      params: {
        fields: params?.fields ?? PROTOTYPE_LIST_DEFAULT_FIELDS,
        ...(params?.created_by ? { created_by: params.created_by } : {}),
        page,
        limit,
      },
    })

    response.data.results.forEach((prototype) => {
      if (!addedIds.has(prototype.id)) {
        addedIds.add(prototype.id)
        allResults.push(prototype)
      }
    })

    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  return allResults
}

export const listAllPrototypes = async (): Promise<List<Prototype>> => {
  const allResults = await listAllPrototypesFiltered()

  return {
    results: allResults,
    totalPages: 1,
    totalResults: allResults.length,
    page: 1,
    limit: allResults.length,
  }
}

export const getPrototype = async (prototype_id: string) => {
  if (!prototype_id) return null
  return (await serverAxios.get<Prototype>(`/prototypes/${prototype_id}`)).data
}

export const listModelPrototypeCount = async (
  model_id: string,
): Promise<number> => {
  const response = await serverAxios.get<List<Prototype>>('/prototypes', {
    params: { model_id, page: 1, limit: 1, fields: 'id' },
  })
  return response.data.totalResults
}

export const listModelPrototypes = async (model_id: string) => {
  let page = 1
  const limit = 50
  const allResults: Prototype[] = []
  let totalPages = 1
  const addedIds = new Set<string>()

  do {
    const response = await serverAxios.get<List<Prototype>>('/prototypes', {
      params: { model_id, page, limit },
    })

    response.data.results.forEach((prototype) => {
      if (!addedIds.has(prototype.id)) {
        addedIds.add(prototype.id)
        allResults.push(prototype)
      }
    })

    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  return allResults
}

export const createPrototypeService = async (prototype: any) => {
  return (await serverAxios.post<Prototype>('/prototypes', prototype)).data
}

export const createBulkPrototypesService = async (prototypes: any[]) => {
  return await serverAxios.post<Prototype[]>('/prototypes/bulk', prototypes)
}

export const updatePrototypeService = async (
  prototype_id: string,
  data: Partial<Prototype>,
) => {
  return (
    await serverAxios.patch<Prototype>(`/prototypes/${prototype_id}`, data)
  ).data
}

export const deletePrototypeService = async (prototype_id: string) => {
  return await serverAxios.delete(`/prototypes/${prototype_id}`)
}

export const saveRecentPrototype = async (
  userId: string,
  referenceId: string,
  type: string,
  page: string,
) => {
  // return cacheAxios.post('/save-to-db', {
  //   userId,
  //   referenceId,
  //   type,
  //   page,
  // })
}

export const countCodeExecution = async (prototypeId: string) => {
  return serverAxios.post(`/prototypes/${prototypeId}/execute-code`)
}
