import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
import { socketio } from '@/services/socketio.service'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
// import useModelStore from '@/stores/modelStore'

interface KitConnectProps {
  // code: string;
  usedAPIs: string[]
  // allKit: any[];
  onActiveRtChanged?: (newActiveKitId: string | undefined) => void
  onLoadedMockSignals?: (signals: []) => void
  onNewLog?: (log: string) => void
  onAppExit?: (code: any) => void
}

const DaRuntimeConnector = forwardRef<any, KitConnectProps>(
  ({ usedAPIs, onActiveRtChanged, onLoadedMockSignals, onNewLog, onAppExit }, ref) => {
    const [activeRtId, setActiveRtId] = useState<string | undefined>('')
    const [allRuntimes, setAllRuntimes] = useState<any>([])
    const [ticker, setTicker] = useState(0)

    useImperativeHandle(ref, () => {
      return { runApp, stopApp, setMockSignals, loadMockSignals }
    })

    const [apisValue, setActiveApis] = useRuntimeStore(
      (state) => [state.apisValue, state.setActiveApis],
      shallow,
    )

    useEffect(() => {
      if (!usedAPIs) return

      if (activeRtId) {
        socketio.emit('messageToKit', {
          cmd: 'subscribe_apis',
          to_kit_id: activeRtId,
          apis: usedAPIs,
        })
      }
    }, [usedAPIs])

    useEffect(() => {
      let timer = setInterval(() => {
        setTicker((oldTicker) => oldTicker + 1)
      }, 30*1000)
      return () => {
        if (timer) clearInterval(timer)
      }
    }, [])

    useEffect(() => {
      if (activeRtId) {
        socketio.emit('messageToKit', {
          cmd: 'subscribe_apis',
          to_kit_id: activeRtId,
          apis: usedAPIs,
        })
      }
    }, [ticker, activeRtId])

    useEffect(() => {
      socketio.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId
      })
    }, [activeRtId])

    const runApp = (code: string) => {
      if (onNewLog) {
        onNewLog(`Run app\r\n`)
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
      socketio.emit('messageToKit', {
        cmd: 'stop_python_app',
        to_kit_id: activeRtId,
        data: {},
      })
    }

    const setMockSignals = (signals: any[]) => {
      socketio.emit('messageToKit', {
        cmd: 'set_mock_signals',
        to_kit_id: activeRtId,
        data: signals || [],
      })
    }

    const loadMockSignals = () => {
      socketio.emit('messageToKit', {
        cmd: 'list_mock_signal',
        to_kit_id: activeRtId
      })
    }

    useEffect(() => {
      if (onActiveRtChanged) {
        onActiveRtChanged(activeRtId)
      }

      if (activeRtId) {
        socketio.emit('messageToKit', {
          cmd: 'subscribe_apis',
          to_kit_id: activeRtId,
          apis: ['Vehicle.AverageSpeed'],
        })
      }
    }, [activeRtId])

    useEffect(() => {
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
    }, [])

    useEffect(() => {
      if(activeRtId) {
        localStorage.setItem("last-rt", activeRtId);
      }
    }, [activeRtId])

    useEffect(() => {
      if (allRuntimes && allRuntimes.length > 0) {
        if (activeRtId) return
        let onlineRuntimes = allRuntimes.filter((rt: any) => rt.is_online)
        if(onlineRuntimes.length<=0) {
          setActiveRtId(undefined)
          return
        }
        let lastOnlineRuntime = localStorage.getItem("last-rt");
        if(lastOnlineRuntime && onlineRuntimes.map((rt:any) => rt.kit_id).includes(lastOnlineRuntime)) {
          setActiveRtId(lastOnlineRuntime)
          return
        }
        setActiveRtId(onlineRuntimes[0].kit_id)
        localStorage.setItem("last-rt", onlineRuntimes[0].kit_id);
      } else {
        setActiveRtId(undefined)
      }
    }, [allRuntimes])

    const onConnected = () => {
      registerClient()
      if (usedAPIs) {
        setTimeout(() => {
          if (activeRtId) {
            socketio.emit('messageToKit', {
              cmd: 'subscribe_apis',
              to_kit_id: activeRtId,
              apis: usedAPIs,
            })
          }
        }, 1000)
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

      // First filter the kits
      let sortedKits = [...data].filter((rt) =>
        rt.kit_id.toLowerCase().startsWith('runtime-'),
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
    }

    const onBroadCastToClient = (payload: any) => {
      if (!payload) return
    }

    const onKitReply = (payload: any) => {
      if (!payload) return
      //
      if (payload.cmd == 'run_python_app') {
        if (payload.isDone) {
          if (onNewLog) {
            onNewLog(`Exit code ${payload.code}\r\n`)
          }
          if (onAppExit) {
            onAppExit(payload.code)
          }
        } else {
          if (onNewLog) {
            onNewLog(payload.result || '')
          }
        }
      }

      if (payload.cmd == 'apis-value') {
        if (payload.result) {
          //
          setActiveApis(payload.result)
        }
      }

      if(payload.cmd == 'list_mock_signal') {
        if(!onLoadedMockSignals) return
        if(payload && payload.data && Array.isArray(payload.data)) {
          onLoadedMockSignals(payload.data)
        }
      }
    }

    return (
      <div>
        <div className="flex items-center">
          <label className="mr-2 da-label-small">Runtime:</label>
          <select
            className={`border rounded da-label-small px-2 py-1 min-w-[240px] text-da-white bg-da-gray-medium`}
            value={activeRtId as any}
            onChange={(e) => {
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
                    <div className="text-[20px] flex items-center">
                      {rt.is_online ? '🟢' : '🟡'} {rt.name}
                    </div>
                  </option>
                )
              })}
          </select>
        </div>
      </div>
    )
  },
)

export default DaRuntimeConnector
