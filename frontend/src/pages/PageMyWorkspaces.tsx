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
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { useCoderWorkspaces } from '@/hooks/useCoderWorkspaces'
import { MyWorkspace } from '@/services/coder.service'
import { TbTrash } from 'react-icons/tb'

const normalizeStatus = (status?: string) => String(status || 'unknown').toLowerCase()

const PageMyWorkspaces = () => {
  const { useFetchMyWorkspaces, deleteWorkspace } = useCoderWorkspaces()
  const { data: workspaces = [], isLoading, isRefetching, refetch } = useFetchMyWorkspaces()
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
