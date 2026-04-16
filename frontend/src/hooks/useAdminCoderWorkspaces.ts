// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAdminWorkspace,
  listAdminWorkspaces,
  MyWorkspace,
  startAdminWorkspace,
  stopAdminWorkspace,
} from '@/services/coder.service'
import useAuthStore from '@/stores/authStore'

export const ADMIN_CODER_WORKSPACE_QUERY_KEY = {
  workspaces: ['coder', 'admin-workspaces'],
}

export const useAdminCoderWorkspaces = () => {
  const queryClient = useQueryClient()
  const [authBootstrapped, accessToken] = useAuthStore((state) => [
    state.authBootstrapped,
    state.access?.token,
  ])

  const useFetchAdminWorkspaces = () =>
    useQuery<MyWorkspace[]>({
      queryKey: ADMIN_CODER_WORKSPACE_QUERY_KEY.workspaces,
      queryFn: listAdminWorkspaces,
      enabled: authBootstrapped && !!accessToken,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    })

  const startWorkspace = useMutation({
    mutationFn: (workspaceId: string) => startAdminWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CODER_WORKSPACE_QUERY_KEY.workspaces })
    },
  })

  const stopWorkspace = useMutation({
    mutationFn: (workspaceId: string) => stopAdminWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CODER_WORKSPACE_QUERY_KEY.workspaces })
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: (workspaceId: string) => deleteAdminWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CODER_WORKSPACE_QUERY_KEY.workspaces })
    },
  })

  return {
    useFetchAdminWorkspaces,
    startWorkspace,
    stopWorkspace,
    deleteWorkspace,
  }
}
