// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { getSchemaService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

const useGetInventorySchema = (id?: string) => {
  return useQuery({
    queryKey: ['inventorySchema', id],
    queryFn: () => getSchemaService(id!),
    enabled: !!id, // Only run the query if id is available
  })
}

export default useGetInventorySchema
