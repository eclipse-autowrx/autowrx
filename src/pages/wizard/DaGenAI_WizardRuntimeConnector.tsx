import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useWizardGenAIStore from '@/pages/wizard/useGenAIWizardStore'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { io } from 'socket.io-client'

interface KitConnectProps {
  kitServerUrl?: string
  hideLabel?: boolean
  targetPrefix: string
  usedAPIs: string[]
  onActiveRtChanged?: (newActiveKitId: string | undefined) => void
  onLoadedMockSignals?: (signals: []) => void
  onNewLog?: (log: string) => void
  onAppExit?: (code: any) => void
  onDeployResponse?: (log: string, isDone: boolean) => void
  onKitAvailabilityChange?: (isAvailable: boolean) => void
}

const DaGenAI_WizardRuntimeConnector = forwardRef<any, KitConnectProps>(
  (
    {
      hideLabel = false,
      targetPrefix = 'runtime-',
      kitServerUrl,
      usedAPIs,
      onActiveRtChanged,
      onLoadedMockSignals,
      onNewLog,
      onAppExit,
      onDeployResponse,
      onKitAvailabilityChange,
    },
    ref,
  ) => {
    // Create a storage key based on the targetPrefix so that selections
    // for runtime and kit are kept separate.
    const storageKey = `last-wizard-rt-${targetPrefix.toLowerCase()}`

    const [socketio, setSocketIo] = useState<any>(null)
    const [activeRtId, setActiveRtId] = useState<string | undefined>('')
    const [allRuntimes, setAllRuntimes] = useState<any>([])
    const [ticker, setTicker] = useState(0)
    const [rawApisPackage, setRawApisPackage] = useState<any>(null)
    const [isAuthorized] = usePermissionHook([PERMISSIONS.DEPLOY_HARDWARE])

    const {
      wizardPrototype,
      setAllWizardRuntimes,
      wizardActiveRtId,
      setWizardActiveRtId,
    } = useWizardGenAIStore()

    const { data: currentUser } = useSelfProfileQuery()

    useImperativeHandle(ref, () => {
      return {
        runApp,
        stopApp,
        deploy,
        setMockSignals,
        loadMockSignals,
        writeSignalsValue,
      }
    })

    const [apisValue, setActiveApis, setAppLog] = useRuntimeStore(
      (state) => [state.apisValue, state.setActiveApis, state.setAppLog],
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
      }, 30 * 1000)
      return () => {
        if (timer) clearInterval(timer)
      }
    }, [])

    useEffect(() => {
      if (activeRtId) {
        socketio.emit('messageToKit', {
          cmd: 'subscribe_apis',
          to_kit_id: activeRtId,
          apis: usedAPIs || [],
        })
      }
    }, [ticker, activeRtId, usedAPIs])

    useEffect(() => {
      if (!socketio) return
      socketio.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId,
      })
    }, [activeRtId])

    const runApp = (code: string) => {
      console.log(
        'Start app on RuntimeID:',
        activeRtId,
        ' with the SDV code: ',
        code,
      )
      if (onNewLog) {
        onNewLog(`Run app\r\n`)
      }
      if (setAppLog) {
        setAppLog(`Run app\r\n`)
      }
      socketio.emit('messageToKit', {
        cmd: 'run_python_app',
        to_kit_id: activeRtId,
        usedAPIs: usedAPIs, // Match current method of DaRuntimeConnector
        data: {
          code: code,
        },
      })
    }

    const stopApp = () => {
      if (!socketio || !socketio.connected) {
        console.error('SocketIO is not initialized or connected.')
        return
      }
      socketio.emit('messageToKit', {
        cmd: 'stop_python_app',
        to_kit_id: activeRtId,
        data: {},
      })
    }

    const deploy = () => {
      console.log('Deploy vehicle app to target: ', activeRtId)
      if (wizardPrototype && wizardPrototype.id && currentUser) {
        socketio.emit('messageToKit', {
          cmd: 'deploy_request',
          disable_code_convert: true,
          to_kit_id: activeRtId,
          code: wizardPrototype.code || '',
          prototype: {
            name: wizardPrototype.name || 'no-name',
            id: wizardPrototype.id || 'no-id',
          },
          username: currentUser.name,
        })
      }
    }

    const setMockSignals = (signals: any[]) => {
      socketio.emit('messageToKit', {
        cmd: 'set_mock_signals',
        to_kit_id: activeRtId,
        data: signals || [],
      })
    }

    const writeSignalsValue = (obj: any) => {
      if (!socketio || !socketio.connected) {
        console.error('SocketIO is not initialized or connected.')
        return
      }
      socketio.emit('messageToKit', {
        cmd: 'write_signals_value',
        to_kit_id: activeRtId,
        data: obj || {},
      })
    }

    const loadMockSignals = () => {
      socketio.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId,
      })
    }

    useEffect(() => {
      if (onActiveRtChanged) {
        onActiveRtChanged(activeRtId)
      }
    }, [activeRtId])

    useEffect(() => {
      if (!kitServerUrl) {
        console.log('Kit Server URL is undefined')
        return
      }
      const socket = io(kitServerUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      })

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err)
      })

      socket.on('error', (err) => {
        console.error('Socket error:', err)
      })

      setSocketIo(socket)

      // Clean up the socket connection on unmount
      return () => {
        socket.disconnect()
      }
    }, [kitServerUrl])

    useEffect(() => {
      console.log('Wizard Active RuntimeID: ', activeRtId)
      if (!socketio) return

      if (!socketio.connected) {
        socketio.connect()
      } else {
        registerClient()
      }

      socketio.on('connect', onConnected)
      socketio.on('disconnect', onDisconnect)
      socketio.on('list-all-kits-result', onGetAllKitData)
      socketio.on('messageToKit-kitReply', onKitReply)
      socketio.on('broadcastToClient', onBroadCastToClient)

      return () => {
        if (activeRtId) {
          socketio.emit('messageToKit', {
            cmd: 'unsubscribe_apis',
            to_kit_id: activeRtId,
          })
        }

        socketio.off('connect', onConnected)
        socketio.off('disconnect', onDisconnect)
        socketio.off('list-all-kits-result', onGetAllKitData)
        socketio.off('messageToKit-kitReply', onKitReply)
        socketio.off('broadcastToClient', onBroadCastToClient)
        socketio.emit('unregister_client', {})
        unregisterClient()
        socketio.disconnect()
      }
    }, [socketio])

    // Store activeRtId using the prefix-specific storage key
    useEffect(() => {
      console.log(`activeRtId`, activeRtId)
      if (activeRtId) {
        localStorage.setItem(storageKey, activeRtId)
      }
    }, [activeRtId, storageKey])

    useEffect(() => {
      // Autoselect runtime if the targetPrefix starts with "runtime-" for simulation use cases
      if (
        targetPrefix.toLowerCase().startsWith('runtime-') &&
        wizardActiveRtId
      ) {
        setActiveRtId(wizardActiveRtId)
      }
    }, [wizardActiveRtId, targetPrefix])

    useEffect(() => {
      if (allRuntimes && allRuntimes.length > 0) {
        if (activeRtId) return // Do not change if already set by the user

        let onlineRuntimes = allRuntimes.filter((rt: any) => rt.is_online)

        if (onlineRuntimes.length <= 0) {
          console.log(`setActiveRtId(undefined) cause: no onlineRuntimes`)
          setActiveRtId(undefined)
          if (targetPrefix.toLowerCase().startsWith('runtime-')) {
            setWizardActiveRtId(undefined)
          }
          return
        }

        // First, try to use the last selected runtime from localStorage.
        let lastOnlineRuntime = localStorage.getItem(storageKey)
        if (
          lastOnlineRuntime &&
          onlineRuntimes.some((rt: any) => rt.kit_id === lastOnlineRuntime)
        ) {
          console.log(`Using last online runtime: `, lastOnlineRuntime)
          setActiveRtId(lastOnlineRuntime)
          if (targetPrefix.toLowerCase().startsWith('runtime-')) {
            setWizardActiveRtId(lastOnlineRuntime)
          }
          return
        }

        // Otherwise, set activeRtId to the first available online kit.
        console.log(
          `setActiveRtId to first available kit: `,
          onlineRuntimes[0].kit_id,
        )
        setActiveRtId(onlineRuntimes[0].kit_id)
        if (targetPrefix.toLowerCase().startsWith('runtime-')) {
          setWizardActiveRtId(onlineRuntimes[0].kit_id)
        }
        localStorage.setItem(storageKey, onlineRuntimes[0].kit_id)
      } else {
        console.log(`setActiveRtId(undefined) cause: noRuntime`)
        setActiveRtId(undefined)
        if (targetPrefix.toLowerCase().startsWith('runtime-')) {
          setWizardActiveRtId(undefined)
        }
      }
    }, [allRuntimes, activeRtId, storageKey, targetPrefix])

    const onConnected = () => {
      registerClient()
      setTimeout(() => {
        if (activeRtId) {
          socketio.emit('messageToKit', {
            cmd: 'list-all-kits',
          })
        }
      }, 1000)
      if (usedAPIs) {
        setTicker((oldTicker) => oldTicker + 1)
      }
    }

    const registerClient = () => {
      socketio.emit('register_client', {
        username: 'test',
        user_id: 'test',
        domain: 'domain',
      })
    }

    const unregisterClient = () => {
      socketio.emit('unregister_client', {})
    }

    const onDisconnect = () => {}

    const onGetAllKitData = (data: any) => {
      // Helper function to extract the part after the last hyphen
      const getLastPart = (kit_id: string) => {
        const parts = kit_id.split('-')
        return parts[parts.length - 1]
      }
      // Filter kits that are online
      let kits = [...data].filter((kit: any) => kit.is_online)

      // Filter kits based on the targetPrefix (e.g. "runtime-", "kit-", etc.)
      let sortedKits = kits.filter((rt) =>
        rt.kit_id
          .toLowerCase()
          .startsWith(targetPrefix ? targetPrefix.toLowerCase() : 'runtime-'),
      )

      // Sort the filtered kits by online status and by kit_id numeric parts
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

      setAllRuntimes(sortedKits)
      console.log('Sorted Kit at WizardRuntimeConnector: ', sortedKits)

      // Only update the global wizard store if the targetPrefix starts with "runtime-"
      if (targetPrefix && targetPrefix.toLowerCase().startsWith('runtime-')) {
        setAllWizardRuntimes(sortedKits)
      }

      if (onKitAvailabilityChange)
        onKitAvailabilityChange(sortedKits.length > 0)
    }

    const onBroadCastToClient = (payload: any) => {
      if (!payload) return
    }

    const onKitReply = (payload: any) => {
      if (!payload) return

      if (
        payload.cmd === 'deploy_request' ||
        payload.cmd === 'deploy-request'
      ) {
        if (onDeployResponse) {
          onDeployResponse(payload.result, payload.is_finish)
        }
        if (setAppLog) {
          setAppLog(payload.result || '')
        }
        if (onNewLog) {
          onNewLog(payload.result || '')
        }
      }
      if (payload.cmd === 'run_python_app') {
        if (payload.isDone) {
          if (setAppLog) {
            setAppLog(`Exit code ${payload.code}\r\n`)
          }
          if (onNewLog) {
            onNewLog(`Exit code ${payload.code}\r\n`)
          }
          if (onAppExit) {
            onAppExit(payload.code)
          }
        } else {
          if (setAppLog) {
            setAppLog(payload.result || '')
          }
          if (onNewLog) {
            onNewLog(payload.result || '')
          }
        }
      }

      if (payload.cmd === 'apis-value') {
        if (payload.result) {
          setRawApisPackage(payload)
        }
      }

      if (payload.cmd === 'list_mock_signal') {
        if (!onLoadedMockSignals) return
        if (payload && payload.data && Array.isArray(payload.data)) {
          onLoadedMockSignals(payload.data)
        }
      }
    }

    return (
      <div>
        <div className="flex items-center">
          {!hideLabel && (
            <label className="mr-3 da-small-medium">Runtime:</label>
          )}
          {isAuthorized ? (
            allRuntimes && allRuntimes.length > 0 ? (
              <div className="border pr-2 rounded-md overflow-hidden">
                <select
                  aria-label="deploy-select"
                  className="text-sm font-medium px-2 py-1 w-full min-w-[100px] text-da-gray-dark outline-none ring-0 !cursor-pointer"
                  value={activeRtId as any}
                  onChange={(e) => {
                    console.log(
                      `Change target at WizardRuntimeConnector: `,
                      e.target.value,
                    )
                    setActiveRtId(e.target.value)
                    e.preventDefault()
                  }}
                >
                  {allRuntimes.map((rt: any) => {
                    return (
                      <option
                        value={rt.kit_id}
                        key={rt.kit_id}
                        disabled={!rt.is_online}
                      >
                        <div className="text-[20px] flex items-center disabled:text-white text-white !cursor-pointer">
                          {rt.is_online ? '🟢' : '🟡'} {rt.name}
                        </div>
                      </option>
                    )
                  })}
                </select>
              </div>
            ) : (
              <div>
                No{' '}
                {targetPrefix
                  ? targetPrefix.toLowerCase().replace(/-/g, '')
                  : 'runtime'}{' '}
                available
              </div>
            )
          ) : (
            <div>You dont have permission to deploy</div>
          )}
        </div>
      </div>
    )
  },
)

export default DaGenAI_WizardRuntimeConnector
