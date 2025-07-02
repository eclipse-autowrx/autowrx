// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { listInventoryInstancesService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

type UseListInventoryInstancesParams = {
  page?: number
  limit?: number
  search?: string
  schema?: string
  enabled?: boolean
}

const useListInventoryInstances = (params: UseListInventoryInstancesParams) => {
  const { page = 1, limit = 10, search, schema, enabled = true } = params

  const options: Record<string, any> = {
    page,
    limit,
    // search,
    schema,
  }

  for (const key in options) {
    if (options[key] === undefined || options[key] === '') {
      delete options[key]
    }
  }

  return useQuery({
    queryKey: ['inventoryInstanceList', options],
    queryFn: () => listInventoryInstancesService(options),
    placeholderData: (previousData) => previousData, // Keep existing data while fetching new page
    enabled, // Control query execution
  })
}

export default useListInventoryInstances
