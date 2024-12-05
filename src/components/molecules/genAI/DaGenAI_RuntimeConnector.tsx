import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
// import { socketio } from '@/services/socketio.service'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
// import useModelStore from '@/stores/modelStore'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useWizardGenAIStore from '@/stores/genAIWizardStore'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'

import { io } from 'socket.io-client'

interface KitConnectProps {
  // code: string;
  kitServerUrl?: string
  hideLabel?: boolean
  targetPrefix: string
  usedAPIs: string[]
  // allKit: any[];
  onActiveRtChanged?: (newActiveKitId: string | undefined) => void
  onLoadedMockSignals?: (signals: []) => void
  onNewLog?: (log: string) => void
  onAppExit?: (code: any) => void
  onDeployResponse?: (log: string, isDone: boolean) => void
}

const DaGenAI_RuntimeConnector = forwardRef<any, KitConnectProps>(
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
    },
    ref,
  ) => {
    // const socketio = io(kitServerUrl || DEFAULT_KIT_SERVER);
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
        if (rawApisPackage.result) {
          setActiveApis(rawApisPackage.result)
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
      console.log(
        'Deploy app to RuntimeID: ',
        activeRtId,
        ' with the SDV code: ',
        wizardPrototype.code,
      )
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
      console.log('Try to connect to KIT Server URL: ', kitServerUrl)
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
      // console.log('Wizard Active RuntimeID: ', wizardActiveRtId)
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
    }, [socketio]) // Remove socketio?.connected to prevent un-necessary change

    useEffect(() => {
      console.log(`activeRtId`, activeRtId)
      if (activeRtId) {
        localStorage.setItem('last-wizard-rt', activeRtId)
      }
    }, [activeRtId])

    useEffect(() => {
      // console.log(`activeRtId `, wizardActiveRtId)
      if (wizardActiveRtId) {
        setActiveRtId(wizardActiveRtId)
      }
    }, [wizardActiveRtId])

    useEffect(() => {
      if (allRuntimes && allRuntimes.length > 0) {
        if (activeRtId) return // Do not change activeRtId if it's already set by the user

        let onlineRuntimes = allRuntimes.filter((rt: any) => rt.is_online)

        if (onlineRuntimes.length <= 0) {
          console.log(`setActiveRtId(undefined) cause: no onlineRuntimes`)
          setActiveRtId(undefined)
          setWizardActiveRtId(undefined)
          return
        }

        // Try to find the default runtime with kit_id starting with 'RunTime-ETAS-E2E'
        let defaultRuntime = onlineRuntimes.find((rt: any) =>
          rt.kit_id.startsWith('RunTime-ETAS-E2E'),
        )

        if (defaultRuntime) {
          console.log(`setActiveRtId to defaultRuntime`, defaultRuntime.kit_id)
          setActiveRtId(defaultRuntime.kit_id)
          setWizardActiveRtId(defaultRuntime.kit_id)
          localStorage.setItem('last-wizard-rt', defaultRuntime.kit_id)
          return
        }

        // If not found, use the last selected runtime from localStorage if it's online
        let lastOnlineRuntime = localStorage.getItem('last-wizard-rt')
        if (
          lastOnlineRuntime &&
          onlineRuntimes.some((rt: any) => rt.kit_id === lastOnlineRuntime)
        ) {
          console.log(`lastOnlineRuntime `, lastOnlineRuntime)
          setActiveRtId(lastOnlineRuntime)
          setWizardActiveRtId(lastOnlineRuntime)
          return
        }

        // If none of the above, set activeRtId to the first online runtime
        console.log(`setActiveRtId `, onlineRuntimes[0].kit_id)
        setActiveRtId(onlineRuntimes[0].kit_id)
        setWizardActiveRtId(onlineRuntimes[0].kit_id)
        localStorage.setItem('last-wizard-rt', onlineRuntimes[0].kit_id)
      } else {
        console.log(`setActiveRtId(undefined) cause: noRuntime`)
        setActiveRtId(undefined)
        setWizardActiveRtId(undefined)
      }
    }, [allRuntimes])

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
      // console.log(data)
      let kits = [...data].filter((kit: any) => {
        // return new Date().getTime() - new Date(kit.last_seen).getTime() < 100000000
        return kit.is_online
      })

      // First filter the kits
      let sortedKits = kits.filter((rt) =>
        rt.kit_id
          .toLowerCase()
          .startsWith(targetPrefix ? targetPrefix.toLowerCase() : 'runtime-'),
      )

      // Then sort by online status and kit_id
      sortedKits.sort((a, b) => {
        // Sort by online status first
        if (a.is_online !== b.is_online) {
          return b.is_online - a.is_online
        }

        // Extract the parts after the last hyphen
        const aLastPart = getLastPart(a.kit_id)
        const bLastPart = getLastPart(b.kit_id)

        // Compare numeric parts if they are numbers, otherwise compare as strings
        const aNumeric = parseInt(aLastPart, 10)
        const bNumeric = parseInt(bLastPart, 10)

        if (!isNaN(aNumeric) && !isNaN(bNumeric)) {
          return aNumeric - bNumeric
        } else {
          return aLastPart.localeCompare(bLastPart)
        }
      })

      setAllRuntimes(sortedKits)
      setAllWizardRuntimes(sortedKits)
    }

    const onBroadCastToClient = (payload: any) => {
      if (!payload) return
    }

    const onKitReply = (payload: any) => {
      if (!payload) return

      if (payload.cmd == 'deploy_request' || payload.cmd == 'deploy-request') {
        // console.log(payload)
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
      if (payload.cmd == 'run_python_app') {
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

      if (payload.cmd == 'apis-value') {
        // console.log(`apis-value `, activeRtId)
        // console.log(payload)
        if (payload.result) {
          setRawApisPackage(payload)
          // console.log(`receive apis-value`)
          // setActiveApis(payload.result)
        }
      }

      if (payload.cmd == 'list_mock_signal') {
        if (!onLoadedMockSignals) return
        if (payload && payload.data && Array.isArray(payload.data)) {
          onLoadedMockSignals(payload.data)
        }
      }
    }

    useEffect(() => {
      console.log('isAuthorized, ', isAuthorized)
    }, [isAuthorized])

    return (
      <div>
        <div className="flex items-center">
          {!hideLabel && (
            <label className="mr-3 da-small-medium">Runtime:</label>
          )}
          {isAuthorized ? (
            <select
              aria-label="deploy-select"
              className={`border rounded da-label-small px-2 py-1 w-full min-w-[100px] text-da-gray-dark bg-gray-200 !cursor-pointer`}
              value={activeRtId as any}
              onChange={(e) => {
                // console.log(`setActiveRtId(e.target.value) `, e.target.value)
                setActiveRtId(e.target.value)
              }}
            >
              {allRuntimes &&
                allRuntimes.map((rt: any) => {
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
          ) : (
            <div>You dont have permission to deploy</div>
          )}
        </div>
      </div>
    )
  },
)

export default DaGenAI_RuntimeConnector
