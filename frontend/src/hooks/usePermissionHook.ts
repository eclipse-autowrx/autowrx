// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { checkPermissionService } from '@/services/permission.service.ts'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/stores/authStore'

const usePermissionHook = (...params: [string, string?][]) => {
  const [authBootstrapped, accessToken, storeUser] = useAuthStore((state) => [
    state.authBootstrapped,
    state.access?.token,
    state.user,
  ])

  const hasSession = !!accessToken || !!storeUser
  const enabled = authBootstrapped && hasSession && params.length > 0
  const { data, isPending } = useQuery({
    queryKey: ['permissions', params],
    queryFn: () => checkPermissionService(params),
    enabled,
  })
  const isResolved = authBootstrapped && (!enabled || !isPending)
  const permissions =
    enabled && data ? data : Array<boolean>(params.length).fill(false)

  // Keep array destructuring compatible while exposing pending vs. denied.
  return Object.assign([...permissions], {
    isResolved,
    isLoading: !isResolved,
  })
}

export default usePermissionHook
