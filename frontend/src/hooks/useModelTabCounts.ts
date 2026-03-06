// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQueries } from '@tanstack/react-query'
import { listModelsByTab } from '@/services/model.service'
import useSelfProfileQuery from './useSelfProfile'

export const MODEL_TAB_COUNTS_QUERY_KEY = ['modelTabCounts']

export const useModelTabCounts = () => {
  const { data: self } = useSelfProfileQuery()

  const queries = useQueries({
    queries: [
      {
        queryKey: [...MODEL_TAB_COUNTS_QUERY_KEY, 'owned'],
        queryFn: () => listModelsByTab('owned', 1, 1),
        enabled: !!self?.id,
      },
      {
        queryKey: [...MODEL_TAB_COUNTS_QUERY_KEY, 'contributed'],
        queryFn: () => listModelsByTab('contributed', 1, 1),
        enabled: !!self?.id,
      },
      {
        queryKey: [...MODEL_TAB_COUNTS_QUERY_KEY, 'public'],
        queryFn: () => listModelsByTab('public', 1, 1),
        enabled: true,
      },
    ],
  })

  const [ownedRes, contributedRes, publicRes] = queries

  const tabCounts = {
    myModel: ownedRes?.data?.totalResults ?? null,
    myContribution: contributedRes?.data?.totalResults ?? null,
    public: publicRes?.data?.totalResults ?? null,
  }

  return {
    tabCounts,
    isLoading: queries.some((q) => q.isLoading),
    refetch: async () => {
      await Promise.all(queries.map((q) => q.refetch()))
    },
  }
}

export default useModelTabCounts
