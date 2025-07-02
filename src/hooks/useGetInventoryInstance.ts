// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { getInventoryInstanceService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

const useGetInventoryInstance = (id?: string) => {
  return useQuery({
    queryKey: ['inventoryInstance', id],
    queryFn: () => getInventoryInstanceService(id!),
    enabled: !!id, // Only run the query if id is available
  })
}

export default useGetInventoryInstance
