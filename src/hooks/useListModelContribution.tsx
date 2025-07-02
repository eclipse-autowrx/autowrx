// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { listModelContributions } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListModelContribution = () => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listModelContributions', access],
    queryFn: () => listModelContributions(),
  })
}
export default useListModelContribution
