// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import config from '@/configs/config'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { addLog } from '@/services/log.service'
import { countCodeExecution } from '@/services/prototype.service'
import {
  getWorkspaceRuntimeState,
  triggerWorkspaceRun,
} from '@/services/coder.service'
import useAuthStore from '@/stores/authStore'
import useModelStore from '@/stores/modelStore'
import useWorkspaceRuntimeStore from '@/stores/workspaceRuntimeStore'
import useWorkspaceRuntimeUiStore from '@/stores/workspaceRuntimeUiStore'
import { Prototype } from '@/types/model.type'
import { useSystemUI } from '@/hooks/useSystemUI'

export type WorkspaceRunUiStatus =
  | 'connecting'
  | 'ready'
  | 'running'
  | 'waiting_input'
  | 'exited'
  | 'error'

const RUNNER_WS_RECONNECT_MS = 1200
const OUTPUT_TAB = 'output'

const toWsBase = (baseUrl: string) => {
  if (baseUrl.startsWith('https://')) return baseUrl.replace('https://', 'wss://')
  if (baseUrl.startsWith('http://')) return baseUrl.replace('http://', 'ws://')
  return `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}`
}

const toVarsApiNamespace = (obj: Record<string, unknown> | null | undefined) => {
  const out: Record<string, unknown> = {}
  if (!obj || typeof obj !== 'object') return out
  Object.entries(obj).forEach(([key, value]) => {
    const cleanKey = String(key || '').trim()
    if (!cleanKey) return
    out[`vars.${cleanKey}`] = value
  })
  return out
}

const toRuntimeVarName = (apiName: string) => {
  const key = String(apiName || '').trim()
  return key.startsWith('vars.') ? key.slice('vars.'.length) : key
}

const notifyWidgetIframes = (data: unknown) => {
  const iframes = document.querySelectorAll('iframe')
  iframes.forEach((iframe) => {
    iframe.contentWindow?.postMessage(JSON.stringify(data), '*')
  })
}

export default function useWorkspaceRuntimeControl(options?: {
  onLegacyWrite?: (obj: Record<string, unknown>) => void
}) {
  const { prototype_id: routePrototypeId } = useParams<{
    prototype_id?: string
  }>()
  const { data: currentUser } = useSelfProfileQuery()
  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const { showPrototypeDashboardFullScreen } = useSystemUI()
  const accessToken = useAuthStore((state) => state.access?.token)

  const [setActiveApis, setTraceVars, setAppLog] = useWorkspaceRuntimeStore(
    (state) => [state.setActiveApis, state.setTraceVars, state.setAppLog],
  )

  const [isExpand, setIsExpand] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(OUTPUT_TAB)
  const [vscodeRunOutput, setVscodeRunOutput] = useState('')
  const [stdinLine, setStdinLine] = useState('')
  const [runStatus, setRunStatus] = useState<WorkspaceRunUiStatus>('connecting')
  const [wsReady, setWsReady] = useState(false)
  const [runnerReady, setRunnerReady] = useState(false)
  const [runBlockReason, setRunBlockReason] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(false)

  const prototypeIdForCoder = prototype?.id ?? routePrototypeId ?? ''
  const isVsCodeIframeLoaded = useWorkspaceRuntimeUiStore(
    (state) =>
      prototypeIdForCoder
        ? Boolean(state.iframeLoadedByPrototypeId[prototypeIdForCoder])
        : false,
  )

  const appendRuntimeText = useCallback(
    (text: string) => {
      if (!text) return
      setVscodeRunOutput((prev) => prev + text)
      setAppLog((useWorkspaceRuntimeStore.getState().appLog || '') + text)
    },
    [setAppLog],
  )

  const writeSignalValue = useCallback(
    (obj: Record<string, unknown> | null | undefined) => {
      if (!obj || typeof obj !== 'object') return
      const prev =
        (useWorkspaceRuntimeStore.getState().apisValue as Record<
          string,
          unknown
        >) || {}
      setActiveApis({ ...prev, ...obj })
    },
    [setActiveApis],
  )

  const writeVarsValue = useCallback(
    (obj: Record<string, unknown> | null | undefined) => {
      if (!obj || typeof obj !== 'object') return
      const prev =
        (useWorkspaceRuntimeStore.getState().traceVars as Record<
          string,
          unknown
        >) || {}
      setTraceVars({ ...prev, ...obj })
    },
    [setTraceVars],
  )

  const sendRunWsMessage = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(payload))
    return true
  }, [])

  const requestWriteSignalValue = useCallback(
    (obj: Record<string, unknown> | null | undefined) => {
      if (!obj || typeof obj !== 'object') return
      const entries = Object.entries(obj)
      if (entries.length === 0) return
      entries.forEach(([api, value]) => {
        const isVar = api.startsWith('vars.')
        if (isVar) {
          const runtimeVarName = toRuntimeVarName(api)
          if (!runtimeVarName) return
          void sendRunWsMessage({
            type: 'run.set_value',
            data: { api: runtimeVarName, value },
          })
          // Optimistic update for vars only
          writeSignalValue({ [api]: value })
        } else {
          // Legacy signal (Vehicle.*)
          if (options?.onLegacyWrite) {
            options.onLegacyWrite({ [api]: value })
          }
        }
      })
    },
    [options, sendRunWsMessage, writeSignalValue],
  )

  const clearOutput = useCallback(() => {
    setVscodeRunOutput('')
  }, [])

  const handleRun = useCallback(() => {
    const id = prototype?.id ?? routePrototypeId
    if (!id) return
    if (!wsReady) {
      setRunStatus('error')
      setRunBlockReason(
        'Runner websocket is not connected yet. Wait until status is ready.',
      )
      return
    }
    if (!runnerReady) {
      setRunStatus('connecting')
      setRunBlockReason(
        'AutoWRX Runner extension is not ready yet. Open VSCode workspace and wait for runner.connected.',
      )
      return
    }

    setActiveTab(OUTPUT_TAB)
    setRunStatus('running')
    setRunBlockReason('')
    setVscodeRunOutput('')
    setAppLog('')

    void triggerWorkspaceRun(id).catch((error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const message =
        err?.response?.data?.message || err?.message || 'Failed to trigger workspace run.'
      console.error('[DaWorkspaceRuntimeControl] Coder trigger-run failed:', message)
      setRunStatus('error')
      setRunBlockReason(message)
    })

    notifyWidgetIframes({ action: 'run-app' })

    const userId = currentUser?.id || 'Anonymous'
    if (prototype) {
      addLog({
        name: `User ${userId} run prototype`,
        description: `User ${userId} run prototype ${prototype?.name || 'Unknown'} with id ${prototype?.id || 'Unknown'}`,
        type: 'run-prototype',
        create_by: userId,
      })
      countCodeExecution(prototype.id)
    }
  }, [
    currentUser?.id,
    prototype,
    routePrototypeId,
    runnerReady,
    setAppLog,
    wsReady,
  ])

  const submitStdinLine = useCallback(() => {
    const value = stdinLine.trimEnd()
    if (!value) return
    const sent = sendRunWsMessage({
      type: 'run.stdin',
      data: value,
    })
    if (!sent) return
    setStdinLine('')
    setRunStatus('running')
  }, [sendRunWsMessage, stdinLine])

  const stopRun = useCallback(() => {
    const sent = sendRunWsMessage({ type: 'run.stop' })
    if (!sent) return
    setRunStatus('exited')
  }, [sendRunWsMessage])

  useEffect(() => {
    const handleMessageListener = (e: MessageEvent) => {
      if (!e.data) return
      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (payload?.cmd === 'set-api-value' && payload.api !== undefined) {
          requestWriteSignalValue({ [String(payload.api)]: payload.value })
        }
      } catch {
        // ignore malformed messages
      }
    }

    window.addEventListener('message', handleMessageListener)
    return () => {
      window.removeEventListener('message', handleMessageListener)
    }
  }, [requestWriteSignalValue])

  useEffect(() => {
    if (!prototypeIdForCoder || !isAuthorized || !accessToken) return
    if (!isVsCodeIframeLoaded) {
      setRunStatus('connecting')
      setWsReady(false)
      setRunnerReady(false)
      setRunBlockReason('Waiting for VSCode iframe to load...')
      return
    }

    shouldReconnectRef.current = true
    setRunStatus('connecting')
    setWsReady(false)
    setRunnerReady(false)
    setRunBlockReason('Connecting to runner websocket...')

    const wsBase = toWsBase(config.serverBaseUrl)
    const wsUrl = `${wsBase}/${config.serverVersion}/system/coder/workspace/${prototypeIdForCoder}/run-ws?access_token=${encodeURIComponent(accessToken)}`

    const connectWs = () => {
      if (!shouldReconnectRef.current) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setWsReady(true)
        setRunStatus('connecting')
        setRunBlockReason('Waiting for AutoWRX Runner extension...')
        void getWorkspaceRuntimeState(prototypeIdForCoder)
          .then((snapshot) => {
            const apisValue =
              snapshot?.apisValue && typeof snapshot.apisValue === 'object'
                ? snapshot.apisValue
                : {}
            const traceVars =
              snapshot?.traceVars && typeof snapshot.traceVars === 'object'
                ? snapshot.traceVars
                : {}
            const appLog = String(snapshot?.appLog || '')
            setActiveApis(apisValue)
            setTraceVars(traceVars)
            setAppLog(appLog)
            if (appLog) {
              setVscodeRunOutput(appLog)
            }
          })
          .catch(() => {
            // best-effort snapshot hydrate
          })
      }

      ws.onerror = () => {
        setWsReady(false)
      }

      ws.onclose = () => {
        setWsReady(false)
        setRunnerReady(false)
        setRunStatus('connecting')
        setRunBlockReason('Runner websocket disconnected. Reconnecting...')
        if (!shouldReconnectRef.current) return
        if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null
          connectWs()
        }, RUNNER_WS_RECONNECT_MS)
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data))
          if (!payload || typeof payload !== 'object') return

          switch (payload.type) {
            case 'runner.connected':
              setRunnerReady(true)
              setRunStatus('ready')
              setRunBlockReason('')
              return
            case 'runner.disconnected':
              setRunnerReady(false)
              setRunStatus('connecting')
              setRunBlockReason('connecting...')
              return
            case 'run.started':
              setRunStatus('running')
              return
            case 'run.output': {
              const text = String(payload.data || '')
              if (!text) return
              appendRuntimeText(text)
              setRunStatus('running')
              if (/[?:]\s*$/.test(text) || /\b(input|enter)\b/i.test(text)) {
                setRunStatus('waiting_input')
              }
              return
            }
            case 'run.vars': {
              const varsPatch = payload.vars
              if (varsPatch && typeof varsPatch === 'object' && !Array.isArray(varsPatch)) {
                writeSignalValue(toVarsApiNamespace(varsPatch as Record<string, unknown>))
              }
              return
            }
            case 'run.error': {
              const message = String(
                payload.message || payload.error || payload.data || 'Runner error',
              )
              appendRuntimeText(`\n[run.error] ${message}\n`)
              setRunStatus('error')
              setRunBlockReason(message)
              return
            }
            case 'run.waiting_input':
              setRunStatus('waiting_input')
              return
            case 'run.exit':
              appendRuntimeText(
                `\n[run.exit] code=${payload.code} signal=${payload.signal || 'none'}\n`,
              )
              setRunStatus('exited')
              return
            default:
              return
          }
        } catch {
          // ignore malformed messages
        }
      }
    }

    connectWs()

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      try {
        wsRef.current?.close(1000, 'unmount')
      } catch {
        // ignore
      }
      wsRef.current = null
    }
  }, [
    accessToken,
    appendRuntimeText,
    isAuthorized,
    isVsCodeIframeLoaded,
    prototypeIdForCoder,
    setActiveApis,
    setAppLog,
    setTraceVars,
    writeSignalValue,
    writeVarsValue,
  ])

  const outputPanelText = useMemo(() => {
    const placeholder =
      'No output yet. Click Run to start the prototype in the workspace.'
    if (!String(vscodeRunOutput ?? '').trim()) return placeholder
    return vscodeRunOutput
  }, [vscodeRunOutput])

  const isRunInProgress =
    runStatus === 'running' || runStatus === 'waiting_input'
  const canRun =
    Boolean(prototypeIdForCoder) && wsReady && runnerReady && !isRunInProgress
  const runDisabledReason = !prototypeIdForCoder
    ? 'Prototype id is missing.'
    : !wsReady
      ? runBlockReason || 'Runner websocket is not ready.'
      : !runnerReady
        ? runBlockReason || 'AutoWRX Runner extension is not ready.'
        : ''
  const canStop =
    wsReady && (runStatus === 'running' || runStatus === 'waiting_input')
  const canSendStdin = wsReady && runStatus !== 'error'
  const statusLabel = `status: ${runStatus}`

  return {
    prototype,
    showPrototypeDashboardFullScreen,
    isExpand,
    setIsExpand,
    activeTab,
    setActiveTab,
    stdinLine,
    setStdinLine,
    outputPanelText,
    runStatus,
    statusLabel,
    canRun,
    canStop,
    canSendStdin,
    runDisabledReason,
    clearOutput,
    appendRuntimeText,
    handleRun,
    submitStdinLine,
    stopRun,
    requestWriteSignalValue,
    writeVarsValue,
  }
}
