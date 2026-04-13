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
  useMemo,
  lazy,
  Suspense,
  useRef,
  useCallback,
} from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'
import { useParams } from 'react-router-dom'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import {
  getWorkspaceUrl,
  prepareWorkspace,
  WorkspaceInfo,
} from '@/services/coder.service'
import useModelStore from '@/stores/modelStore'
import useAuthStore from '@/stores/authStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import config from '@/configs/config'
import CoderWorkspaceStatus from '@/components/molecules/CoderWorkspaceStatus'

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)

/** Path-based Coder apps need session in the URL; see instance-setup/coder/coder-integration-flow.md */
const buildCoderWorkspaceIframeSrc = (
  appUrl: string,
  folderPath?: string | null,
  sessionToken?: string | null,
): string => {
  let url: URL
  try {
    url = new URL(appUrl)
  } catch {
    const params = new URLSearchParams()
    if (folderPath) params.set('folder', folderPath)
    if (sessionToken) {
      params.set('coder_session_token', sessionToken)
      params.set('token', sessionToken)
    }
    const q = params.toString()
    if (!q) return appUrl
    const sep = appUrl.includes('?') ? '&' : '?'
    return `${appUrl}${sep}${q}`
  }
  if (folderPath) url.searchParams.set('folder', folderPath)
  if (sessionToken) {
    url.searchParams.set('coder_session_token', sessionToken)
    url.searchParams.set('token', sessionToken)
  }
  return url.toString()
}

interface PrototypeTabVSCodeProps {
  isActive?: boolean
}

const getLatestWorkspaceFromWatchEvents = (events: any[]) => {
  const latest = [...events]
    .reverse()
    .find((event) => event?.type === 'data' && event?.data)
  return latest?.data ?? null
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
  const accessToken = useAuthStore((state) => state.access?.token)
  const [prepareResponse, setPrepareResponse] = useState<WorkspaceInfo | null>(
    null,
  )
  const [prepareError, setPrepareError] = useState<string | null>(null)
  const [workspaceAppUrl, setWorkspaceAppUrl] = useState<string | null>(null)
  const [isIframeLoading, setIsIframeLoading] = useState(false)
  const [iframeLoadError, setIframeLoadError] = useState<string | null>(null)
  const [watchEvents, setWatchEvents] = useState<any[]>([])
  const [logEvents, setLogEvents] = useState<any[]>([])
  const lastResolvedBuildIdRef = useRef<string | null>(null)

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState<number | null>(null) // Will be calculated based on container
  const [isResizing, setIsResizing] = useState(false)
  const [isApiPanelCollapsed, setIsApiPanelCollapsed] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const watchSocketRef = useRef<WebSocket | null>(null)
  const logsSocketRef = useRef<WebSocket | null>(null)

  // Step 1: prepare Coder workspace for this prototype (no polling/cache).
  useEffect(() => {
    if (!isActive) return
    if (!prototype_id || !isAuthorized || !accessToken) return

    let cancelled = false
    let logsWsOpened = false

    const closeSockets = () => {
      if (watchSocketRef.current) {
        watchSocketRef.current.close()
        watchSocketRef.current = null
      }
      if (logsSocketRef.current) {
        logsSocketRef.current.close()
        logsSocketRef.current = null
      }
    }

    const toWsBase = (baseUrl: string) => {
      if (baseUrl.startsWith('https://')) return baseUrl.replace('https://', 'wss://')
      if (baseUrl.startsWith('http://')) return baseUrl.replace('http://', 'ws://')
      return `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}`
    }

    const appendEvent = (setter: React.Dispatch<React.SetStateAction<any[]>>, event: any) => {
      setter((prev) => {
        const next = [...prev, event]
        return next.length > 200 ? next.slice(next.length - 200) : next
      })
    }

    const openLogsWs = (workspaceBuildId: string | null | undefined) => {
      if (logsWsOpened) return
      if (!workspaceBuildId) {
        appendEvent(setLogEvents, {
          type: 'socket',
          event: 'skipped',
          reason: 'missing workspaceBuildId',
        })
        return
      }
      logsWsOpened = true

      const wsBase = toWsBase(config.serverBaseUrl)
      const logsUrl = `${wsBase}/${config.serverVersion}/system/coder/workspacebuilds/${workspaceBuildId}/logs?access_token=${encodeURIComponent(accessToken)}&follow=true&after=-1`
      const logsWs = new WebSocket(logsUrl)
      logsSocketRef.current = logsWs

      logsWs.onopen = () => {
        appendEvent(setLogEvents, { type: 'socket', event: 'open' })
      }

      logsWs.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data))
          appendEvent(setLogEvents, parsed)
        } catch {
          appendEvent(setLogEvents, { raw: String(event.data) })
        }
      }

      logsWs.onerror = () => {
        appendEvent(setLogEvents, { type: 'socket', event: 'error' })
      }

      logsWs.onclose = (event) => {
        appendEvent(setLogEvents, {
          type: 'socket',
          event: 'close',
          code: event.code,
          reason: event.reason,
        })
      }
    }

    const run = async () => {
      try {
        setPrepareError(null)
        lastResolvedBuildIdRef.current = null
        setWorkspaceAppUrl(null)
        setIframeLoadError(null)
        setIsIframeLoading(false)
        setWatchEvents([])
        setLogEvents([])

        const response = await prepareWorkspace(prototype_id)
        if (cancelled) return
        setPrepareResponse(response)

        const wsBase = toWsBase(config.serverBaseUrl)

        // Open logs immediately in parallel with watch, using workspaceBuildId from prepare response.
        openLogsWs(response.workspaceBuildId)

        const watchUrl = `${wsBase}/${config.serverVersion}/system/coder/workspace/${prototype_id}/watch-ws?access_token=${encodeURIComponent(accessToken)}`
        const watchWs = new WebSocket(watchUrl)
        watchSocketRef.current = watchWs

        watchWs.onopen = () => {
          appendEvent(setWatchEvents, { type: 'socket', event: 'open' })
        }

        watchWs.onmessage = (event) => {
          try {
            const parsed = JSON.parse(String(event.data))
            appendEvent(setWatchEvents, parsed)
          } catch {
            const raw = String(event.data)
            appendEvent(setWatchEvents, { raw })
          }
        }

        watchWs.onerror = () => {
          appendEvent(setWatchEvents, { type: 'socket', event: 'error' })
        }

        watchWs.onclose = (event) => {
          appendEvent(setWatchEvents, {
            type: 'socket',
            event: 'close',
            code: event.code,
            reason: event.reason,
          })
        }
      } catch (error: any) {
        if (cancelled) return
        setPrepareResponse(null)
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to prepare workspace'
        setPrepareError(String(message))
      }
    }

    void run()

    return () => {
      cancelled = true
      closeSockets()
    }
  }, [prototype_id, isActive, isAuthorized, accessToken])

  const latestWorkspaceFromWatch = useMemo(
    () => getLatestWorkspaceFromWatchEvents(watchEvents),
    [watchEvents],
  )

  const watchBuildSnapshot = useMemo(() => {
    const latestBuild = latestWorkspaceFromWatch?.latest_build
    const jobStatus = latestBuild?.job?.status ?? null
    const buildStatus = latestBuild?.status ?? null
    const buildId = latestBuild?.id ? String(latestBuild.id) : null
    const agents =
      latestBuild?.resources?.flatMap((resource: any) => resource?.agents ?? []) ?? []
    const hasConnectedAgent = agents.some((agent: any) => agent?.status === 'connected')
    const isReady =
      jobStatus === 'succeeded' &&
      (hasConnectedAgent || buildStatus === 'running')
    const isFailed = jobStatus === 'failed' || jobStatus === 'canceled'
    const failureMessage = latestBuild?.job?.error || null
    return { buildId, isReady, isFailed, failureMessage }
  }, [latestWorkspaceFromWatch])

  // Step 2: when watch stream says build is ready, resolve app URL and show iframe.
  useEffect(() => {
    if (!isActive) return
    if (!prototype_id || !watchBuildSnapshot.isReady || !watchBuildSnapshot.buildId) return
    if (lastResolvedBuildIdRef.current === watchBuildSnapshot.buildId) return

    let cancelled = false

    const run = async () => {
      try {
        setIframeLoadError(null)
        setIsIframeLoading(true)
        const workspace = await getWorkspaceUrl(prototype_id)
        if (cancelled) return
        if (!workspace?.appUrl) {
          throw new Error('Workspace is ready but app URL is missing')
        }
        if (!workspace.sessionToken) {
          throw new Error('Workspace session token is missing')
        }
        setWorkspaceAppUrl(
          buildCoderWorkspaceIframeSrc(
            workspace.appUrl,
            workspace.folderPath,
            workspace.sessionToken,
          ),
        )
        lastResolvedBuildIdRef.current = watchBuildSnapshot.buildId
      } catch (error: any) {
        if (cancelled) return
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to open workspace iframe'
        setIframeLoadError(String(message))
        setPrepareError((prev) => prev || String(message))
        setWorkspaceAppUrl(null)
        setIsIframeLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [prototype_id, isActive, watchBuildSnapshot])

  useEffect(() => {
    if (!watchBuildSnapshot.isFailed) return
    const message =
      watchBuildSnapshot.failureMessage ||
      'Workspace build failed'
    setPrepareError((prev) => prev || message)
  }, [watchBuildSnapshot])

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

  const showIframe = Boolean(workspaceAppUrl && !iframeLoadError)

  return (
    <div
      ref={containerRef}
      className="relative flex h-[calc(100%-0px)] w-full min-h-0 flex-1 p-2 bg-gray-100"
    >
      {/* Iframe steals pointer events; cover the splitter while dragging so resize keeps working */}
      {isResizing && (
        <div
          className="absolute inset-0 z-[200] cursor-col-resize"
          style={{ touchAction: 'none' }}
          aria-hidden
        />
      )}
      <div
        className={
          showIframe
            ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r bg-white rounded-md'
            : 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r bg-white rounded-md p-3'
        }
      >
        {showIframe ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <iframe
              src={workspaceAppUrl!}
              title="Coder Workspace"
              className="min-h-0 flex-1 border-0"
              allow="clipboard-read; clipboard-write"
              onLoad={() => setIsIframeLoading(false)}
              onError={() => {
                setIsIframeLoading(false)
                const message = 'Failed to load workspace iframe'
                setIframeLoadError(message)
                setPrepareError((prev) => prev || message)
              }}
            />
            {isIframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Spinner />
              </div>
            )}
          </div>
        ) : (
          <CoderWorkspaceStatus
            prepareResponse={prepareResponse}
            prepareError={prepareError}
            watchEvents={watchEvents}
            logEvents={logEvents}
            className="min-h-0 flex-1 overflow-y-auto"
          />
        )}
      </div>
      {!isApiPanelCollapsed && (
        // Match PrototypeTabCode: invisible track; thin grip only on hover / while dragging
        <div
          ref={resizeRef}
          className="mx-0.5 w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-blue-500 hover:bg-opacity-50"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={`h-8 w-0.5 bg-gray-400 transition-opacity ${
                isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'
              }`}
            />
          </div>
        </div>
      )}
      <div
        className="flex h-full min-h-0 shrink-0 flex-col rounded-md bg-white transition-all duration-200 ease-in-out"
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
          />
        </Suspense>
      </div>
    </div>
  )
}

export default PrototypeTabVSCode
