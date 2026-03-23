// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState, lazy, Suspense, useRef, useCallback } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'
import {
  getWorkspaceUrl,
  prepareWorkspace,
  getWorkspaceStatus,
  getWorkspaceLogs,
  WorkspaceInfo,
  WorkspaceStatus,
  WorkspaceAgentLog,
} from '@/services/coder.service'
import CoderWorkspaceStatus from '@/components/molecules/CoderWorkspaceStatus'
import { useParams } from 'react-router-dom'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import useCoderWorkspaceStore from '@/stores/coderWorkspaceStore'

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)

interface PrototypeTabVSCodeProps {
  isActive?: boolean
}

const PrototypeTabVSCode: FC<PrototypeTabVSCodeProps> = ({ isActive = true }) => {
  const { prototype_id } = useParams<{ prototype_id: string }>()
  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const cachedEntry = useCoderWorkspaceStore((state) =>
    prototype_id ? state.byPrototypeId[prototype_id] : undefined,
  )
  const upsertCacheEntry = useCoderWorkspaceStore((state) => state.upsertEntry)

  // Coder workspace state
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null)
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus | null>(null)
  const [workspaceLogs, setWorkspaceLogs] = useState<WorkspaceAgentLog[]>([])
  const [isWorkspaceReadyFromLogs, setIsWorkspaceReadyFromLogs] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)
  const workspacePollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastLogIdRef = useRef<number | null>(null)

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState(600) // Initial width in px
  const [isResizing, setIsResizing] = useState(false)
  const [isApiPanelCollapsed, setIsApiPanelCollapsed] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Load Coder workspace
  useEffect(() => {
    if (!prototype_id) {
      setIsLoadingWorkspace(false)
      setWorkspaceError('Prototype ID is required')
      return
    }

    if (!isActive) {
      // Keep state for instant resume, but stop background polling when tab is hidden
      if (workspacePollIntervalRef.current) {
        clearInterval(workspacePollIntervalRef.current)
        workspacePollIntervalRef.current = null
      }
      setIsLoadingWorkspace(false)
      return
    }

    if (!isAuthorized) {
      setIsLoadingWorkspace(false)
      setWorkspaceError('You do not have permission to access this workspace')
      return
    }

    const loadWorkspace = async () => {
      try {
        const canUseCache =
          !!cachedEntry?.workspaceInfo?.appUrl &&
          cachedEntry?.workspaceStatus?.status === 'running' &&
          cachedEntry?.isWorkspaceReadyFromLogs

        if (canUseCache) {
          setWorkspaceInfo(cachedEntry.workspaceInfo)
          setWorkspaceStatus(cachedEntry.workspaceStatus)
          setWorkspaceLogs(cachedEntry.workspaceLogs || [])
          setIsWorkspaceReadyFromLogs(true)
          setWorkspaceError(null)
          setIsLoadingWorkspace(false)
          lastLogIdRef.current = cachedEntry.workspaceLogs?.at(-1)?.id ?? null

          // Keep polling in background to refresh status/logs silently
          startWorkspacePolling(prototype_id)
          return
        }

        setIsLoadingWorkspace(true)
        setWorkspaceError(null)
        setWorkspaceLogs([])
        setIsWorkspaceReadyFromLogs(false)
        lastLogIdRef.current = null

        // Always prepare workspace first (idempotent: creates folder, seeds code, reuses existing workspace)
        try {
          await prepareWorkspace(prototype_id)
        } catch (prepareError: any) {
          if (prepareError.response?.status !== 409) {
            console.error('[PrototypeTabVSCode] Failed to prepare workspace:', prepareError)
            setWorkspaceError(prepareError.message || 'Failed to prepare workspace')
            setIsLoadingWorkspace(false)
            return
          }
        }

        // Start polling for workspace readiness
        startWorkspacePolling(prototype_id)
      } catch (error: any) {
        console.error('[PrototypeTabVSCode] Failed to load workspace:', error)
        setWorkspaceError(error.message || 'Failed to load workspace')
        setIsLoadingWorkspace(false)
      }
    }

    loadWorkspace()

    return () => {
      if (workspacePollIntervalRef.current) {
        clearInterval(workspacePollIntervalRef.current)
      }
    }
  }, [prototype_id, isAuthorized, isActive])

  // Persist workspace state across tab switches (route unmount/remount)
  useEffect(() => {
    if (!prototype_id) return
    upsertCacheEntry(prototype_id, {
      workspaceInfo,
      workspaceStatus,
      workspaceLogs,
      isWorkspaceReadyFromLogs,
    })
  }, [prototype_id, workspaceInfo, workspaceStatus, workspaceLogs, isWorkspaceReadyFromLogs, upsertCacheEntry])

  // Poll workspace status + logs until logs indicate readiness
  const startWorkspacePolling = (prototypeId: string) => {
    if (workspacePollIntervalRef.current) {
      clearInterval(workspacePollIntervalRef.current)
    }

    workspacePollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getWorkspaceStatus(prototypeId)
        setWorkspaceStatus(status)

        // Fetch workspace logs when workspace exists
        let readyFromLogs = false
        if (status.exists) {
          try {
            const logs = await getWorkspaceLogs(prototypeId, {
              after: lastLogIdRef.current ?? undefined,
              format: 'json',
            })

            if (Array.isArray(logs)) {
              if (logs.length > 0) {
                const typedLogs = logs as WorkspaceAgentLog[]
                const mergedLogs =
                  lastLogIdRef.current == null ? typedLogs : [...workspaceLogs, ...typedLogs]

                setWorkspaceLogs(mergedLogs)
                lastLogIdRef.current = mergedLogs[mergedLogs.length - 1]?.id ?? lastLogIdRef.current

                // Stop condition: when we see the specific "workspace ready" log line
                readyFromLogs = mergedLogs.some(
                  (log) =>
                    typeof log.output === 'string' &&
                    log.output.includes(
                      'Setup complete.',
                    ),
                )
              }
            }
          } catch {
            // Ignore log fetching errors, keep polling status/timings
          }
        }

        // Clear any previous errors if we're making progress
        if (status.exists && status.status !== 'failed' && workspaceError) {
          setWorkspaceError(null)
        }

        if (readyFromLogs) {
          setIsWorkspaceReadyFromLogs(true)
        }

        const ready = status.status === 'running' && readyFromLogs

        if (ready) {
          // Workspace and timings both look ready: resolve URL (if needed) and stop polling
          try {
            if (!workspaceInfo?.appUrl) {
              const info = await getWorkspaceUrl(prototypeId)
              setWorkspaceInfo(info)
            }
            setIsLoadingWorkspace(false)
            setWorkspaceError(null)
            if (workspacePollIntervalRef.current) {
              clearInterval(workspacePollIntervalRef.current)
              workspacePollIntervalRef.current = null
            }
          } catch {
            // If URL resolution fails, keep polling; iframe won't render until appUrl is set
          }
        } else if (status.status === 'failed') {
          // Workspace failed - stop polling and show error
          console.error('[PrototypeTabVSCode] Workspace failed to start')
          setWorkspaceError('Workspace failed to start. Please try again.')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        } else if (status.status === 'canceled') {
          // Workspace creation was canceled
          setWorkspaceError('Workspace creation was canceled')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        }
        // For other statuses or non-ready timings, just continue polling
      } catch (error: any) {
        // Don't stop polling on transient errors - might be network issues
        // Only stop if it's a persistent 404 (workspace doesn't exist)
        if (error.response?.status === 404) {
          console.error('[PrototypeTabVSCode] Workspace not found during poll')
          setWorkspaceError('Workspace not found')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        }
        // Otherwise, continue polling - might be a transient error
      }
    }, 3000) // Poll every 3 seconds
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = rightPanelWidth
      // Disable transitions during resize for instant feedback
      const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement
      const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement
      if (leftPanel) leftPanel.style.transition = 'none'
      if (rightPanel) rightPanel.style.transition = 'none'
      setIsResizing(true)
    },
    [rightPanelWidth],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const minWidth = 300
      const maxWidth = 800
      const deltaX = e.clientX - startXRef.current
      // Dragging left (negative deltaX) increases width, dragging right (positive deltaX) decreases width
      const newWidth = Math.min(
        Math.max(startWidthRef.current - deltaX, minWidth),
        maxWidth,
      )
      setRightPanelWidth(newWidth)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    // Re-enable transitions after resize
    const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement
    const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement
    if (leftPanel) leftPanel.style.transition = ''
    if (rightPanel) rightPanel.style.transition = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // If user collapses the panel, stop any ongoing resize interaction.
  useEffect(() => {
    if (!isApiPanelCollapsed) return
    setIsResizing(false)
  }, [isApiPanelCollapsed])

  // Always render the component, even if prototype isn't loaded yet
  // The workspace loading depends on prototype_id from URL, not prototype from store
  const shouldShowIframe =
    !isLoadingWorkspace &&
    !!workspaceInfo?.appUrl &&
    workspaceStatus?.status === 'running' &&
    isWorkspaceReadyFromLogs
  return (
    <div className="flex h-[calc(100%-0px)] w-full p-2 bg-gray-100">
      <div
        className="flex h-full flex-1 min-w-0 flex-col border-r bg-white rounded-md"
        style={{ marginRight: '0px' }}
      >
        {!shouldShowIframe ? (
          <CoderWorkspaceStatus
            status={workspaceStatus || { exists: false, status: 'not_created' }}
            error={workspaceError}
            logs={workspaceLogs}
          />
        ) : workspaceInfo?.appUrl ? (
          <iframe
            src={`${workspaceInfo.appUrl}?folder=${encodeURIComponent(workspaceInfo.folderPath || '/home/coder/prototypes')}`}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write;"
            title="Coder Workspace"
          />
        ) : (
          <CoderWorkspaceStatus status={workspaceStatus || { exists: false, status: 'not_created' }} error="Workspace URL not available" />
        )}
      </div>
      {!isApiPanelCollapsed && (
        // Resize handle (hide while collapsed to avoid weird interactions).
        <div
          ref={resizeRef}
          className="w-1 bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors cursor-col-resize shrink-0"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
          style={{ margin: '2px'}}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={`w-0.5 h-8 bg-gray-400 transition-opacity ${
                isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'
              }`}
            />
          </div>
        </div>
      )}
      <div
        className="flex h-full flex-col bg-white rounded-md shrink-0 transition-[width] duration-200 ease-in-out"
        style={{ width: isApiPanelCollapsed ? '48px' : `${rightPanelWidth}px` }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          }
        >
          <PrototypeTabCodeApiPanel
            code={prototype?.code || ''}
            onCollapsedChange={setIsApiPanelCollapsed}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default PrototypeTabVSCode
