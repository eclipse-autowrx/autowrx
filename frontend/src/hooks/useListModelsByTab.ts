// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  listModelsByTab,
  type ModelsTab,
} from '@/services/model.service'
import useSelfProfileQuery from './useSelfProfile'

const PAGE_SIZE = 24

const tabToApiTab = (
  tab: 'myModel' | 'myContribution' | 'public',
): ModelsTab | null => {
  switch (tab) {
    case 'myModel':
      return 'owned'
    case 'myContribution':
      return 'contributed'
    case 'public':
      return 'public'
    default:
      return null
  }
}

export const useListModelsByTab = (
  activeTab: 'myModel' | 'myContribution' | 'public',
) => {
  const { data: self } = useSelfProfileQuery()
  const apiTab = tabToApiTab(activeTab)

  const enabled = !!apiTab && (activeTab !== 'myContribution' || !!self?.id)

  const {
    data: originalData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['listModelsByTab', apiTab, self?.id ?? 'anonymous'],
    queryFn: ({ pageParam }) =>
      listModelsByTab(apiTab!, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled,
  })

  const models = useMemo(
    () => originalData?.pages.flatMap((p) => p.results) ?? [],
    [originalData],
  )

  const totalResults =
    originalData?.pages.at(0)?.totalResults ?? 0

  return {
    models,
    totalResults,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  }
}

export default useListModelsByTab
