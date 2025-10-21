// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ListQueryParams } from './common.type'

export type Asset = {
  name: string
  type: string
  data: string
  id?: string
}

export type QueryAssetsParams = Omit<ListQueryParams, 'search'> & {
  name?: string
  type?: string | string[]
}
