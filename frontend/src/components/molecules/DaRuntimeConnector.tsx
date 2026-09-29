// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { forwardRef, useState, useEffect, useImperativeHandle, useRef, useMemo } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useAssets } from '@/hooks/useAssets'

import { io } from 'socket.io-client'
import { useSiteConfig } from '@/utils/siteConfig'

export interface Runtime {
  desc: string
  is_online: boolean
  kit_id: string
  last_seen: number
  name: string
  socket_id: string
  support_apis: any[]
  noRunner?: number
  runners?: any[]
  infoReady?: boolean
}

interface KitConnectProps {
  kitServerUrl?: string
  socketIoConfig?: Record<string, any>
  hideLabel?: boolean
  targetPrefix: string | string[]
  usedAPIs: string[]
  forceKitId?: string
  onActiveRtChanged?: (newActiveKitId: string | undefined) => void
  onLoadedMockSignals?: (signals: []) => void
  onNewLog?: (log: string, rtId?: string) => void
  onError?: (error: string, rtId?: string) => void
  onAppExit?: (code: any) => void
  onAppRunningStateChanged?: (isRunning: boolean) => void
  onRuntimeInfoReceived?: (payload: any) => void
  onDeployResponse?: (log: string, isDone: boolean) => void
  onReadFileResponse?: (filePath: string, fileContent: string) => void
  onRebuildComplete?: () => void
  onAppFailed?: () => void
  onUnmatchedAssets?: (names: string[]) => void
  isRunning?: boolean
  isDeployMode?: boolean
}

const TAB_CLAIM_KEY = (userId: string) => `runtime-tab-claims:${userId}`
const TAB_CLAIM_TTL_MS = 6 * 1000
const TAB_HEARTBEAT_MS = 2 * 1000
const EMPTY_RUNTIME_VALUE = '__no_runtime_available__'

type TabClaim = { sockets: string[]; ts: number }
type TabClaimMap = Record<string, TabClaim>

const readClaims = (userId: string): TabClaimMap => {
  try {
    const raw = localStorage.getItem(TAB_CLAIM_KEY(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeClaims = (userId: string, map: TabClaimMap) => {
  try {
    localStorage.setItem(TAB_CLAIM_KEY(userId), JSON.stringify(map))
  } catch {}
}

const DaRuntimeConnector = forwardRef<any, KitConnectProps>(
  (
    {
      hideLabel = false,
      targetPrefix = 'runtime-',
      kitServerUrl,
      socketIoConfig,
      usedAPIs,
      forceKitId,
      onActiveRtChanged,
      onLoadedMockSignals,
      onNewLog,
      onError,
      onAppRunningStateChanged,
      onRuntimeInfoReceived,
      onDeployResponse,
      onReadFileResponse,
      onRebuildComplete,
      onAppFailed,
      onUnmatchedAssets,
      isRunning = false,
      isDeployMode = false,
    },
    ref,
  ) => {
    const [socketio, setSocketIo] = useState<any>(null)
    const [activeRtId, setActiveRtId] = useState<string | undefined>('')
    const [allRuntimes, setAllRuntimes] = useState<any>([])
    const [ticker, setTicker] = useState(0)
    const socketioRef = useRef<any>(null)
    const activeRtIdRef = useRef<string | undefined>('')
    const forceKitIdRef = useRef<string | undefined>(forceKitId)
    const currentUserRef = useRef<any>(null)
    const wasDisconnectedRef = useRef<boolean>(false)
    const hasLoadedKitListRef = useRef<boolean>(false)
    const allRuntimesRef = useRef<any>([])
    socketioRef.current = socketio
    activeRtIdRef.current = activeRtId
    forceKitIdRef.current = forceKitId
    allRuntimesRef.current = allRuntimes

    // Per-tab nonce + cross-tab handshake state. See "duplicate-tab" busy-state fix:
    // BroadcastChannel lets concurrently-live tabs claim their own socket ids so the
    // isMine matcher can exclude them, even when sessionStorage was inherited from a
    // duplicated tab.
    const tabNonceRef = useRef<string>(
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random()}`,
    )
    const siblingClaimedSocketsRef = useRef<Set<string>>(new Set())
    const siblingHandshakeReadyRef = useRef<boolean>(false)
    const broadcastChRef = useRef<BroadcastChannel | null>(null)
    const isReloadNavigationRef = useRef<boolean>(
      (() => {
        try {
          const nav = performance.getEntriesByType('navigation')[0] as
            | PerformanceNavigationTiming
            | undefined
          return nav?.type === 'reload'
        } catch {
          return false
        }
      })(),
    )

    const [rawApisPackage, setRawApisPackage] = useState<any>(null)
    const { data: prototype } = useCurrentPrototype()
    const { data: currentUser } = useSelfProfileQuery()
    currentUserRef.current = currentUser
    const { useFetchAssets } = useAssets()
    const { data: assets } = useFetchAssets()

    // Read RUNTIME_SERVER_CONFIG from site config as fallback for socketIoConfig
    const runtimeServerConfigRaw = useSiteConfig('RUNTIME_SERVER_CONFIG', '')
    const siteConfigSocketIoConfig = useMemo(() => {
      if (!runtimeServerConfigRaw) return {}
      try {
        const parsed =
          typeof runtimeServerConfigRaw === 'string'
            ? JSON.parse(runtimeServerConfigRaw)
            : runtimeServerConfigRaw
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
      } catch {
        return {}
      }
    }, [runtimeServerConfigRaw])

    // Use prop socketIoConfig, fallback to site config
    const effectiveSocketIoConfig = useMemo(() => {
      return socketIoConfig || siteConfigSocketIoConfig || {}
    }, [socketIoConfig, siteConfigSocketIoConfig])

    const [renderRuntimes, setRenderRuntimes] = useState<Runtime[]>([])
    const [hasLoadedKitList, setHasLoadedKitList] = useState(false)
    hasLoadedKitListRef.current = hasLoadedKitList
    const [kitListRequestTime, setKitListRequestTime] = useState<number | null>(null)
    const [kitListRequestTimeout, setKitListRequestTimeout] = useState(false)
    const [socketConnectionTimeout, setSocketConnectionTimeout] = useState(false)
    const kitListTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const socketConnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useImperativeHandle(ref, () => {
      return {
        runApp,
        runBinApp,
        stopApp,
        startRemoteAccess,
        deploy,
        listPythonLibs,
        requestInstallLib,
        setMockSignals,
        loadMockSignals,
        writeSignalsValue,
        writeVarsValue,
        revertToDefaultVehicleModel,
        builldVehicleModel,
        getRuntimeInfo,
        readFile,
        writeFile,
      }
    })

    const [apisValue, setActiveApis, setTraceVars, setAppLog, setActiveRuntimeName, setRuntimeRunning, setIsAppRunning] = useRuntimeStore(
      (state) => [state.apisValue, state.setActiveApis, state.setTraceVars, state.setAppLog, state.setActiveRuntimeName, state.setRuntimeRunning, state.setIsAppRunning],
      shallow,
    )

    useEffect(() => {
      if (rawApisPackage) {
        if (activeRtId && activeRtId == rawApisPackage?.kit_id) {
          setActiveApis(rawApisPackage?.result || {})
        }
      }
    }, [rawApisPackage])

    useEffect(() => {
      let timer = setInterval(() => {
        setTicker((oldTicker) => oldTicker + 1)
      }, TAB_HEARTBEAT_MS)
      return () => {
        if (timer) clearInterval(timer)
      }
    }, [])

    // Write this tab's live socket ownership into localStorage every heartbeat.
    // Other tabs read these claims synchronously to classify sibling sockets as
    // "not mine" without relying on async cross-tab handshakes.
    useEffect(() => {
      const userId = currentUser?.id
      const socketId = socketio?.id
      if (!userId || !socketId) return

      const map = readClaims(userId)
      const now = Date.now()
      for (const k of Object.keys(map)) {
        if (!map[k] || now - (map[k].ts || 0) > TAB_CLAIM_TTL_MS) {
          delete map[k]
        }
      }
      map[tabNonceRef.current] = { sockets: [socketId], ts: now }
      writeClaims(userId, map)
    }, [ticker, socketio, currentUser?.id])

    // If this tab opens while a sibling tab is already live (typical duplicate-tab
    // flow), sessionStorage may have been inherited and can contain sibling socket
    // ids. Clear the inherited recent-list for non-reload navigations so matcher
    // positives only come from this tab's own live socket/claims.
    useEffect(() => {
      const userId = currentUser?.id
      if (!userId) return

      const claims = readClaims(userId)
      const now = Date.now()
      const haveLiveSibling = Object.entries(claims).some(
        ([nonce, claim]) =>
          nonce !== tabNonceRef.current &&
          !!claim &&
          now - (claim.ts || 0) < TAB_CLAIM_TTL_MS,
      )

      if (haveLiveSibling && !isReloadNavigationRef.current) {
        try {
          sessionStorage.removeItem(`my-runtime-socket-ids:${userId}`)
        } catch {}
      }
    }, [currentUser?.id])

    // LocalStorage claims are synchronous; once user context is ready we can
    // allow auto-pick logic to proceed immediately (the 400 ms BroadcastChannel
    // timeout stays as a fallback).
    useEffect(() => {
      if (currentUser?.id) {
        siblingHandshakeReadyRef.current = true
      }
    }, [currentUser?.id])

    // Cross-tab BroadcastChannel handshake. Concurrently-live tabs announce which
    // socket ids they currently own (and which ids appear in their per-user
    // sessionStorage recent-list). This lets isMine exclude sibling-claimed ids,
    // which fixes the duplicate-tab case where sessionStorage was copy-inherited.
    // A real reload has no live sibling, so the recent-list survives reload as
    // before.
    useEffect(() => {
      let ch: BroadcastChannel | null = null
      try {
        ch = new BroadcastChannel('autowrx-rt-tabs')
      } catch {
        // BroadcastChannel unavailable; mark handshake done so auto-pick is not blocked.
        siblingHandshakeReadyRef.current = true
        return
      }
      broadcastChRef.current = ch

      const myNonce = tabNonceRef.current
      const buildPayload = (type: 'hello' | 'announce' | 'bye') => {
        const userId = currentUserRef.current?.id
        return {
          type,
          nonce: myNonce,
          userId,
          currentSocketId: socketioRef.current?.id,
        }
      }

      ch.onmessage = (ev: MessageEvent) => {
        const m = ev.data
        if (!m || m.nonce === myNonce) return
        if (m.type === 'hello' || m.type === 'announce') {
          if (m.currentSocketId) {
            siblingClaimedSocketsRef.current.add(m.currentSocketId)
          }
          if (m.type === 'hello') {
            try { ch?.postMessage(buildPayload('announce')) } catch {}
          }
        }
        if (m.type === 'bye') {
          if (m.currentSocketId) {
            siblingClaimedSocketsRef.current.delete(m.currentSocketId)
          }
        }
      }

      try { ch.postMessage(buildPayload('hello')) } catch {}
      const t = setTimeout(() => {
        siblingHandshakeReadyRef.current = true
      }, 400)

      return () => {
        clearTimeout(t)
        try { ch?.postMessage(buildPayload('bye')) } catch {}
        try { ch?.close() } catch {}
        broadcastChRef.current = null
      }
    }, [])

    useEffect(() => {
      const cleanup = () => {
        const sock = socketioRef.current
        const rtId = activeRtIdRef.current
        const userId = currentUserRef.current?.id
        // Remove this tab's heartbeat claim immediately on close/unload. If this
        // write is dropped by the browser shutdown path, peers still recover via
        // TTL pruning on their next heartbeat.
        try {
          if (userId) {
            const map = readClaims(userId)
            delete map[tabNonceRef.current]
            writeClaims(userId, map)
          }
        } catch {}
        // Tell sibling tabs to drop our claimed socket ids ASAP so they free up
        // any runtime we were holding. Best-effort; safe to ignore failures.
        try {
          broadcastChRef.current?.postMessage({
            type: 'bye',
            nonce: tabNonceRef.current,
            userId,
            currentSocketId: sock?.id,
          })
        } catch {}
        if (!sock) return
        try {
          if (rtId) {
            sock.emit('messageToKit', { cmd: 'unsubscribe_apis', to_kit_id: rtId })
          }
          sock.emit('unregister_client', {})
          // Force-flush the engine.io transport so the queued unsubscribe frame is actually
          // written to the WebSocket before we close. Without this, the browser often tears
          // down the tab before socket.io drains its send buffer, so kit-manager never sees
          // the unsubscribe and falls back to its ~45s ping-timeout cleanup.
          try { sock.io?.engine?.flush?.() } catch {}
        } catch {}
        try { sock.disconnect() } catch {}
      }
      window.addEventListener('beforeunload', cleanup)
      window.addEventListener('pagehide', cleanup)
      return () => {
        window.removeEventListener('beforeunload', cleanup)
        window.removeEventListener('pagehide', cleanup)
      }
    }, [])

    useEffect(() => {
      if (activeRtId && socketio) {
        socketio.emit('messageToKit', {
          cmd: 'subscribe_apis',
          to_kit_id: activeRtId,
          apis: usedAPIs || [],
          username: currentUser?.name || 'anonymous',
          user_id: currentUser?.id || 'anonymous',
          subscribed_at: Date.now(),
        })
        if (socketio.id && currentUser?.id) {
          try {
            const key = `my-runtime-socket-ids:${currentUser.id}`
            const raw = sessionStorage.getItem(key)
            const list: string[] = raw ? JSON.parse(raw) : []
            const filtered = list.filter((s) => s !== socketio.id)
            filtered.push(socketio.id)
            const trimmed = filtered.slice(-5)
            sessionStorage.setItem(key, JSON.stringify(trimmed))
          } catch {}
        }
      }
    }, [ticker, activeRtId, usedAPIs, socketio, currentUser?.id])

    const prevActiveRtIdRef = useRef<string | undefined>('')
    useEffect(() => {
      const prev = prevActiveRtIdRef.current
      if (prev && prev !== activeRtId && socketio) {
        socketio.emit('messageToKit', {
          cmd: 'unsubscribe_apis',
          to_kit_id: prev,
        })
      }
      prevActiveRtIdRef.current = activeRtId
    }, [activeRtId, socketio])

    useEffect(() => {
      if (!socketio || renderRuntimes.length === 0) return
      renderRuntimes.forEach((rt: Runtime) => {
        socketio.emit('messageToKit', {
          cmd: 'get-runtime-info',
          to_kit_id: rt.kit_id,
        })
      })
    }, [ticker])

    useEffect(() => {
      if (!socketio || !currentUser?.id || renderRuntimes.length === 0) return
      renderRuntimes.forEach((rt: Runtime) => {
        socketio.emit('messageToKit', {
          cmd: 'get-runtime-info',
          to_kit_id: rt.kit_id,
        })
      })
    }, [currentUser?.id, socketio, renderRuntimes.length])

    useEffect(() => {
      if (!socketio) return
      socketio.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId,
      })
    }, [activeRtId])

    const runApp = (code: string, appName: string) => {
      if (onNewLog) {
        onNewLog(`Run app\r\n`, activeRtId)
      }
      if (setAppLog) {
        setAppLog(`Run app\r\n`)
      }
      let cmd = "run_python_app"
      if (prototype?.language == "python") {
        cmd = "run_python_app"
      } else if (prototype?.language == "rust") {
        cmd = "run_rust_app"
      } else if (prototype?.language == "cpp") {
        cmd = "run_cpp_app"
      }
      let watch_vars = ""
      if (prototype?.extend?.watch_vars && Array.isArray(prototype?.extend?.watch_vars)) {
        watch_vars = prototype?.extend?.watch_vars.map((v: any) => v.name).join(', ') || ''
      }
      console.log(`watch_vars`, watch_vars)
      socketio?.emit('messageToKit', {
        cmd: cmd,
        to_kit_id: activeRtId,
        usedAPIs: usedAPIs,
        data: {
          language: prototype?.language,
          watch_vars: watch_vars,
          code: code,
          name: appName
        },
      })
    }

    const runBinApp = (appName: string) => {
      if (onNewLog) {
        onNewLog(`Run app\r\n`, activeRtId)
      }
      if (setAppLog) {
        setAppLog(`Run app\r\n`)
      }
      socketio?.emit('messageToKit', {
        cmd: 'run_bin_app',
        to_kit_id: activeRtId,
        usedAPIs: usedAPIs,
        data: appName,
      })
    }

    const stopApp = () => {
      socketio?.emit('messageToKit', {
        cmd: 'stop_python_app',
        to_kit_id: activeRtId,
        data: {},
      })
    }

    const startRemoteAccess = () => {
      if (!socketio || !socketio.connected) {
        console.error('SocketIO is not initialized or connected.')
        return
      }
      if (!activeRtId) {
        console.error('Cannot start remote access without an active runtime.')
        return
      }
      socketio.emit('messageToKit', {
        cmd: 'start-remote-access',
        to_kit_id: activeRtId,
      })
    }

    const deploy = () => {
      if (prototype && prototype.id && currentUser) {
        socketio?.emit('messageToKit', {
          cmd: 'deploy_request',
          disable_code_convert: true,
          to_kit_id: activeRtId,
          code: prototype.code || '',
          prototype: {
            name: prototype.name || 'no-name',
            id: prototype.id || 'no-id',
          },
          username: currentUser.name,
        })
      }
    }

    const listPythonLibs = () => {
      if (prototype && prototype.id && currentUser) {
        socketio?.emit('messageToKit', {
          cmd: 'list_python_packages',
          to_kit_id: activeRtId,
        })
      }
    }

    const requestInstallLib = (libName: string) => {
      if (prototype && prototype.id && currentUser && libName) {
        socketio?.emit('messageToKit', {
          cmd: 'install_python_packages',
          data: libName.trim(),
          to_kit_id: activeRtId,
        })
      }
    }

    const revertToDefaultVehicleModel = () => {
      if (prototype && prototype.id && currentUser) {
        socketio?.emit('messageToKit', {
          cmd: 'revert_vehicle_model',
          data: "",
          to_kit_id: activeRtId,
        })
      }
    }

    const builldVehicleModel = (vss_json: string) => {
      if (prototype && prototype.id && currentUser && vss_json) {
        socketio?.emit('messageToKit', {
          cmd: 'generate_vehicle_model',
          vss_spec: vss_json || "",
          data: vss_json || "",          
          to_kit_id: activeRtId,
        })
      } else if (vss_json){
        socketio.emit('messageToKit', {
          cmd: 'generate_vehicle_model',
          vss_spec: vss_json || "",
          data: vss_json || '',
          to_kit_id: activeRtId,
          prototype: {
            name: 'no-name',
            id: 'no-id',
          },
          username: "no",
        })
        socketio.emit('messageToKit', {
          cmd: 'generate-vehicle-model',
          vss_spec: vss_json || "",
          data: vss_json || '',
          to_kit_id: activeRtId,
          prototype: {
            name: 'no-name',
            id: 'no-id',
          },
          username: "no",
        })
      }
    }

    const setMockSignals = (signals: any[]) => {
      socketio?.emit('messageToKit', {
        cmd: 'set_mock_signals',
        to_kit_id: activeRtId,
        data: signals || [],
      })
    }

    const writeVarsValue = (obj: any) => {
      let payload = {
        cmd: 'set_vars_value',
        to_kit_id: activeRtId,
        data: obj || {},
      }
      socketio?.emit('messageToKit', payload)
    }

    const writeSignalsValue = (obj: any) => {
      socketio?.emit('messageToKit', {
        cmd: 'write_signals_value',
        to_kit_id: activeRtId,
        data: obj || {},
      })
    }

    const loadMockSignals = () => {
      socketio?.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId,
      })
    }

    const getRuntimeInfo = () => {
      socketio?.emit('messageToKit', {
        cmd: 'get-runtime-info',
        to_kit_id: activeRtId,
      })
    }

    const readFile = (filePath: string) => {
      socketio?.emit('messageToKit', {
        cmd: 'read-file',
        to_kit_id: activeRtId,
        data: "",
        file_path: filePath,
        prototype: {
          name: 'no-name',
          id: 'no-id',
        },
        username: "no"
      })
    }

    const writeFile = (filePath: string, fileContent: string) => {
      socketio?.emit('messageToKit', {
        cmd: 'write-file',
        to_kit_id: activeRtId,
        prototype: {
          name: 'no-name',
          id: 'no-id',
        },
        username: "no",
        file_path: filePath,
        file_content: fileContent || '',
        data: "",
      })
    }

    useEffect(() => {
      if (onActiveRtChanged) {
        onActiveRtChanged(activeRtId)
      }

      const activeName = activeRtId
        ? allRuntimes.find((rt: Runtime) => rt.kit_id === activeRtId)?.name
        : undefined
      setActiveRuntimeName(activeName)

      if (!activeRtId) {
        setIsAppRunning(false)
      }

      if (activeRtId) {
        getRuntimeInfo()
      }

    }, [activeRtId])

    useEffect(() => {
      if (!kitServerUrl) return

      // Reset timeout flags when starting a new connection
      if (forceKitId) {
        setSocketConnectionTimeout(false)
        setKitListRequestTimeout(false)

        // Set socket connection timeout (if not connected within 10 seconds, mark as unreachable)
        if (socketConnectTimeoutRef.current) {
          clearTimeout(socketConnectTimeoutRef.current)
        }
        socketConnectTimeoutRef.current = setTimeout(() => {
          setSocketConnectionTimeout(true)
        }, 10000)
      }

      setSocketIo(io(kitServerUrl, effectiveSocketIoConfig))
      // Only re-create socket if kitServerUrl changes, not if config changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kitServerUrl])

    useEffect(() => {
      if (!socketio) return

      if (!socketio.connected) {
        socketio.connect()
      } else {
        registerClient()
      }

      const onRegisterClientResponse = (response: any) => {
        if (response.status === 'OK' && response.determinedSocketId) {
          sessionStorage.setItem('determined_socket_id', response.determinedSocketId)
        }
      }

      socketio.on('connect', onConnected)
      socketio.on('disconnect', onDisconnect)
      socketio.on('list-all-kits-result', onGetAllKitData)
      socketio.on('messageToKit-kitReply', onKitReply)
      socketio.on('broadcastToClient', onBroadCastToClient)
      socketio.on('register_client-response', onRegisterClientResponse)

      return () => {
        const rtId = activeRtIdRef.current
        if (rtId) {
          socketio.emit('messageToKit', {
            cmd: 'unsubscribe_apis',
            to_kit_id: rtId,
          })
        }

        socketio.off('connect', onConnected)
        socketio.off('disconnect', onDisconnect)
        socketio.off('list-all-kits-result', onGetAllKitData)
        socketio.off('messageToKit-kitReply', onKitReply)
        socketio.off('broadcastToClient', onBroadCastToClient)
        socketio.off('register_client-response', onRegisterClientResponse)
        socketio.emit('unregister_client', {})
        unregisterClient()
        socketio.disconnect()
      }
    }, [socketio])

    useEffect(() => {
      if (activeRtId) {
        localStorage.setItem('last-rt', activeRtId)
      }
    }, [activeRtId])

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (kitListTimeoutRef.current) {
          clearTimeout(kitListTimeoutRef.current)
          kitListTimeoutRef.current = null
        }
        if (socketConnectTimeoutRef.current) {
          clearTimeout(socketConnectTimeoutRef.current)
          socketConnectTimeoutRef.current = null
        }
      }
    }, [])

    const onConnected = () => {
      // Clear socket connection timeout since we successfully connected
      if (socketConnectTimeoutRef.current) {
        clearTimeout(socketConnectTimeoutRef.current)
        socketConnectTimeoutRef.current = null
      }
      setSocketConnectionTimeout(false)

      registerClient()
      setTimeout(() => {
        if (activeRtIdRef.current || forceKitIdRef.current) {
          const needsRefresh = wasDisconnectedRef.current
          const alreadyHaveList = hasLoadedKitListRef.current

          // Only request kit list if we don't have it yet or we just disconnected
          if (!alreadyHaveList || needsRefresh) {
            setHasLoadedKitList(false)
            setKitListRequestTimeout(false)
            const now = Date.now()
            setKitListRequestTime(now)

            // Clear any existing timeout
            if (kitListTimeoutRef.current) {
              clearTimeout(kitListTimeoutRef.current)
            }

            // Set timeout: if no response in 8 seconds, mark as timeout
            kitListTimeoutRef.current = setTimeout(() => {
              setKitListRequestTimeout(true)
            }, 8000)

            socketio?.emit('messageToKit', {
              cmd: 'list-all-kits',
            })

            // Reset disconnect flag after requesting
            wasDisconnectedRef.current = false
          }
        }
      }, 1000)
      if (usedAPIs) {
        setTicker((oldTicker) => oldTicker + 1)
      }
      try {
        const userId = currentUserRef.current?.id
        broadcastChRef.current?.postMessage({
          type: 'announce',
          nonce: tabNonceRef.current,
          userId,
          currentSocketId: socketioRef.current?.id,
        })
      } catch {}
    }

    const registerClient = () => {
      const liveUser = currentUserRef.current
      socketioRef.current?.emit('register_client', {
        username: liveUser?.name || 'anonymous',
        user_id: liveUser?.id || 'anonymous',
        domain: window.location.hostname,
      })
    }

    const unregisterClient = () => {
      socketio?.emit('unregister_client', {})
    }

    const onDisconnect = (reason?: string) => {
      wasDisconnectedRef.current = true
      if (forceKitId) {
      }
    }

    const onGetAllKitData = (data: any) => {
      const receivedTime = Date.now()
      const requestDuration = kitListRequestTime ? receivedTime - kitListRequestTime : 'N/A'
      if (forceKitId) {
        const kitIds = data.map((k: any) => k.kit_id)
        const found = data.find((k: any) => k.kit_id.toLowerCase() === forceKitId.toLowerCase())
      }

      // Clear the timeout since we got a response
      if (kitListTimeoutRef.current) {
        clearTimeout(kitListTimeoutRef.current)
        kitListTimeoutRef.current = null
      }

      setHasLoadedKitList(true)
      hasLoadedKitListRef.current = true
      setKitListRequestTimeout(false)
      const getLastPart = (kit_id: string) => {
        const parts = kit_id.split('-')
        return parts[parts.length - 1]
      }
      // If forceKitId is set, include all runtimes (even offline) so we can show their status
      // Otherwise, filter for online runtimes only
      let kits = [...data].filter((kit: any) => {
        return forceKitId ? true : kit.is_online
      })

      let sortedKits = kits.filter((rt) => {
        // If forceKitId is set, bypass prefix filter and include all runtimes
        if (forceKitId) {
          return true
        }
        const kitIdLower = rt.kit_id.toLowerCase()
        if (Array.isArray(targetPrefix)) {
          return targetPrefix.some(prefix => kitIdLower.startsWith(prefix.toLowerCase()))
        }
        return kitIdLower.startsWith(targetPrefix ? targetPrefix.toLowerCase() : 'runtime-')
      })

      sortedKits.sort((a, b) => {
        if (a.is_online !== b.is_online) {
          return b.is_online - a.is_online
        }

        const aLastPart = getLastPart(a.kit_id)
        const bLastPart = getLastPart(b.kit_id)

        const aNumeric = parseInt(aLastPart, 10)
        const bNumeric = parseInt(bLastPart, 10)

        if (!isNaN(aNumeric) && !isNaN(bNumeric)) {
          return aNumeric - bNumeric
        } else {
          return aLastPart.localeCompare(bLastPart)
        }
      })

      // Preserve per-runtime occupancy state across list refreshes so we do not
      // transiently treat unknown occupancy as free.
      setAllRuntimes((prev: Runtime[]) =>
        sortedKits.map((rt: Runtime) => {
          const prevRt = prev.find((p) => p.kit_id === rt.kit_id)
          return {
            ...rt,
            noRunner: prevRt?.noRunner,
            runners: prevRt?.runners,
            infoReady: prevRt?.infoReady ?? false,
          }
        }),
      )

      sortedKits.forEach((rt: any) => {
        socketio?.emit('messageToKit', {
          cmd: 'get-runtime-info',
          to_kit_id: rt.kit_id,
        })
      })
    }

    // Staleness threshold for subscriber entries keyed on kit-manager's `from` field.
    // Ticker polls every 2s; 8s = miss 3-4 heartbeats before considering the entry dead.
    const STALE_MS = 8 * 1000

    // Normalize kit-manager's `from` to milliseconds. Kit-manager emits it in seconds
    // with fractional precision (e.g. 1776940419.2568693), so we multiply by 1000.
    // If the value already looks like ms (> 10^12), keep as-is for forward compat.
    const fromToMs = (from: any): number | null => {
      if (typeof from !== 'number' || !isFinite(from)) return null
      return from > 1e12 ? from : from * 1000
    }

    // Adaptive re-stamp probe: we don't know a-priori whether kit-manager re-stamps
    // `from` on each subscribe_apis. We watch our OWN subscriber entry across polls;
    // if its `from` changes, re-stamping is confirmed and it is safe to use `from`
    // as a liveness indicator. Until then we keep the staleness filter disabled so
    // we never wrongly mark an alive long-running entry as dead.
    const reStampConfirmedRef = useRef<boolean>(false)
    const ownEntrySeenRef = useRef<{ lastFrom?: number }>({})

    const updateRuntimeRunners = (kitId: string, data: any) => {
      const liveUser = currentUserRef.current
      if (!liveUser?.id) {
        return
      }
      // Only process runtimes that exist in the runtime list
      // (filter out responses from runtimes that don't exist on the server)
      const runtimeExists = allRuntimesRef.current.some((rt: any) => rt.kit_id === kitId)
      if (!runtimeExists) {
        return
      }
      const runners = data?.lsOfRunner || []
      const subscribers = data?.lsOfApiSubscriber || {}
      const myUserId = liveUser?.id
      const myUsername = liveUser?.name
      const mySocketId = socketioRef.current?.id
      const now = Date.now()

      // Probe: if we can see our own entry in this poll, compare its `from` against
      // the previously observed value. Any change confirms kit-manager re-stamps.
      if (mySocketId && subscribers[mySocketId]) {
        const ownFromMs = fromToMs(subscribers[mySocketId].from)
        if (ownFromMs != null) {
          const tracker = ownEntrySeenRef.current
          if (tracker.lastFrom != null && tracker.lastFrom !== ownFromMs) {
            reStampConfirmedRef.current = true
          }
          tracker.lastFrom = ownFromMs
        }
      }

      let recentSocketIds: string[] = []
      try {
        const raw = sessionStorage.getItem(
          `my-runtime-socket-ids:${myUserId}`,
        )
        if (raw) recentSocketIds = JSON.parse(raw)
      } catch {}
      const allowRecentSocketFallback = isReloadNavigationRef.current

      // Recompute sibling claims live from localStorage on each poll.
      // This is the primary source of truth for cross-tab ownership because it
      // is synchronous and shared across same-origin tabs.
      const sib = new Set<string>()
      {
        const claims = readClaims(myUserId)
        for (const [nonce, claim] of Object.entries(claims)) {
          if (nonce === tabNonceRef.current) continue
          if (!claim || now - (claim.ts || 0) > TAB_CLAIM_TTL_MS) continue
          ;(claim.sockets || []).forEach((s) => sib.add(s))
        }
        // Keep BroadcastChannel knowledge as a secondary fast path.
        siblingClaimedSocketsRef.current.forEach((s) => {
          if (!s || s === mySocketId) return
          sib.add(s)
        })
      }

      const isMine = (entry: any, key?: string) => {
        // Exact self-socket checks always win.
        if (mySocketId && key && key === mySocketId) return true
        if (mySocketId && entry?.request_from && entry.request_from === mySocketId) return true

        // If a concurrently-live sibling tab has claimed this socket id, it is
        // NOT us, even if our (possibly inherited) recent-list contains it.
        if (key && sib.has(key)) return false
        if (entry?.request_from && sib.has(entry.request_from)) return false

        if (myUserId && entry?.user_id && entry.user_id === myUserId) return true
        if (myUsername && entry?.username && entry.username === myUsername) return true
        if (allowRecentSocketFallback && key && recentSocketIds.includes(key)) return true
        if (
          allowRecentSocketFallback &&
          entry?.request_from &&
          recentSocketIds.includes(entry.request_from)
        ) {
          return true
        }
        return false
      }

      const busyCount = runners.length
      setAllRuntimes((prev: Runtime[]) =>
        prev.map((rt) =>
          rt.kit_id === kitId
            ? { ...rt, noRunner: busyCount, runners, infoReady: true }
            : rt,
        ),
      )
    }

    const onBroadCastToClient = (payload: any) => {
      if (!payload) return
      if (['report-runtime-state', 'get-runtime-info'].includes(payload.cmd)) {
        const kitId = payload.kit_id
        if (kitId) {
          updateRuntimeRunners(kitId, payload.data)
        }
        onRuntimeStateResponse(payload)
      }
    }

    const onKitReply = (payload: any) => {
      if (!payload) return

      if (payload.cmd == 'deploy_request' || payload.cmd == 'deploy-request') {
        if (onDeployResponse) {
          onDeployResponse(payload.result, payload.is_finish)
        }
        if (setAppLog) {
          setAppLog(payload.result || '')
        }
        if (onNewLog) {
          onNewLog(payload.result || '', payload.kit_id || activeRtIdRef.current)
        }
      }

      if (
        ['run_python_app', 'run_rust_app', 'run_bin_app'].includes(payload.cmd)
      ) {
        if (!payload.isDone) {
          if (setAppLog) {
            setAppLog(payload.result || '')
          }
          if (onNewLog) {
            onNewLog(payload.result || '', payload.kit_id || activeRtIdRef.current)
          }
        }
      }

      if (
        ['generate_vehicle_model', 'revert_vehicle_model'].includes(payload.cmd)
      ) {
        if (setAppLog) {
          setAppLog((payload.result || '') + '\r\n')
        }
        if (onNewLog) {
          onNewLog((payload.result || '') + '\r\n', payload.kit_id || activeRtIdRef.current)
        }
        if (onRebuildComplete) {
          onRebuildComplete()
        }
      }

      if (payload.cmd == 'apis-value') {
        if (payload.result) {
          setRawApisPackage(payload)
        }
      }

      if (payload.cmd == 'trace_vars') {
        let data = payload.data
        setTraceVars(data || {})
      }

      if (payload.cmd == 'list_mock_signal') {
        if (!onLoadedMockSignals) return
        if (payload && payload.data && Array.isArray(payload.data)) {
          onLoadedMockSignals(payload.data)
        }
      }

      if (payload.cmd == 'list_python_packages' && onNewLog) {
        onNewLog(`Installed python libs on "${payload.kit_id}"\r\n`, payload.kit_id)
        onNewLog(payload.data, payload.kit_id)
      }

      if (
        payload.cmd == 'install_python_packages' &&
        onNewLog &&
        payload.data
      ) {
        onNewLog(payload.data, payload.kit_id || activeRtIdRef.current)
      }

      if (['get-runtime-info', 'report-runtime-state'].includes(payload.cmd)) {
        const kitId = payload.kit_id
        if (kitId) {
          updateRuntimeRunners(kitId, payload.data)
        }
        onRuntimeStateResponse(payload)
      }

      if (payload.cmd === 'read-file') {
        if (payload.has_error) {
          const errorMsg = payload.result || 'Failed to read file'
          if (onError) {
            onError(`READ_FILE ERROR: ${errorMsg}`, payload.kit_id || activeRtIdRef.current)
          }
        } else if (payload.result && onReadFileResponse) {
          // File content is returned in payload.result
          onReadFileResponse('', payload.result)
        }
      }
    }

    useEffect(() => {
      if (forceKitId) {
        setActiveRtId(forceKitId)
      }
    }, [forceKitId, socketio])

    useEffect(() => {
      if (forceKitId) return

      // Wait for the cross-tab handshake (or its 400 ms timeout fallback) before
      // we let auto-pick fire. Without this, a freshly-duplicated tab can grab
      // the same runtime as its origin tab in the gap before sibling claims
      // arrive, which then bounces the origin tab to another runtime. The
      // handshake effect flips this flag; subsequent ticker / renderRuntimes
      // updates re-run this effect.
      if (!siblingHandshakeReadyRef.current) {
        return
      }

      if (!renderRuntimes || renderRuntimes.length <= 0) {
        setActiveRtId(undefined)
        return
      }

      const onlineRuntimes = renderRuntimes
        .filter((rt: Runtime) => rt.is_online)
        .sort((a: any, b: any) => {
          const aReady = a.infoReady ? 1 : 0
          const bReady = b.infoReady ? 1 : 0
          if (aReady !== bReady) return bReady - aReady
          const aBusy = a.infoReady ? (a.noRunner ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
          const bBusy = b.infoReady ? (b.noRunner ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
          return aBusy - bBusy
        })
      const selectableRuntimes = onlineRuntimes.filter(
        (rt: Runtime) => rt.infoReady && (rt.noRunner ?? 0) === 0,
      )

      if (onlineRuntimes.length <= 0) {
        setActiveRtId(undefined)
        return
      }

      // All online runtimes that are ready (even if busy)
      const readyRuntimes = onlineRuntimes.filter(
        (rt: Runtime) => rt.infoReady,
      )

      if (readyRuntimes.length <= 0) {
        setActiveRtId(undefined)
        return
      }

      if (activeRtId) {
        if (isRunning) return
        // Allow user to keep their selected runtime, even if it becomes busy
        // Only auto-switch if the runtime goes offline or disappears
        const currentRt = onlineRuntimes.find((rt: any) => rt.kit_id === activeRtId)
        if (currentRt && currentRt.is_online) return
      }

      // Prefer free runtimes, fall back to busy ones
      const candidates = selectableRuntimes.length > 0 ? selectableRuntimes : readyRuntimes

      const lastRt = localStorage.getItem('last-rt')
      const lastRtMatch = candidates.find((rt: any) => rt.kit_id === lastRt)
      if (lastRtMatch) {
        setActiveRtId(lastRtMatch.kit_id)
        return
      }

      const bestRt = candidates[0]
      if (bestRt) {
        setActiveRtId(bestRt.kit_id)
        localStorage.setItem('last-rt', bestRt.kit_id)
        return
      }
      setActiveRtId(undefined)
    }, [renderRuntimes, isRunning, ticker])

    useEffect(() => {
      if (isDeployMode) {
        if (Array.isArray(assets)) {
          const userKitsAsset = assets.filter(
            (asset) => ['HARDWARE_KIT', 'CLOUD_RUNTIME'].includes(asset.type),
          )
          if (userKitsAsset) {
            const kitIds = userKitsAsset.map((kit: any) => kit.name.toLowerCase())
            const filteredRuntimes = allRuntimes.filter((rt: Runtime) =>
              kitIds.includes(rt.kit_id.toLowerCase()),
            )
            setRenderRuntimes(filteredRuntimes)
          }
        }
      } else {
        let publicRuntimes = allRuntimes.filter((rt: any) => rt.name.toLowerCase().startsWith('runtime-public-') || rt.name.toLowerCase().startsWith('runtime-shared-'))

        let myRuntimes: any[] = []
        let unmatchedNames: string[] = []
        if (Array.isArray(assets)) {
          let runtimesAssets = assets.filter((a: any) => a.type == 'CLOUD_RUNTIME') || []
          let myRuntimeNames = runtimesAssets.map((asset: any) => asset.name.toLowerCase())
          myRuntimes = allRuntimes.filter((rt: any) => {
            let result = false
            myRuntimeNames.forEach((myRtName: string) => {
              if (rt.name.toLowerCase().startsWith(`${myRtName}`)) {
                result = true
              }
            })
            return result
          })

          if (runtimesAssets.length > 0 && allRuntimes.length > 0) {
            unmatchedNames = runtimesAssets
              .filter((asset: any) => {
                return !allRuntimes.some((rt: any) =>
                  rt.name.toLowerCase().startsWith(asset.name.toLowerCase())
                )
              })
              .map((asset: any) => asset.name)
          }
        }

        if (onUnmatchedAssets) {
          onUnmatchedAssets(unmatchedNames)
        }

        if (myRuntimes.length >= 3) {
          setRenderRuntimes([...new Set([...myRuntimes])])
        } else {
          let freeRuntimes = publicRuntimes.sort((a: any, b: any) => {
            return a.noRunner - b.noRunner
          })
          setRenderRuntimes([...new Set([...myRuntimes, ...freeRuntimes.slice(0, 3 - myRuntimes.length)])])
        }

      }
    }, [assets, allRuntimes, isDeployMode])

    const onRuntimeStateResponse = (payload: any) => {
      const kitId = payload?.kit_id
      if (kitId && kitId !== activeRtIdRef.current) {
        if (onRuntimeInfoReceived) {
          onRuntimeInfoReceived(payload.data)
        }
        return
      }

      const liveSocketId = socketioRef.current?.id
      const liveUser = currentUserRef.current
      const runners = payload.data?.lsOfRunner || []
      const myRunners = runners.filter((runner: any) => {
        if (liveSocketId && runner.request_from === liveSocketId) return true
        if (liveUser?.id && runner.user_id === liveUser.id) return true
        if (liveUser?.name && runner.username === liveUser.name) return true
        return false
      })

      if (myRunners.length > 0) {
        if (kitId) {
          setRuntimeRunning(kitId, true)
        }
        setIsAppRunning(true)
        if (onAppRunningStateChanged) {
          onAppRunningStateChanged(true)
        }
      } else {
        if (kitId) {
          setRuntimeRunning(kitId, false)
        }
        setIsAppRunning(false)
        if (onAppRunningStateChanged) {
          onAppRunningStateChanged(false)
        }
      }

      if (onRuntimeInfoReceived) {
        onRuntimeInfoReceived(payload.data)
      }
    }

    const hasSelectableRuntime =
      renderRuntimes?.some(
        (rt: Runtime) => rt.is_online && rt.infoReady,
      ) ?? false

    const activeRuntime = renderRuntimes?.find((rt: Runtime) => rt.kit_id === activeRtId)
    // Allow showing selected runtime even if it's busy - just needs to be online and ready
    const activeRuntimeValid =
      !!activeRuntime &&
      activeRuntime.is_online &&
      !!activeRuntime.infoReady
    const selectValue = activeRuntimeValid
      ? activeRtId
      : renderRuntimes && renderRuntimes.length > 0 && !hasSelectableRuntime
        ? EMPTY_RUNTIME_VALUE
        : ''
    const showNoRuntimeGuidance = hasLoadedKitList && (!renderRuntimes || renderRuntimes.length === 0)

    if (forceKitId) {
      let statusIcon = '🟡'
      let statusText = 'Connecting...'

      // Check if socket connection timed out (socket itself couldn't connect)
      if (socketConnectionTimeout) {
        statusIcon = '⚪'
        statusText = 'Unreachable'
      }
      // Check if kit list request timed out (kit-manager unreachable)
      else if (kitListRequestTimeout) {
        statusIcon = '⚪'
        statusText = 'Unreachable'
      }
      // Check if socket is connected and kit list is loaded
      else if (!socketio?.connected || !hasLoadedKitList) {
        statusIcon = '🟡'
        statusText = 'Connecting...'
      } else {
        // Socket is connected and kit list is loaded, now check the specific runtime
        const rt = allRuntimes.find(
          (r: Runtime) => r.kit_id.toLowerCase() === forceKitId.toLowerCase(),
        )
        if (!rt) {
          // Runtime not found in the list at all
          statusIcon = '⚪'
          statusText = 'Unreachable'
        } else if (!rt.is_online) {
          // Runtime found but is offline
          statusIcon = '🔴'
          statusText = 'Disconnected'
        } else {
          // Runtime found and is online
          statusIcon = '🟢'
          statusText = 'Connected'
        }
      }

      return (
        <div className="flex items-center text-xs gap-1.5">
          <span>{statusIcon}</span>
          <span>{statusText}</span>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-center">
          {!hideLabel && (
            <label className="w-[122px] font-medium" style={{ color: 'hsl(215, 25%, 27%)' }}>
              Runtime:
            </label>
          )}
          <select
            aria-label="deploy-select"
            className="border rounded text-xs px-2 py-1 w-full min-w-[90px] bg-gray-200"
            style={{ color: 'hsl(215, 25%, 27%)' }}
            value={selectValue as any}
            onChange={(e) => {
              const value = e.target.value
              if (!value || value === EMPTY_RUNTIME_VALUE) {
                setActiveRtId(undefined)
                return
              }
              const selectedRuntime = renderRuntimes?.find((rt: Runtime) => rt.kit_id === value)
              // Allow selecting any online runtime that is ready (even if busy)
              // User should be able to select busy runtimes - we don't auto-switch them away
              const selectedRuntimeValid =
                !!selectedRuntime &&
                selectedRuntime.is_online &&
                !!selectedRuntime.infoReady
              if (!selectedRuntimeValid) {
                setActiveRtId(undefined)
                return
              }
              setActiveRtId(value)
            }}
          >
            {renderRuntimes && renderRuntimes.length > 0 && !hasSelectableRuntime && (
              <option value={EMPTY_RUNTIME_VALUE} disabled>
                No runtime available
              </option>
            )}
            {renderRuntimes && renderRuntimes.length > 0 ? (
              renderRuntimes.map((rt: any) => {
                const isKnown = !!rt.infoReady
                const isBusy = isKnown && (rt.noRunner ?? 0) > 0
                const isSelectable = rt.is_online && isKnown
                return (
                  <option
                    value={rt.kit_id}
                    key={rt.kit_id}
                    disabled={!isSelectable}
                  >
                    {rt.is_online ? (!isKnown ? '🟡' : !isBusy ? '🟢' : '🔴') : '🟡'} {rt.name}
                    {isBusy ? ` (busy)` : ''}
                  </option>
                )
              })
            ) : (
              <option>No runtime connected</option>
            )}
          </select>
        </div>
        {showNoRuntimeGuidance && (
          <div className="mt-2 text-xs text-muted-foreground leading-5">
            Runtime server is reachable, but no runtime is connected. You can change the runtime server or add a private runtime in{' '}
            <a className="text-primary underline" href="/my-assets">
              My Assets
            </a>
            .
          </div>
        )}
      </div>
    )
  },
)

export default DaRuntimeConnector

