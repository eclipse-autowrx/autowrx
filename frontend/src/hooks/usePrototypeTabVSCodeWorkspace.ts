import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useParams } from 'react-router-dom'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import useAuthStore from '@/stores/authStore'
import useWorkspaceRuntimeUiStore from '@/stores/workspaceRuntimeUiStore'
import { PERMISSIONS } from '@/data/permission'
import config from '@/configs/config'
import {
  getWorkspaceUrl,
  prepareWorkspace,
} from '@/services/coder.service'

type WorkspaceState = {
  hasActivatedOnce: boolean
  prepareError: string | null
  workspaceAppUrl: string | null
  isIframeLoaded: boolean
  iframeLoadError: string | null
  watchEvents: any[]
  logEvents: any[]
}

type WorkspaceAction =
  | { type: 'ACTIVATE' }
  | { type: 'RESET_FOR_PREPARE' }
  | { type: 'PREPARE_ERROR'; message: string }
  | { type: 'PREPARE_ERROR_IF_EMPTY'; message: string }
  | { type: 'APPEND_WATCH_EVENT'; event: any }
  | { type: 'APPEND_LOG_EVENT'; event: any }
  | { type: 'IFRAME_START_LOADING' }
  | { type: 'SET_WORKSPACE_URL'; appUrl: string }
  | { type: 'IFRAME_LOADED' }
  | { type: 'IFRAME_ERROR'; message: string }

const MAX_EVENT_COUNT = 200

function appendLimited(prev: any[], event: any) {
  const next = [...prev, event]
  return next.length > MAX_EVENT_COUNT ? next.slice(next.length - MAX_EVENT_COUNT) : next
}

/**
 * Use a same-origin iframe URL (proxied by Vite dev server or backend reverse proxy)
 * so browser cookies are first-party and reliably attached.
 */
const toSameOriginCoderPath = (appUrl: string): string => {
  try {
    const url = new URL(appUrl)
    return `/coder${url.pathname}${url.search}${url.hash}`
  } catch {
    return appUrl
  }
}

const buildCoderWorkspaceIframeSrc = (appUrl: string, folderPath?: string | null): string => {
  const basePath = toSameOriginCoderPath(appUrl)
  let url: URL
  try {
    url = new URL(basePath, window.location.origin)
  } catch {
    const params = new URLSearchParams()
    if (folderPath) params.set('folder', folderPath)
    const q = params.toString()
    if (!q) return basePath
    const sep = basePath.includes('?') ? '&' : '?'
    return `${basePath}${sep}${q}`
  }
  if (folderPath) url.searchParams.set('folder', folderPath)
  return `${url.pathname}${url.search}${url.hash}`
}

const getLatestWorkspaceFromWatchEvents = (events: any[]) => {
  const latest = [...events].reverse().find((event) => event?.type === 'data' && event?.data)
  return latest?.data ?? null
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'ACTIVATE':
      return { ...state, hasActivatedOnce: true }
    case 'RESET_FOR_PREPARE':
      return {
        ...state,
        prepareError: null,
        workspaceAppUrl: null,
        isIframeLoaded: false,
        iframeLoadError: null,
        watchEvents: [],
        logEvents: [],
      }
    case 'PREPARE_ERROR':
      return { ...state, prepareError: action.message }
    case 'PREPARE_ERROR_IF_EMPTY':
      return { ...state, prepareError: state.prepareError || action.message }
    case 'APPEND_WATCH_EVENT':
      return { ...state, watchEvents: appendLimited(state.watchEvents, action.event) }
    case 'APPEND_LOG_EVENT':
      return { ...state, logEvents: appendLimited(state.logEvents, action.event) }
    case 'IFRAME_START_LOADING':
      return { ...state, workspaceAppUrl: null, isIframeLoaded: false, iframeLoadError: null }
    case 'SET_WORKSPACE_URL':
      return {
        ...state,
        workspaceAppUrl: action.appUrl,
        logEvents: appendLimited(state.logEvents, {
          type: 'ui',
          event: 'iframe_waiting',
          stage: 'Loading VS Code',
          message: 'Waiting for VS Code iframe to load...',
        }),
      }
    case 'IFRAME_LOADED':
      return {
        ...state,
        isIframeLoaded: true,
        logEvents: appendLimited(state.logEvents, {
          type: 'ui',
          event: 'iframe_loaded',
          stage: 'Loading VS Code',
          message: 'VS Code iframe loaded successfully.',
        }),
      }
    case 'IFRAME_ERROR': {
      const stickyPrepare = state.prepareError || action.message
      return {
        ...state,
        iframeLoadError: action.message,
        isIframeLoaded: false,
        workspaceAppUrl: null,
        prepareError: stickyPrepare,
        logEvents: appendLimited(state.logEvents, {
          type: 'ui',
          event: 'iframe_error',
          stage: 'Loading VS Code',
          log_level: 'error',
          output: action.message,
        }),
      }
    }
    default:
      return state
  }
}

export default function usePrototypeTabVSCodeWorkspace(isActive: boolean) {
  const { prototype_id } = useParams<{ prototype_id: string }>()
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const accessToken = useAuthStore((state) => state.access?.token)
  const setIframeLoadedForRuntime = useWorkspaceRuntimeUiStore(
    (state) => state.setIframeLoaded,
  )

  const lastResolvedBuildIdRef = useRef<string | null>(null)
  const watchSocketRef = useRef<WebSocket | null>(null)
  const logsSocketRef = useRef<WebSocket | null>(null)

  const [state, dispatch] = useReducer(workspaceReducer, {
    hasActivatedOnce: false,
    prepareError: null,
    workspaceAppUrl: null,
    isIframeLoaded: false,
    iframeLoadError: null,
    watchEvents: [],
    logEvents: [],
  })

  useEffect(() => {
    if (!isActive || state.hasActivatedOnce) return
    dispatch({ type: 'ACTIVATE' })
  }, [isActive, state.hasActivatedOnce])

  useEffect(() => {
    if (!state.hasActivatedOnce || !prototype_id || !isAuthorized || !accessToken) return

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

    const openLogsWs = (workspaceBuildId: string | null | undefined) => {
      if (logsWsOpened) return

      if (!workspaceBuildId) {
        dispatch({
          type: 'APPEND_LOG_EVENT',
          event: { type: 'socket', event: 'skipped', reason: 'missing workspaceBuildId' },
        })
        return
      }

      logsWsOpened = true

      const wsBase = toWsBase(config.serverBaseUrl)
      const logsUrl = `${wsBase}/${config.serverVersion}/system/coder/workspacebuilds/${workspaceBuildId}/logs?access_token=${encodeURIComponent(accessToken)}&follow=true&after=-1&prototype_id=${encodeURIComponent(prototype_id)}`

      const logsWs = new WebSocket(logsUrl)
      logsSocketRef.current = logsWs

      logsWs.onopen = () => {
        dispatch({ type: 'APPEND_LOG_EVENT', event: { type: 'socket', event: 'open' } })
      }
      logsWs.onmessage = (event) => {
        try {
          dispatch({
            type: 'APPEND_LOG_EVENT',
            event: JSON.parse(String(event.data)),
          })
        } catch {
          dispatch({ type: 'APPEND_LOG_EVENT', event: { raw: String(event.data) } })
        }
      }
      logsWs.onerror = () => {
        dispatch({ type: 'APPEND_LOG_EVENT', event: { type: 'socket', event: 'error' } })
      }
      logsWs.onclose = (event) => {
        dispatch({
          type: 'APPEND_LOG_EVENT',
          event: {
            type: 'socket',
            event: 'close',
            code: event.code,
            reason: event.reason,
          },
        })
      }
    }

    const run = async () => {
      dispatch({ type: 'RESET_FOR_PREPARE' })
      lastResolvedBuildIdRef.current = null

      const response = await prepareWorkspace(prototype_id)
      if (cancelled) return

      const wsBase = toWsBase(config.serverBaseUrl)

      openLogsWs(response.workspaceBuildId)

      const watchUrl = `${wsBase}/${config.serverVersion}/system/coder/workspace/${prototype_id}/watch-ws?access_token=${encodeURIComponent(accessToken)}`
      const watchWs = new WebSocket(watchUrl)
      watchSocketRef.current = watchWs

      watchWs.onopen = () => {
        dispatch({ type: 'APPEND_WATCH_EVENT', event: { type: 'socket', event: 'open' } })
      }
      watchWs.onmessage = (event) => {
        try {
          dispatch({ type: 'APPEND_WATCH_EVENT', event: JSON.parse(String(event.data)) })
        } catch {
          dispatch({ type: 'APPEND_WATCH_EVENT', event: { raw: String(event.data) } })
        }
      }
      watchWs.onerror = () => {
        dispatch({ type: 'APPEND_WATCH_EVENT', event: { type: 'socket', event: 'error' } })
      }
      watchWs.onclose = (event) => {
        dispatch({
          type: 'APPEND_WATCH_EVENT',
          event: {
            type: 'socket',
            event: 'close',
            code: event.code,
            reason: event.reason,
          },
        })
      }
    }

    void run().catch((error: any) => {
      if (cancelled) return
      const message =
        error?.response?.data?.message || error?.message || 'Failed to prepare workspace'
      dispatch({ type: 'PREPARE_ERROR', message: String(message) })
    })

    return () => {
      cancelled = true
      closeSockets()
    }
  }, [state.hasActivatedOnce, prototype_id, isAuthorized, accessToken])

  const watchBuildSnapshot = useMemo(() => {
    const latestBuild =
      getLatestWorkspaceFromWatchEvents(state.watchEvents)?.latest_build
    const jobStatus = latestBuild?.job?.status ?? null
    const buildId = latestBuild?.id ? String(latestBuild.id) : null
    const agents =
      latestBuild?.resources?.flatMap((resource: any) => resource?.agents ?? []) ?? []
    const hasConnectedAgent = agents.some((agent: any) => agent?.status === 'connected')

    return {
      buildId,
      isReady: jobStatus === 'succeeded' && hasConnectedAgent,
      isFailed: jobStatus === 'failed' || jobStatus === 'canceled',
      failureMessage: latestBuild?.job?.error ?? null,
    }
  }, [state.watchEvents])

  useEffect(() => {
    if (!state.hasActivatedOnce || !prototype_id) return
    if (!watchBuildSnapshot.isReady || !watchBuildSnapshot.buildId) return
    if (lastResolvedBuildIdRef.current === watchBuildSnapshot.buildId) return

    let cancelled = false
    dispatch({ type: 'IFRAME_START_LOADING' })

    const run = async () => {
      try {
        const workspace = await getWorkspaceUrl(prototype_id)
        if (cancelled) return

        if (!workspace?.appUrl) throw new Error('Workspace is ready but app URL is missing')

        const appSrc = buildCoderWorkspaceIframeSrc(workspace.appUrl, workspace.folderPath)
        dispatch({ type: 'SET_WORKSPACE_URL', appUrl: appSrc })
        lastResolvedBuildIdRef.current = watchBuildSnapshot.buildId
      } catch (error: any) {
        if (cancelled) return
        const message =
          error?.response?.data?.message || error?.message || 'Failed to open workspace iframe'
        dispatch({ type: 'IFRAME_ERROR', message: String(message) })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [state.hasActivatedOnce, prototype_id, watchBuildSnapshot.isReady, watchBuildSnapshot.buildId])

  useEffect(() => {
    if (!state.hasActivatedOnce || !watchBuildSnapshot.isFailed) return

    dispatch({
      type: 'PREPARE_ERROR_IF_EMPTY',
      message: watchBuildSnapshot.failureMessage || 'Workspace build failed',
    })
  }, [state.hasActivatedOnce, watchBuildSnapshot.isFailed, watchBuildSnapshot.failureMessage])

  useEffect(() => {
    if (!prototype_id) return
    setIframeLoadedForRuntime(prototype_id, state.isIframeLoaded)
  }, [prototype_id, setIframeLoadedForRuntime, state.isIframeLoaded])

  useEffect(() => {
    if (!prototype_id) return
    return () => {
      setIframeLoadedForRuntime(prototype_id, false)
    }
  }, [prototype_id, setIframeLoadedForRuntime])

  useEffect(() => {
    if (!state.isIframeLoaded) return

    const watchWs = watchSocketRef.current
    if (!watchWs) return

    if (watchWs.readyState === WebSocket.OPEN || watchWs.readyState === WebSocket.CONNECTING) {
      watchWs.close(1000, 'iframe loaded')
    }
    watchSocketRef.current = null
  }, [state.isIframeLoaded])

  const shouldMountIframe = Boolean(state.workspaceAppUrl && !state.iframeLoadError)
  const showIframe = shouldMountIframe && state.isIframeLoaded

  const handleIframeLoad = () => dispatch({ type: 'IFRAME_LOADED' })

  const handleIframeError = () =>
    dispatch({ type: 'IFRAME_ERROR', message: 'Failed to load workspace iframe' })

  return {
    prepareError: state.prepareError,
    watchEvents: state.watchEvents,
    logEvents: state.logEvents,
    workspaceAppUrl: state.workspaceAppUrl,
    iframeLoadError: state.iframeLoadError,
    shouldMountIframe,
    showIframe,
    handleIframeLoad,
    handleIframeError,
  }
}

