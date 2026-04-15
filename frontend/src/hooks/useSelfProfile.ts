// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useQuery } from '@tanstack/react-query'
import { getSelfService } from '@/services/user.service.ts'
import useAuthStore from '@/stores/authStore.ts'

const useSelfProfileQuery = () => {
  const [authBootstrapped, accessToken] = useAuthStore((state) => [
    state.authBootstrapped,
    state.access?.token,
  ])

  return useQuery({
    queryKey: ['getSelf'],
    queryFn: getSelfService,
    enabled: authBootstrapped && !!accessToken,
  })
}

export default useSelfProfileQuery
