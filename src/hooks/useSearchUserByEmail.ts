// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { searchUserByEmailService } from '@/services/search.service'
import { useQuery } from '@tanstack/react-query'

const useSearchUserByEmail = (email?: string) => {
  return useQuery({
    queryKey: ['searchUserByEmail', email],
    queryFn: async () => await searchUserByEmailService(email || ''),
    retry: 0,
  })
}

export default useSearchUserByEmail
