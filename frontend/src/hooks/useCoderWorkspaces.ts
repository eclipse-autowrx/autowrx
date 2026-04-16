// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMyWorkspace,
  listMyWorkspaces,
  MyWorkspace,
  startMyWorkspace,
  stopMyWorkspace,
} from '@/services/coder.service'
import useAuthStore from '@/stores/authStore'

export const CODER_WORKSPACE_QUERY_KEY = {
  myWorkspaces: ['coder', 'my-workspaces'],
}

export const useCoderWorkspaces = () => {
  const queryClient = useQueryClient()
  const [authBootstrapped, accessToken] = useAuthStore((state) => [
    state.authBootstrapped,
    state.access?.token,
  ])

  const useFetchMyWorkspaces = () =>
    useQuery<MyWorkspace[]>({
      queryKey: CODER_WORKSPACE_QUERY_KEY.myWorkspaces,
      queryFn: listMyWorkspaces,
      enabled: authBootstrapped && !!accessToken,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    })

  const stopWorkspace = useMutation({
    mutationFn: (workspaceId: string) => stopMyWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODER_WORKSPACE_QUERY_KEY.myWorkspaces })
    },
  })

  const startWorkspace = useMutation({
    mutationFn: (workspaceId: string) => startMyWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODER_WORKSPACE_QUERY_KEY.myWorkspaces })
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: (workspaceId: string) => deleteMyWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODER_WORKSPACE_QUERY_KEY.myWorkspaces })
    },
  })

  return {
    useFetchMyWorkspaces,
    startWorkspace,
    stopWorkspace,
    deleteWorkspace,
  }
}
