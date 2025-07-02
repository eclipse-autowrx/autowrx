// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// useListAllModels.ts
import { useQuery } from '@tanstack/react-query'
import { listAllModels } from '@/services/model.service'
import useSelfProfileQuery from './useSelfProfile'

const useListAllModels = () => {
  const { data: self } = useSelfProfileQuery()

  return useQuery({
    queryKey: ['listAllModels', self?.id],
    queryFn: listAllModels,
  })
}

export default useListAllModels
