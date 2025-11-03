// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { listUsersService } from '@/services/user.service'
import { InfiniteListQueryParams } from '@/types/common.type'
import { User } from '@/types/user.type'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

type Options = {
  disableAutoSearchRefetch?: boolean
}

export const useListUsers = (
  params?: Partial<
    Record<
      keyof (User & InfiniteListQueryParams & { includeFullDetails?: boolean }),
      unknown
    >
  >,
  options?: Options,
) => {
  const { disableAutoSearchRefetch = false } = options || {}

  const [searchParams] = useSearchParams()

  // If disableAutoSearchRefetch = false, automatically attach the search to the params options. This params is used as key for the query.
  if (!disableAutoSearchRefetch) {
    const search = searchParams.get('search') || ''

    if (search) {
      params = {
        search,
        ...params,
      }
    }
  }

  const { data: originalData, ...rest } = useInfiniteQuery({
    queryKey: ['listUsers', params],
    queryFn: ({ pageParam }) =>
      listUsersService({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })

  const data = useMemo(
    () => originalData?.pages.flatMap((page) => page.results) || [],
    [originalData],
  )

  return {
    data,
    originalData,
    totalResults: originalData?.pages.at(0)?.totalResults || 0,
    ...rest,
  }
}
