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
    // Include user ID in query key so results are cached per user
    // Use 'anonymous' for unauthenticated users to ensure consistent caching
    queryKey: ['listAllModels', self?.id || 'anonymous'],
    queryFn: listAllModels,
    // Always run the query - backend supports unauthenticated access via PUBLIC_VIEWING config
    // The backend will return appropriate data based on PUBLIC_VIEWING setting
    enabled: true,
    // Don't retry on 401 errors for unauthenticated users - this is expected
    retry: (failureCount, error: any) => {
      // If it's a 401 and we don't have a user, don't retry (expected for public access)
      if (error?.response?.status === 401 && !self) {
        return false
      }
      // Otherwise use default retry logic
      return failureCount <= 1
    },
  })
}

export default useListAllModels
