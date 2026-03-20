// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { listModelsPage } from '@/services/model.service'
import { ModelLite } from '@/types/model.type'
import useSelfProfileQuery from './useSelfProfile'

type ModelTabScope = 'owned' | 'contributed' | 'public'

const useListAllModels = () => {
  const queryClient = useQueryClient()
  const { data: self } = useSelfProfileQuery()
  const userId = self?.id

  const initialScope: ModelTabScope = userId ? 'owned' : 'public'
  const [scopeStep, setScopeStep] = useState<ModelTabScope>(initialScope)

  useEffect(() => {
    setScopeStep(initialScope)
  }, [initialScope])

  const baseKey = useMemo(() => ['modelsList', userId ?? 'anonymous'] as const, [userId])

  const ownedQuery = useInfiniteQuery({
    queryKey: [...baseKey, 'owned'],
    enabled: !!userId && scopeStep === 'owned',
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return listModelsPage({ created_by: userId }, { page: pageParam })
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  const contributedQuery = useInfiniteQuery({
    queryKey: [...baseKey, 'contributed'],
    enabled: !!userId && scopeStep === 'contributed',
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return listModelsPage({ is_contributor: true }, { page: pageParam })
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  const publicQuery = useInfiniteQuery({
    queryKey: [...baseKey, 'public'],
    enabled: scopeStep === 'public',
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return listModelsPage(
        { visibility: 'public', state: 'released' },
        { page: pageParam },
      )
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  // Auto-fetch next pages for the active scope until it is exhausted.
  useEffect(() => {
    if (!userId) return
    if (scopeStep !== 'owned') return
    if (ownedQuery.status !== 'success') return
    if (!ownedQuery.hasNextPage) return
    if (ownedQuery.isFetchingNextPage) return
    void ownedQuery.fetchNextPage()
  }, [
    userId,
    scopeStep,
    ownedQuery.status,
    ownedQuery.hasNextPage,
    ownedQuery.isFetchingNextPage,
    ownedQuery.fetchNextPage,
  ])

  useEffect(() => {
    if (!userId) return
    if (scopeStep !== 'contributed') return
    if (contributedQuery.status !== 'success') return
    if (!contributedQuery.hasNextPage) return
    if (contributedQuery.isFetchingNextPage) return
    void contributedQuery.fetchNextPage()
  }, [
    userId,
    scopeStep,
    contributedQuery.status,
    contributedQuery.hasNextPage,
    contributedQuery.isFetchingNextPage,
    contributedQuery.fetchNextPage,
  ])

  useEffect(() => {
    if (scopeStep !== 'public') return
    if (publicQuery.status !== 'success') return
    if (!publicQuery.hasNextPage) return
    if (publicQuery.isFetchingNextPage) return
    void publicQuery.fetchNextPage()
  }, [
    scopeStep,
    publicQuery.status,
    publicQuery.hasNextPage,
    publicQuery.isFetchingNextPage,
    publicQuery.fetchNextPage,
  ])

  // Once a scope is exhausted, move to the next one.
  useEffect(() => {
    if (!userId) {
      if (scopeStep !== 'public') return
      return
    }

    if (scopeStep === 'owned' && ownedQuery.status === 'success' && !ownedQuery.hasNextPage) {
      setScopeStep('contributed')
    }

    if (
      scopeStep === 'contributed' &&
      contributedQuery.status === 'success' &&
      !contributedQuery.hasNextPage
    ) {
      setScopeStep('public')
    }
  }, [
    userId,
    scopeStep,
    ownedQuery.status,
    ownedQuery.hasNextPage,
    contributedQuery.status,
    contributedQuery.hasNextPage,
  ])

  const ownedModels = useMemo(
    () => (ownedQuery.data?.pages.flatMap((p) => p.results) ?? []) as ModelLite[],
    [ownedQuery.data],
  )
  const contributedModels = useMemo(
    () =>
      (contributedQuery.data?.pages.flatMap((p) => p.results) ?? []) as ModelLite[],
    [contributedQuery.data],
  )
  const publicReleasedModels = useMemo(
    () => (publicQuery.data?.pages.flatMap((p) => p.results) ?? []) as ModelLite[],
    [publicQuery.data],
  )

  const totalResults = ownedModels.length + contributedModels.length + publicReleasedModels.length

  const error = ownedQuery.error || contributedQuery.error || publicQuery.error

  const isFetchingNextPage =
    ownedQuery.isFetchingNextPage ||
    contributedQuery.isFetchingNextPage ||
    publicQuery.isFetchingNextPage

  const isLoading = ownedQuery.isLoading || contributedQuery.isLoading || publicQuery.isLoading

  const refetch = useCallback(async () => {
    setScopeStep(initialScope)
    await queryClient.invalidateQueries({ queryKey: baseKey })
  }, [queryClient, baseKey, initialScope])

  return {
    ownedModels,
    contributedModels,
    publicReleasedModels,
    totalResults,
    isLoading,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage: ownedQuery.hasNextPage || contributedQuery.hasNextPage || publicQuery.hasNextPage,
  }
}

export default useListAllModels
