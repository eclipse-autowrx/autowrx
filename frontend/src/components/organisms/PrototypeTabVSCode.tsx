// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  FC,
  useEffect,
  useState,
  lazy,
  Suspense,
  useRef,
  useCallback,
} from 'react'
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

/** Poll interval while waiting for workspace / logs (was 3s; faster feedback for tab open). */
const WORKSPACE_POLL_INTERVAL_MS = 1000

/** Background refresh when workspace already shown (lighter load on API). */
const WORKSPACE_POLL_INTERVAL_IDLE_MS = 5000

interface PrototypeTabVSCodeProps {
  isActive?: boolean
}

const PrototypeTabVSCode: FC<PrototypeTabVSCodeProps> = ({
  isActive = true,
}) => {
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
  const [workspaceStatus, setWorkspaceStatus] =
    useState<WorkspaceStatus | null>(null)
  const [workspaceLogs, setWorkspaceLogs] = useState<WorkspaceAgentLog[]>([])
  const [isWorkspaceReadyFromLogs, setIsWorkspaceReadyFromLogs] =
    useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)
  const workspacePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const lastLogIdRef = useRef<number | null>(null)
  const workspaceInfoRef = useRef<WorkspaceInfo | null>(null)
  const workspaceLogsRef = useRef<WorkspaceAgentLog[]>([])
  const pollCancelledRef = useRef(false)

  useEffect(() => {
    workspaceInfoRef.current = workspaceInfo
  }, [workspaceInfo])

  useEffect(() => {
    workspaceLogsRef.current = workspaceLogs
  }, [workspaceLogs])

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState<number | null>(null) // Will be calculated based on container
  const [isResizing, setIsResizing] = useState(false)
  const [isApiPanelCollapsed, setIsApiPanelCollapsed] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const buildCoderIframeSrc = useCallback((info: WorkspaceInfo) => {
    const url = new URL(info.appUrl)
    const folder = info.folderPath || '/home/coder/prototypes'
    url.searchParams.set('folder', folder)

    // When Coder is embedded in an iframe, reusing browser cookies is brittle.
    // Attach the per-user token so the iframe can authenticate directly.
    if (info.sessionToken) {
      url.searchParams.set('token', info.sessionToken)
      url.searchParams.set('coder_session_token', info.sessionToken)
    }

    return url.toString()
  }, [])

  // Calculate initial width based on container size with 6:4 ratio (60% editor, 40% API panel)
  // Guard against hidden/inactive tabs where measured width can be 0.
  useEffect(() => {
    const calculateInitialWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        if (containerWidth <= 0) return
        const calculatedWidth = containerWidth * 0.4
        setRightPanelWidth(calculatedWidth)
      }
    }

    // Defer one frame so layout can settle when switching tabs.
    const rafId = window.requestAnimationFrame(calculateInitialWidth)

    window.addEventListener('resize', calculateInitialWidth)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', calculateInitialWidth)
    }
  }, [isActive])

  // Poll workspace status + logs until logs indicate readiness
  const startWorkspacePolling = useCallback(
    (prototypeId: string, options?: { idle?: boolean }) => {
      const pollIntervalMs = options?.idle
        ? WORKSPACE_POLL_INTERVAL_IDLE_MS
        : WORKSPACE_POLL_INTERVAL_MS

      if (workspacePollIntervalRef.current) {
        clearInterval(workspacePollIntervalRef.current)
        workspacePollIntervalRef.current = null
      }
      pollCancelledRef.current = false

      let pollInFlight = false
      const runPoll = async () => {
        if (pollCancelledRef.current || pollInFlight) return
        pollInFlight = true
        try {
          const status = await getWorkspaceStatus(prototypeId)
          if (pollCancelledRef.current) return
          setWorkspaceStatus(status)

          let readyFromLogs = false
          if (status.exists) {
            try {
              const logs = await getWorkspaceLogs(prototypeId, {
                after: lastLogIdRef.current ?? undefined,
                format: 'json',
              })

              let merged: WorkspaceAgentLog[] = workspaceLogsRef.current
              if (Array.isArray(logs) && logs.length > 0) {
                const typedLogs = logs as WorkspaceAgentLog[]
                merged =
                  lastLogIdRef.current == null
                    ? typedLogs
                    : [...workspaceLogsRef.current, ...typedLogs]
                if (merged.length > 0) {
                  lastLogIdRef.current =
                    merged[merged.length - 1]?.id ?? lastLogIdRef.current
                }
                setWorkspaceLogs(merged)
                workspaceLogsRef.current = merged
              }

              readyFromLogs = merged.some(
                (log) =>
                  typeof log.output === 'string' &&
                  log.output.includes('Setup complete.'),
              )
              if (readyFromLogs) {
                setIsWorkspaceReadyFromLogs(true)
              }
            } catch {
              // Ignore log fetching errors, keep polling status/timings
            }
          }

          if (status.exists && status.status !== 'failed') {
            setWorkspaceError((prev) => (prev ? null : prev))
          }

          const ready = status.status === 'running' && readyFromLogs

          if (ready) {
            try {
              if (!workspaceInfoRef.current?.appUrl) {
                const info = await getWorkspaceUrl(prototypeId)
                if (pollCancelledRef.current) return
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
            console.error('[PrototypeTabVSCode] Workspace failed to start')
            setWorkspaceError('Workspace failed to start. Please try again.')
            setIsLoadingWorkspace(false)
            if (workspacePollIntervalRef.current) {
              clearInterval(workspacePollIntervalRef.current)
              workspacePollIntervalRef.current = null
            }
          } else if (status.status === 'canceled') {
            setWorkspaceError('Workspace creation was canceled')
            setIsLoadingWorkspace(false)
            if (workspacePollIntervalRef.current) {
              clearInterval(workspacePollIntervalRef.current)
              workspacePollIntervalRef.current = null
            }
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.error('[PrototypeTabVSCode] Workspace not found during poll')
            setWorkspaceError('Workspace not found')
            setIsLoadingWorkspace(false)
            if (workspacePollIntervalRef.current) {
              clearInterval(workspacePollIntervalRef.current)
              workspacePollIntervalRef.current = null
            }
          }
        } finally {
          pollInFlight = false
        }
      }

      void runPoll()
      workspacePollIntervalRef.current = setInterval(
        () => void runPoll(),
        pollIntervalMs,
      )
    },
    [],
  )

  // Load Coder workspace
  useEffect(() => {
    if (!prototype_id) {
      setIsLoadingWorkspace(false)
      setWorkspaceError('Prototype ID is required')
      return
    }

    if (!isActive) {
      // Keep state for instant resume, but stop background polling when tab is hidden
      pollCancelledRef.current = true
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
          workspaceInfoRef.current = cachedEntry.workspaceInfo
          setWorkspaceStatus(cachedEntry.workspaceStatus)
          const cachedLogs = cachedEntry.workspaceLogs || []
          setWorkspaceLogs(cachedLogs)
          workspaceLogsRef.current = cachedLogs
          setIsWorkspaceReadyFromLogs(true)
          setWorkspaceError(null)
          setIsLoadingWorkspace(false)
          lastLogIdRef.current = cachedEntry.workspaceLogs?.at(-1)?.id ?? null

          // Keep polling in background to refresh status/logs silently (lighter interval)
          startWorkspacePolling(prototype_id, { idle: true })
          return
        }

        setIsLoadingWorkspace(true)
        setWorkspaceError(null)
        setWorkspaceLogs([])
        workspaceLogsRef.current = []
        setIsWorkspaceReadyFromLogs(false)
        lastLogIdRef.current = null

        // Always prepare workspace first (idempotent: creates folder, seeds code, reuses existing workspace)
        try {
          const prepared = await prepareWorkspace(prototype_id)
          setWorkspaceStatus({
            exists: true,
            workspaceId: prepared.workspaceId,
            status: prepared.status,
          })
          const prevInfo = workspaceInfoRef.current
          const preparedInfo: WorkspaceInfo = {
            workspaceId: prepared.workspaceId,
            workspaceName: prepared.workspaceName,
            status: prepared.status,
            repoUrl: prepared.repoUrl ?? null,
            folderPath: prepared.folderPath ?? prevInfo?.folderPath,
            sessionToken: prepared.sessionToken ?? prevInfo?.sessionToken,
            appUrl: prepared.appUrl || prevInfo?.appUrl || '',
          }
          workspaceInfoRef.current = preparedInfo
          setWorkspaceInfo(preparedInfo)
        } catch (prepareError: any) {
          if (prepareError.response?.status !== 409) {
            console.error(
              '[PrototypeTabVSCode] Failed to prepare workspace:',
              prepareError,
            )
            setWorkspaceError(
              prepareError.message || 'Failed to prepare workspace',
            )
            setIsLoadingWorkspace(false)
            return
          }
        }

        // Start polling for workspace readiness (immediate first poll + 1s cadence)
        startWorkspacePolling(prototype_id)
      } catch (error: any) {
        console.error('[PrototypeTabVSCode] Failed to load workspace:', error)
        setWorkspaceError(error.message || 'Failed to load workspace')
        setIsLoadingWorkspace(false)
      }
    }

    loadWorkspace()

    return () => {
      pollCancelledRef.current = true
      if (workspacePollIntervalRef.current) {
        clearInterval(workspacePollIntervalRef.current)
        workspacePollIntervalRef.current = null
      }
    }
  }, [
    prototype_id,
    isAuthorized,
    isActive,
    startWorkspacePolling,
    // cachedEntry omitted on purpose: updates would re-run prepare; effect run already sees latest store snapshot.
  ])

  // Persist workspace state across tab switches (route unmount/remount)
  useEffect(() => {
    if (!prototype_id) return
    upsertCacheEntry(prototype_id, {
      workspaceInfo,
      workspaceStatus,
      workspaceLogs,
      isWorkspaceReadyFromLogs,
    })
  }, [
    prototype_id,
    workspaceInfo,
    workspaceStatus,
    workspaceLogs,
    isWorkspaceReadyFromLogs,
    upsertCacheEntry,
  ])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      if (rightPanelWidth !== null) {
        startWidthRef.current = rightPanelWidth
      } else if (containerRef.current) {
        startWidthRef.current = containerRef.current.offsetWidth * 0.4
      } else {
        startWidthRef.current = 0
      }
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
      if (!isResizing || !containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const minWidth = containerWidth * 0.2
      const maxWidth = containerWidth * 0.6
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
    <div
      ref={containerRef}
      className="flex h-[calc(100%-0px)] w-full p-2 bg-gray-100"
    >
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
            src={buildCoderIframeSrc(workspaceInfo)}
            className="w-full h-full border-0"
            style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
            allow="clipboard-read; clipboard-write;"
            title="Coder Workspace"
          />
        ) : (
          <CoderWorkspaceStatus
            status={workspaceStatus || { exists: false, status: 'not_created' }}
            error="Workspace URL not available"
          />
        )}
      </div>
      {!isApiPanelCollapsed && (
        // Resize handle (hide while collapsed to avoid weird interactions).
        <div
          ref={resizeRef}
          className="w-1 bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors cursor-col-resize shrink-0"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
          style={{ margin: '2px' }}
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
        style={{
          width: isApiPanelCollapsed
            ? '48px'
            : rightPanelWidth !== null
              ? `${rightPanelWidth}px`
              : '40%',
        }}
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
            enableWorkspacePolling={isActive}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default PrototypeTabVSCode
