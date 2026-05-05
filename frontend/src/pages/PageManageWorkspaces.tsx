// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Spinner } from '@/components/atoms/spinner'
import { useToast } from '@/components/molecules/toaster/use-toast'
import DaConfirmPopup from '@/components/molecules/DaConfirmPopup'
import { useAdminCoderWorkspaces } from '@/hooks/useAdminCoderWorkspaces'
import { MyWorkspace } from '@/services/coder.service'
import { TbExternalLink, TbTrash } from 'react-icons/tb'

const normalizeStatus = (status?: string) => String(status || 'unknown').toLowerCase()
const PAGE_SIZE = 25

const PageManageWorkspaces = () => {
  const { useFetchAdminWorkspaces, startWorkspace, stopWorkspace, deleteWorkspace } = useAdminCoderWorkspaces()
  const { data: workspaces = [], isLoading, isRefetching, refetch } = useFetchAdminWorkspaces()
  const { toast } = useToast()
  const [workspaceToStop, setWorkspaceToStop] = useState<MyWorkspace | null>(null)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<MyWorkspace | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const rows = useMemo(() => {
    return [...workspaces].sort((a, b) => a.name.localeCompare(b.name))
  }, [workspaces])

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    return rows.filter((workspace) => {
      const status = normalizeStatus(workspace.status)
      const owner = String(workspace.ownerEmail || workspace.ownerName || '').toLowerCase()
      const name = String(workspace.name || '').toLowerCase()
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const matchesSearch = !query || name.includes(query) || owner.includes(query)
      return matchesStatus && matchesSearch
    })
  }, [rows, searchValue, statusFilter])

  const visibleRows = useMemo(() => {
    return filteredRows.slice(0, visibleCount)
  }, [filteredRows, visibleCount])

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchValue, statusFilter])

  useEffect(() => {
    if (visibleCount > filteredRows.length && filteredRows.length > 0) {
      setVisibleCount(filteredRows.length)
    }
  }, [visibleCount, filteredRows.length])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredRows.length))
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [filteredRows.length])

  const handleOpenWorkspace = (workspace: MyWorkspace) => {
    const status = normalizeStatus(workspace.status)
    if (status !== 'running' || !workspace.openPath) {
      toast({
        title: 'Cannot open workspace',
        description: 'Open URL is available only when the workspace is running.',
        duration: 2500,
      })
      return
    }
    window.open(workspace.openPath, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex w-full h-full bg-slate-200 p-2">
      <div className="flex w-full h-full justify-center bg-white rounded-xl">
        <div className="flex flex-col w-full max-w-[90vw] xl:max-w-[86vw] 2xl:max-w-[80vw]">
          <div className="flex flex-col items-center container mt-6 w-full">
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-foreground">Manage Workspaces</h1>
                <p className="text-sm mt-1 text-muted-foreground">
                  Admin workspace management across all users.
                </p>
              </div>
            </div>

            <div className="mt-4 w-full px-4">
              <div className="flex w-full items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    className="h-9 w-[280px] rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Search workspace or owner"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All status</option>
                    <option value="running">running</option>
                    <option value="stopped">stopped</option>
                    <option value="starting">starting</option>
                    <option value="stopping">stopping</option>
                    <option value="deleting">deleting</option>
                    <option value="failed">failed</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {visibleRows.length} of {filteredRows.length}
                </div>
              </div>
              <div className="flex w-full items-center text-muted-foreground font-semibold text-sm py-2 border-b border-muted-foreground">
                <div className="grow">Workspace</div>
                <div className="w-[220px] min-w-[220px]">Owner</div>
                <div className="w-[140px] min-w-[140px]">Status</div>
                <div className="w-[320px] min-w-[320px]">Actions</div>
              </div>

              {isLoading && (
                <div className="w-full flex py-6 justify-center items-center">
                  <Spinner className="mr-2" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              )}

              {!isLoading && filteredRows.length === 0 && (
                <div className="w-full py-6 italic text-slate-500 text-center">
                  No workspaces found.
                </div>
              )}

              {!isLoading && filteredRows.length > 0 && (
                <div className="overflow-auto h-full">
                  {visibleRows.map((workspace) => {
                    const status = normalizeStatus(workspace.status)
                    const showStart = status === 'stopped'
                    const canOpenWorkspace = status === 'running' && Boolean(workspace.openPath)
                    const isStartStopPending = startWorkspace.isPending || stopWorkspace.isPending
                    return (
                      <div
                        key={workspace.id}
                        className="flex w-full items-center text-foreground font-normal text-md py-4 border-b border-input"
                      >
                        <div className="grow">
                          <div className="font-medium">{workspace.name}</div>
                        </div>
                        <div className="w-[220px] min-w-[220px] text-xs text-muted-foreground">
                          {workspace.ownerEmail || workspace.ownerName || '-'}
                        </div>
                        <div className="w-[140px] min-w-[140px]">
                          <span className="text-xs font-medium text-muted-foreground font-mono">
                            {status}
                          </span>
                        </div>
                        <div className="w-[320px] min-w-[320px] flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenWorkspace(workspace)}
                            disabled={isRefetching || !canOpenWorkspace}
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
              {!isLoading && filteredRows.length > 0 && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                  {visibleRows.length < filteredRows.length ? 'Loading more workspaces...' : 'All workspaces loaded'}
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

export default PageManageWorkspaces
