// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { useToast } from '@/components/molecules/toaster/use-toast'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { useCoderWorkspaces } from '@/hooks/useCoderWorkspaces'
import { MyWorkspace } from '@/services/coder.service'
import { TbExternalLink, TbTrash } from 'react-icons/tb'

const normalizeStatus = (status?: string) => String(status || 'unknown').toLowerCase()

const PageMyWorkspaces = () => {
  const { useFetchMyWorkspaces, startWorkspace, stopWorkspace, deleteWorkspace } = useCoderWorkspaces()
  const { data: workspaces = [], isLoading, isRefetching, refetch } = useFetchMyWorkspaces()
  const { toast } = useToast()
  const [workspaceToStop, setWorkspaceToStop] = useState<MyWorkspace | null>(null)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<MyWorkspace | null>(null)

  const rows = useMemo(() => {
    return [...workspaces].sort((a, b) => a.name.localeCompare(b.name))
  }, [workspaces])

  useEffect(() => {
    const hasTransitionalWorkspace = rows.some((workspace) => {
      const status = normalizeStatus(workspace.status)
      return ['pending', 'starting', 'stopping', 'deleting'].includes(status)
    })
    if (!hasTransitionalWorkspace) return

    const intervalId = window.setInterval(() => {
      void refetch()
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [rows, refetch])

  const handleOpenWorkspace = (workspace: MyWorkspace) => {
    if (!workspace.openPath) {
      toast({
        title: 'Cannot open workspace',
        description: 'Open URL is not available yet for this workspace.',
        duration: 2500,
      })
      return
    }
    window.open(workspace.openPath, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex w-full h-full bg-slate-200 p-2">
      <div className="flex w-full h-full justify-center bg-white rounded-xl">
        <div className="flex flex-col w-full max-w-[88vw] xl:max-w-[80vw] 2xl:max-w-[72vw]">
          <div className="flex flex-col items-center container mt-6 w-full">
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-foreground">My Workspaces</h1>
                <p className="text-sm mt-1 text-muted-foreground">
                  Manage your Coder workspaces and open VS Code quickly.
                </p>
              </div>
            </div>

            <div className="mt-4 w-full px-4">
              <div
                className="flex w-full items-center text-muted-foreground font-semibold text-sm
                  py-2 border-b border-muted-foreground"
              >
                <div className="grow">Workspace</div>
                <div className="w-[180px] min-w-[180px]">Status</div>
                <div className="w-[320px] min-w-[320px]">Actions</div>
              </div>

              {isLoading && (
                <div className="w-full flex py-6 justify-center items-center">
                  <Spinner className="mr-2" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}

              {!isLoading && rows.length === 0 && (
                <div className="w-full py-6 italic text-slate-500 text-center">
                  You have no workspace.
                </div>
              )}

              {!isLoading && rows.length > 0 && (
                <div className="overflow-auto h-full">
                  {rows.map((workspace) => {
                    const status = normalizeStatus(workspace.status)
                    const showStart = status === 'stopped'
                    const isStartStopPending = startWorkspace.isPending || stopWorkspace.isPending
                    return (
                    <div
                      key={workspace.id}
                      className="flex w-full items-center text-foreground font-normal text-md py-4 border-b border-input"
                    >
                      <div className="grow">
                        <div className="font-medium">{workspace.name}</div>
                      </div>
                      <div className="w-[180px] min-w-[180px]">
                        <span className="text-xs font-medium text-muted-foreground font-mono">
                          {normalizeStatus(workspace.status)}
                        </span>
                      </div>
                      <div className="w-[320px] min-w-[320px] flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenWorkspace(workspace)}
                          disabled={isRefetching || !workspace.openPath}
                        >
                          <TbExternalLink className="w-4 h-4 mr-1" />
                          Open URL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isStartStopPending}
                          onClick={() => {
                            if (showStart) {
                              void startWorkspace.mutateAsync(workspace.id)
                              return
                            }
                            setWorkspaceToStop(workspace)
                          }}
                        >
                          {showStart ? 'Start' : 'Stop'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteWorkspace.isPending}
                          onClick={() => setWorkspaceToDelete(workspace)}
                        >
                          <TbTrash className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DaConfirmPopup
        state={[Boolean(workspaceToStop), (open) => !open && setWorkspaceToStop(null)]}
        title="Stop workspace"
        label={`Are you sure you want to stop the workspace "${workspaceToStop?.name || ''}"? This will terminate all running processes and disconnect any active sessions.`}
        onConfirm={async () => {
          if (!workspaceToStop?.id) return
          await stopWorkspace.mutateAsync(workspaceToStop.id)
          setWorkspaceToStop(null)
        }}
      >
        <span />
      </DaConfirmPopup>
      <DaConfirmPopup
        state={[Boolean(workspaceToDelete), (open) => !open && setWorkspaceToDelete(null)]}
        title="Delete workspace"
        label={`Delete workspace "${workspaceToDelete?.name || ''}"? This action cannot be undone.`}
        confirmText={workspaceToDelete?.name || undefined}
        onConfirm={async () => {
          if (!workspaceToDelete?.id) return
          await deleteWorkspace.mutateAsync(workspaceToDelete.id)
          setWorkspaceToDelete(null)
        }}
      >
        <span />
      </DaConfirmPopup>
    </div>
  )
}

export default PageMyWorkspaces
