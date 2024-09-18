import { listUsersService } from '@/services/user.service'
import { InfiniteListQueryParams } from '@/types/common.type'
import { User } from '@/types/user.type'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export const useListUsers = (
  params?: Partial<
    Record<
      keyof (User & InfiniteListQueryParams & { includeFullDetails?: boolean }),
      unknown
    >
  >,
) => {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search') || ''

  if (search) {
    params = {
      search,
      ...params,
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
