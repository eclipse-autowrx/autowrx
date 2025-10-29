// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listModelsLite } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListModelLite = (params?: Record<string, unknown>) => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listModelLite', access, params],
    queryFn: () => listModelsLite(params),
  })
}
export default useListModelLite
