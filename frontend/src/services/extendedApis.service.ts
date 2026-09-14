// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { List } from '@/types/common.type'
import { serverAxios } from './base'
import {
  ExtendedApi,
  ExtendedApiCreate,
  ExtendedApiRet,
} from '@/types/api.type'

export const createExtendedApi = async (
  data: ExtendedApiCreate,
): Promise<ExtendedApiRet> => {
  const res = (
    await serverAxios.post<ExtendedApi>('/extendedApis', {
      ...data,
      type: data.type ?? 'branch',
    })
  ).data
  return {
    ...res,
    name: res.apiName,
    type: res.type ?? 'branch',
    description: res.description ?? '',
  }
}

export const getExtendedApi = async (name: string, model_id: string) => {
  return (
    await serverAxios.get<ExtendedApi>(
      `/extendedApis/by-api-and-model?apiName=${name}&model=${model_id}`,
    )
  ).data
}

export const updateExtendedApi = async (
  data: Partial<ExtendedApiCreate>,
  id: string,
) => {
  return (
    await serverAxios.patch<Partial<ExtendedApiCreate>>(
      `/extendedApis/${id}`,
      data,
    )
  ).data
}

export const deleteExtendedApi = async (id: string) => {
  return (await serverAxios.delete(`/extendedApis/${id}`)).data
}

export const listExtendedApis = async (
  model_id: string,
  params?: { page?: number; limit?: number },
) => {
  return (
    await serverAxios.get<List<ExtendedApi>>(`/extendedApis`, {
      params: {
        model: model_id,
        page: params?.page,
        limit: params?.limit,
      },
    })
  ).data
}

/** Fetch every extended API for a model (paginates until all pages loaded). */
export const listAllExtendedApis = async (
  model_id: string,
): Promise<ExtendedApi[]> => {
  const pageSize = 500
  const first = await listExtendedApis(model_id, { page: 1, limit: pageSize })
  const all = [...(first.results || [])]
  const totalPages = first.totalPages || 1
  for (let page = 2; page <= totalPages; page++) {
    const next = await listExtendedApis(model_id, { page, limit: pageSize })
    all.push(...(next.results || []))
  }
  return all
}
