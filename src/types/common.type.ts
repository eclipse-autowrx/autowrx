// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  IndexRouteObject,
  NonIndexRouteObject,
  RouteObject,
} from 'react-router-dom'

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

export type RouteConfig = (
  | IndexRouteObject
  | (NonIndexRouteObject & {
      children?: RouteConfig[]
    })
) & {
  noBreadcrumbs?: boolean
}

export type Partner = {
  title: string
  items: {
    name: string
    img: string
    url: string
  }[]
}
