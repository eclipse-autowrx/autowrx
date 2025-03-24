import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
// import { socketio } from '@/services/socketio.service'
import useRuntimeStore from '@/stores/runtimeStore'
import { shallow } from 'zustand/shallow'
// import useModelStore from '@/stores/modelStore'
import useCurrentPrototype from '@/hooks/useCurrentPrototype'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { useAssets } from '@/hooks/useAssets'

import { io } from 'socket.io-client'

export interface Runtime {
  desc: string
  is_online: boolean
  kit_id: string
  last_seen: number
  name: string
  socket_id: string
  support_apis: any[] // You can be more specific with the API type if needed
}

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
  onAppRunningStateChanged?: (isRunning: boolean) => void
  onRuntimeInfoReceived?: (payload: any) => void
  onDeployResponse?: (log: string, isDone: boolean) => void
  // Filter by user's asset
  isDeployMode?: boolean
}

// const socketio = io(DEFAULT_KIT_SERVER);

const DaRuntimeConnector = forwardRef<any, KitConnectProps>(
  (
    {
      hideLabel = false,
      targetPrefix = 'runtime-',
      kitServerUrl,
      usedAPIs,
      onActiveRtChanged,
      onLoadedMockSignals,
      onNewLog,
      onAppRunningStateChanged,
      onRuntimeInfoReceived,
      onDeployResponse,
      isDeployMode = false,
    },
    ref,
  ) => {
    // const socketio = io(kitServerUrl || DEFAULT_KIT_SERVER);
    const [socketio, setSocketIo] = useState<any>(null)
    const [activeRtId, setActiveRtId] = useState<string | undefined>('')
    const [allRuntimes, setAllRuntimes] = useState<any>([])
    const [ticker, setTicker] = useState(0)

    const [rawApisPackage, setRawApisPackage] = useState<any>(null)
    const { data: prototype } = useCurrentPrototype()
    const { data: currentUser } = useSelfProfileQuery()
    const { useFetchAssets } = useAssets()
    const { data: assets } = useFetchAssets()
    const [renderRuntimes, setRenderRuntimes] = useState<Runtime[]>([])

    useImperativeHandle(ref, () => {
      return {
        runApp,
        runBinApp,
        stopApp,
        deploy,
        listPythonLibs,
        requestInstallLib,
        setMockSignals,
        loadMockSignals,
        writeSignalsValue,
        revertToDefaultVehicleModel,
        builldVehicleModel,
        getRuntimeInfo
      }
    })

    const [apisValue, setActiveApis, setAppLog] = useRuntimeStore(
      (state) => [state.apisValue, state.setActiveApis, state.setAppLog],
      shallow,
    )

    useEffect(() => {
      if (rawApisPackage) {
        console.log(`apis-value `, activeRtId)
        console.log(rawApisPackage)
        if (activeRtId && activeRtId==rawApisPackage?.kit_id) {
          console.log(`>>>>>>>>> receive apis-value`)
          // console.log(rawApisPackage)
          setActiveApis(rawApisPackage?.result || {})
        }
      }
    }, [rawApisPackage])

    // useEffect(() => {
    //   if (!usedAPIs) return

    //   if (activeRtId) {
    //     socketio.emit('messageToKit', {
    //       cmd: 'subscribe_apis',
    //       to_kit_id: activeRtId,
    //       apis: usedAPIs,
    //     })
    //   }
    // }, [usedAPIs, activeRtId])

    useEffect(() => {
      let timer = setInterval(() => {
        setTicker((oldTicker) => oldTicker + 1)
      }, 30 * 1000)
      return () => {
        if (timer) clearInterval(timer)
      }
    }, [])

    useEffect(() => {
      // console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>`)
      // console.log(`subscribe_apis activeRtId:${activeRtId} usedAPIs:${usedAPIs}`)
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

    const runApp = (code: string, appName: string) => {
      if (onNewLog) {
        onNewLog(`Run app\r\n`)
      }
      if (setAppLog) {
        setAppLog(`Run app\r\n`)
      }
      socketio.emit('messageToKit', {
        cmd: 'run_python_app',
        to_kit_id: activeRtId,
        usedAPIs: usedAPIs,
        data: {
          code: code,
          name: appName
        },
      })
    }

    const runBinApp = (appName: string) => {
      if (onNewLog) {
        onNewLog(`Run app\r\n`)
      }
      if (setAppLog) {
        setAppLog(`Run app\r\n`)
      }
      socketio.emit('messageToKit', {
        cmd: 'run_bin_app',
        to_kit_id: activeRtId,
        usedAPIs: usedAPIs,
        data: appName,
      })
    }

    const stopApp = () => {
      socketio.emit('messageToKit', {
        cmd: 'stop_python_app',
        to_kit_id: activeRtId,
        data: {},
      })
    }

    const deploy = () => {
      if (prototype && prototype.id && currentUser) {
        socketio.emit('messageToKit', {
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
        socketio.emit('messageToKit', {
          cmd: 'list_python_packages',
          to_kit_id: activeRtId,
        })
      }
    }

    const requestInstallLib = (libName: string) => {
      if (prototype && prototype.id && currentUser && libName) {
        socketio.emit('messageToKit', {
          cmd: 'install_python_packages',
          data: libName.trim(),
          to_kit_id: activeRtId,
        })
      }
    }

    const revertToDefaultVehicleModel = () => {
      if (prototype && prototype.id && currentUser) {
        socketio.emit('messageToKit', {
          cmd: 'revert_vehicle_model',
          data: "",
          to_kit_id: activeRtId,
        })
      }
    }

    const builldVehicleModel = (vss_json: string) => {
      if (prototype && prototype.id && currentUser && vss_json) {
        socketio.emit('messageToKit', {
          cmd: 'generate_vehicle_model',
          data: vss_json || "",
          to_kit_id: activeRtId,
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

    const getRuntimeInfo = () => {
      socketio.emit('messageToKit', {
        cmd: 'get-runtime-info',
        to_kit_id: activeRtId,
      })
    }

    useEffect(() => {
      if (onActiveRtChanged) {
        onActiveRtChanged(activeRtId)
      }

      if(activeRtId) {
        getRuntimeInfo()
      }

    }, [activeRtId])

    useEffect(() => {
      if (!kitServerUrl) return
      setSocketIo(io(kitServerUrl))
    }, [kitServerUrl])

    useEffect(() => {
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
    }, [socketio, socketio?.connected])

    useEffect(() => {
      // console.log(`activeRtId`, activeRtId)
      if (activeRtId) {
        localStorage.setItem('last-rt', activeRtId)
      }
    }, [activeRtId])

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

      // console.log("onGetAllKitData sortedKits", sortedKits)

      setAllRuntimes(sortedKits)
    }

    const onBroadCastToClient = (payload: any) => {
      if (!payload) return
      // console.log(`broadcastToClient`, payload)
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

      if (
        ['run_python_app', 'run_rust_app', 'run_bin_app'].includes(payload.cmd)
      ) {
        if (payload.isDone) {
          if (setAppLog) {
            setAppLog(`Exit code ${payload.code}\r\n`)
          }
          if (onNewLog) {
            onNewLog(`Exit code ${payload.code}\r\n`)
          }
          // if (onAppExit) {
          //   onAppExit(payload.code)
          // }
          if(onAppRunningStateChanged){
            onAppRunningStateChanged(false)
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

      if (
        ['generate_vehicle_model', 'revert_vehicle_model'].includes(payload.cmd)
      ) {
        if (setAppLog) {
          setAppLog((payload.result || '') + '\r\n')
        }
        if (onNewLog) {
          onNewLog((payload.result || '') + '\r\n')
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

      if (payload.cmd == 'list_python_packages' && onNewLog) {
        // console.log(payload)
        onNewLog(`Installed python libs on "${payload.kit_id}"\r\n`)
        onNewLog(payload.data)
      }

      if (
        payload.cmd == 'install_python_packages' &&
        onNewLog &&
        payload.data
      ) {
        // console.log(payload)
        onNewLog(payload.data)
      }

      if (['get-runtime-info', 'report-runtime-state'].includes(payload.cmd) && onNewLog) {
        onRuntimeStateResponse(payload)
      }
    }

    useEffect(() => {
      if (renderRuntimes && renderRuntimes.length > 0) {
        if (activeRtId) return
        let onlineRuntimes = renderRuntimes.filter(
          (rt: Runtime) => rt.is_online,
        )
        if (onlineRuntimes.length <= 0) {
          // console.log(`setActiveRtId(undefined) cause: no onlineRuntimes`)
          setActiveRtId(undefined)
          return
        }
        let lastOnlineRuntime = localStorage.getItem('last-rt')
        if (
          lastOnlineRuntime &&
          onlineRuntimes
            .map((rt: Runtime) => rt.kit_id)
            .includes(lastOnlineRuntime)
        ) {
          // console.log(`lastOnlineRuntime `, lastOnlineRuntime)
          setActiveRtId(lastOnlineRuntime)
          return
        }
        // console.log(`setActiveRtId `, onlineRuntimes[0].kit_id)
        setActiveRtId(onlineRuntimes[0].kit_id)
        localStorage.setItem('last-rt', onlineRuntimes[0].kit_id)
      } else {
        // console.log(`setActiveRtId(undefined) cause: noRuntime`)
        setActiveRtId(undefined)
      }
    }, [renderRuntimes])

    // Also update the second useEffect
    useEffect(() => {
      if (isDeployMode) {
        if (Array.isArray(assets)) {
          const userKitsAsset = assets.find(
            (asset) => asset.name === 'UserKits',
          )
          if (userKitsAsset) {
            const kits = JSON.parse(userKitsAsset.data || '[]')
            const kitIds = kits.map((kit: any) => `${kit.category}-${kit.id}`)
            const filteredRuntimes = allRuntimes.filter((rt: Runtime) =>
              kitIds.includes(rt.kit_id),
            )
            setRenderRuntimes(filteredRuntimes)
          }
        }
      } else {
        let publicRuntimes = allRuntimes.filter((rt:any) => rt.name.toLowerCase().startsWith('runtime-public-') || rt.name.toLowerCase().startsWith('runtime-shared-'))
        
        let myRuntimes = []
        if(Array.isArray(assets)) {
          // console.log("assets", assets)
          let runtimesAssets = assets.filter((a:any) => a.type == 'CLOUD_RUNTIME') || []
          let myRuntimeNames = runtimesAssets.map((asset:any) => asset.name.toLowerCase())
          myRuntimes = allRuntimes.filter((rt:any) => {
            let result = false
            myRuntimeNames.forEach((myRtName: string) => {
              if(rt.name.toLowerCase().startsWith(`${myRtName}`)){
                result = true
              }
            })
            return result
          })
        }

        if(myRuntimes.length>=3) {
          setRenderRuntimes([...new Set([...myRuntimes])])
        } else {
          let freeRuntimes = publicRuntimes.sort((a:any, b:any) => {
            return a.noRunner - b.noRunner
          })
          setRenderRuntimes([...new Set([...myRuntimes, ...freeRuntimes.slice(0, 3-myRuntimes.length)])])
        }
        
        
      }
    }, [assets, allRuntimes, isDeployMode])

    const onRuntimeStateResponse = (payload: any) => {
      // console.log(`onRuntimeStateResponse`)
      // console.log(payload)
      let newRunningState = false

      if(payload.data && payload.data.lsOfRunner && payload.data.lsOfRunner.length > 0){
        let myRunners = payload.data.lsOfRunner.filter((runner:any) => runner.request_from == socketio.id)
        if(myRunners.length > 0){
          newRunningState = true
        }
      }

      if(onAppRunningStateChanged){
        onAppRunningStateChanged(newRunningState)
      }
      if(onRuntimeInfoReceived) {
        onRuntimeInfoReceived(payload.data)
      }
    }

    return (
      <div>
        <div className="flex items-center">
          {!hideLabel && (
            <label className="w-[122px] text-da-gray-dark font-medium ">
              Runtime:
            </label>
          )}
          <select
            aria-label="deploy-select"
            className={`border rounded da-label-small px-2 py-1 w-full min-w-[90px] text-da-gray-dark bg-gray-200`}
            value={activeRtId as any}
            onChange={(e) => {
              // console.log(`setActiveRtId(e.target.value) `, e.target.value)
              setActiveRtId(e.target.value)
            }}
          >
            {renderRuntimes && renderRuntimes.length > 0 ? (
              renderRuntimes.map((rt: any) => {
                return (
                  <option
                    value={rt.kit_id}
                    key={rt.kit_id}
                    disabled={!rt.is_online}
                  >
                    <div className="text-[20px] flex items-center disabled:text-white text-white">
                      {rt.is_online ? (!rt.noRunner?'🟢':'🔴'): '🟡'} {rt.name} {rt.noRunner?`(${rt.noRunner})`:''}
                    </div>
                  </option>
                )
              })
            ) : (
              <option>No runtime available</option>
            )}
          </select>
        </div>
      </div>
    )
  },
)

export default DaRuntimeConnector
