// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import {
  listPopularPrototypes,
  listRecentPrototypes,
  listModelPrototypes,
} from '@/services/prototype.service'

export const prototypeQueryKeys = {
  all: ['prototypes'] as const,
  paged: (params: Record<string, unknown>) =>
    ['prototypes', 'paged', params] as const,
  model: (modelId: string) => ['listModelPrototypes', modelId] as const,
  recent: () => ['prototypes', 'recent'] as const,
  popular: () => ['prototypes', 'popular'] as const,
}

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
    queryKey: ['listModelPrototypes', model_id],
    queryFn: () => listModelPrototypes(model_id),
    enabled: enabled && !!model_id,
  })
}