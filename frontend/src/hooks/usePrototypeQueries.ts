// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { QueryClient, useQuery } from '@tanstack/react-query'
import {
  listPopularPrototypes,
  listRecentPrototypes,
  listModelPrototypes,
  listModelPrototypesPaged,
} from '@/services/prototype.service'

export type ModelPrototypesPagedParams = {
  page: number
  limit: number
  sortBy?: string
  name?: string
  fields?: string
}

export const prototypeQueryKeys = {
  all: ['prototypes'] as const,
  paged: (params: Record<string, unknown>) =>
    ['prototypes', 'paged', params] as const,
  allForViewSort: (params: Record<string, unknown>) =>
    ['prototypes', 'all-for-view-sort', params] as const,
  model: (modelId: string) => ['listModelPrototypes', modelId] as const,
  modelPaged: (modelId: string, params: ModelPrototypesPagedParams) =>
    ['listModelPrototypes', modelId, 'paged', params] as const,
  modelTotal: (modelId: string) =>
    ['listModelPrototypes', modelId, 'total'] as const,
  recent: () => ['prototypes', 'recent'] as const,
  popular: () => ['prototypes', 'popular'] as const,
}

export const invalidatePrototypeListQueries = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: prototypeQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['listModelPrototypes'] }),
  ])

export const usePopularPrototypes = (enabled = true) =>
  useQuery({
    queryKey: prototypeQueryKeys.popular(),
    queryFn: listPopularPrototypes,
    enabled,
  })

export const useRecentPrototypes = (enabled = true) =>
  useQuery({
    queryKey: prototypeQueryKeys.recent(),
    queryFn: listRecentPrototypes,
    enabled,
  })

export const useListModelPrototypes = (
  model_id: string,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? !!model_id

  return useQuery({
    queryKey: prototypeQueryKeys.model(model_id),
    queryFn: () => listModelPrototypes(model_id),
    enabled: enabled && !!model_id,
  })
}

export const useModelPrototypesPaged = (
  model_id: string,
  params: ModelPrototypesPagedParams,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? !!model_id

  return useQuery({
    queryKey: prototypeQueryKeys.modelPaged(model_id, params),
    queryFn: () => listModelPrototypesPaged({ model_id, ...params }),
    enabled: enabled && !!model_id,
  })
}

export const useModelPrototypeTotal = (
  model_id: string,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? !!model_id

  return useQuery({
    queryKey: prototypeQueryKeys.modelTotal(model_id),
    queryFn: () =>
      listModelPrototypesPaged({
        model_id,
        page: 1,
        limit: 1,
        fields: 'id',
      }),
    select: (data) => data.totalResults,
    enabled: enabled && !!model_id,
  })
}
