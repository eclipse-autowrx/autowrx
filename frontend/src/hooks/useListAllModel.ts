// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listAllModels } from '@/services/model.service'
import { ModelLite } from '@/types/model.type'
import useSelfProfileQuery from './useSelfProfile'

const useListAllModels = () => {
  const { data: self } = useSelfProfileQuery()

  const query = useQuery({
    queryKey: ['allModels', self?.id ?? 'anonymous'],
    queryFn: listAllModels,
  })

  const ownedModels = (query.data?.ownedModels?.results ?? []) as ModelLite[]
  const contributedModels = (query.data?.contributedModels?.results ?? []) as ModelLite[]
  const publicReleasedModels = (query.data?.publicReleasedModels?.results ?? []) as ModelLite[]
  const totalResults = ownedModels.length + contributedModels.length + publicReleasedModels.length

  return {
    ownedModels,
    contributedModels,
    publicReleasedModels,
    totalResults,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetchingNextPage: false,
    hasNextPage: false,
  }
}

export default useListAllModels
