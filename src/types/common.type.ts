export type List<T> = {
  results: T[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

export type ListQueryParams = {
  page?: number
  limit?: number
  sortBy?: string
  search?: string
}

export type InfiniteListQueryParams = Omit<ListQueryParams, 'page'>
