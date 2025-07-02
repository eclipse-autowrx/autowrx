// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { DaButton } from '@/components/atoms/DaButton'
import { FC, useEffect, useRef, useState } from 'react'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { shallow } from 'zustand/shallow'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import CodeEditor from '../CodeEditor'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaApisWatch from './DaApisWatch'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import DaMockManager from './DaMockManager'
import { countCodeExecution } from '@/services/prototype.service'
import { DaInput } from '@/components/atoms/DaInput'
import { SlOptionsVertical } from 'react-icons/sl'
import config from '@/configs/config'
import DaMenu from '@/components/atoms/DaMenu'
import DaRemoteCompileRust from '../remote-compiler/DaRemoteCompileRust'
import { useSystemUI } from '@/hooks/useSystemUI'
import { TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb'
import { cn } from '@/lib/utils'
import DaPopup from '@/components/atoms/DaPopup'
import RuntimeAssetManager from '@/components/organisms/RuntimeAssetManager'
import {
  getComputedAPIs,
} from '@/services/model.service'
import { GoDotFill } from "react-icons/go";
import { set } from 'lodash'

const DEFAULT_KIT_SERVER = 'https://kit.digitalauto.tech'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<any>(null)
  useEffect(() => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView()
    }
  })

  return <div ref={elementRef} />
}

const DaRuntimeControl: FC = ({ }) => {
  const { data: currentUser } = useSelfProfileQuery()

  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )
  const {
    showPrototypeDashboardFullScreen,
    setShowPrototypeDashboardFullScreen,
  } = useSystemUI()
  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()
  const runTimeRef1 = useRef<any>()

  const rustCompilerRef = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined)

  const [usedApis, setUsedApis] = useState<any[]>([])
  const [code, setCode] = useState<string>('')
  const [showManageRt, setShowManageRt] = useState<boolean>(false)
  const [requestContent, setRequestContent] = useState<string>('')
  const [requestMode, setRequestMode] = useState<string>('')

  const [isAdvantageMode, setIsAdvantageMode] = useState<number>(-5)

  const [mockSignals, setMockSignals] = useState<any[]>([])
  const [customKitServer, setCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [tmpCustomKitServer, setTmpCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [isShowEditKitServer, setIsShowEditKitServer] = useState<boolean>(false)

  const [showRtDialog, setShowRtDialog] = useState<boolean>(false)

  const [useRuntime, setUseRuntime] = useState<boolean>(true)
  const [curRuntimeInfo, setCurRuntimeInfo] = useState<any>(null)
  const [runningAppsOnRt, setRunningAppsOnRt] = useState<any[]>([])
  const [listenerOnRt, setListenerOnRt] = useState<any[]>([])

  useEffect(() => {
    setCurRuntimeInfo(null)
    setListenerOnRt([])
    setRunningAppsOnRt([])
  }, [activeRtId])

  // const [showStaging, setShowStaging] = useState<boolean>(false)

  const handleMessageListenter = (e: any) => {
    // console.log('window on message', e)
    if (!e.data) return
    // console.log(`onMessage`, e.data)
    try {
      let payload = JSON.parse(e.data)
      if (payload.cmd == 'set-api-value' && payload.api) {
        let obj = {} as any
        obj[`${payload.api}`] = payload.value
        writeSignalValue(obj)
      }
    } catch (err) {
      // console.log(err)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessageListenter)
    return () => {
      window.removeEventListener('message', handleMessageListenter)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('customKitServer', customKitServer.trim())
  }, [customKitServer])

  useEffect(() => {
    if(!curRuntimeInfo) {
      setRunningAppsOnRt([])
      setListenerOnRt([])
    }
    if (curRuntimeInfo && curRuntimeInfo.lsOfRunner) {
      setRunningAppsOnRt(curRuntimeInfo.lsOfRunner || [])
    }
    if (curRuntimeInfo && curRuntimeInfo.lsOfApiSubscriber) {
      let lsOfListener = []
      for (let [key, value] of Object.entries(curRuntimeInfo.lsOfApiSubscriber)) {
        lsOfListener.push(value)
      }
      setListenerOnRt(lsOfListener)
    }
  }, [curRuntimeInfo])

  useEffect(() => {
    if (prototype) {
      setCode(prototype.code || '')
    } else {
      setCode('')
    }
  }, [prototype?.code])

  useEffect(() => {
    if (!code || !activeModelApis || activeModelApis.length === 0) {
      setUsedApis([])
      return
    }
    let dashboardCfg = prototype?.widget_config || ''
    let apis: any[] = []
    activeModelApis.forEach((item: any) => {
      if (item.shortName) {
        if (
          code.includes(item.shortName) ||
          dashboardCfg.includes(item.shortName)
        ) {
          apis.push(item.name)
        }
      }
    })
    //
    setUsedApis(apis)
  }, [code, activeModelApis, prototype?.widget_config])

  const appendLog = (content: String) => {
    if (!content) return
    setLog((log) => log + content)
  }

  const writeSignalValue = (obj: any) => {
    if (!obj) return

    if (runTimeRef.current) {
      runTimeRef.current?.writeSignalsValue(obj)
    }
    if (runTimeRef1.current) {
      runTimeRef1.current?.writeSignalsValue(obj)
    }
  }

  const notifyWidgetIframes = (data: any) => {
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage(JSON.stringify(data), '*')
    })
  }

  const getTimeSpandAsString = (from: number) => {
    // example from = 1738832993.9763865
    const now = Date.now()
    const diff = now - from * 1000
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(weeks / 4)
    const years = Math.floor(months / 12)
    if (years > 0) return `${years} years ago`
    if (months > 0) return `${months} months ago`
    if (weeks > 0) return `${weeks} weeks ago`
    if (days > 0) return `${days} days ago`
    if (hours > 0) return `${hours} hours ago`
    if (minutes > 0) return `${minutes} minutes ago`
    if (seconds > 0) return `${seconds} seconds ago`
    return 'just now'

  }

  return (
    <div
      data-id="runtime-control-panel"
      className={cn(
        `bottom-0 right-0 top-0 z-10 flex flex-col justify-center bg-da-gray-darkest px-1 py-1 text-da-gray-light`,
        isExpand ? 'w-[500px]' : 'w-14',
        showPrototypeDashboardFullScreen ? 'fixed top-[58px]' : 'absolute',
      )}
    >

      <DaPopup trigger={<span></span>} state={[showRtDialog, setShowRtDialog]}>
        <RuntimeAssetManager onClose={() => {
          setShowRtDialog(false)
          setUseRuntime(false)
          setTimeout(() => {
            setUseRuntime(true)
          }, 500)
        }}
          onCancel={() => {
            setShowRtDialog(false)
          }} />
      </DaPopup>

      {/* <div>{customKitServer}</div> */}
      {isExpand && isShowEditKitServer && (
        <div className="flex mb-2">
          <DaInput
            className="grow text-da-black"
            value={tmpCustomKitServer}
            onChange={(e) => {
              setTmpCustomKitServer(e.target.value)
            }}
          />
          <DaButton
            className="ml-2 w-20"
            onClick={() => {
              setCustomKitServer(tmpCustomKitServer)
              setIsShowEditKitServer(false)
            }}
          >
            Set
          </DaButton>
          <DaButton
            className="ml-2 w-20"
            onClick={() => {
              setIsShowEditKitServer(false)
            }}
          >
            Cancel
          </DaButton>
        </div>
      )}
      <div className={`px-1 flex ${!isExpand && 'hidden'}`}>
        {useRuntime && <>
          {customKitServer && customKitServer.trim().length > 0 ? (
            <DaRuntimeConnector
              targetPrefix="runtime-"
              kitServerUrl={customKitServer}
              ref={runTimeRef}
              usedAPIs={usedApis}
              onActiveRtChanged={(rtId: string | undefined) =>
                setActiveRtId(rtId)
              }
              onLoadedMockSignals={setMockSignals}
              onNewLog={appendLog}
              onAppRunningStateChanged={(state: boolean) => {
                setIsRunning(state)
              }}
              onRuntimeInfoReceived={setCurRuntimeInfo}
            />
          ) : (
            <DaRuntimeConnector
              targetPrefix="runtime-"
              kitServerUrl={config?.runtime?.url || DEFAULT_KIT_SERVER}
              ref={runTimeRef1}
              usedAPIs={usedApis}
              onActiveRtChanged={(rtId: string | undefined) =>
                setActiveRtId(rtId)
              }
              onLoadedMockSignals={setMockSignals}
              onNewLog={appendLog}
              onAppRunningStateChanged={(state: boolean) => {
                setIsRunning(state)
              }}
              onRuntimeInfoReceived={setCurRuntimeInfo}
            />
          )}
        </>}

        <div className="pl-2">
          <DaButton
            variant="plain"
            size="sm"
            onClick={() => {
              // setShowManageRt(true)
              setShowRtDialog(true)
            }}
            className='!text-yellow-400'
            dataId='btn-add-runtime'
          >
            Add Runtime
            {/* <div className="text-da-white hover:underline hover:text-da-gray-darkest font-semibold text-yellow-300">
              Config RT
            </div> */}
          </DaButton>
        </div>
        <div className="grow" />

        <SlOptionsVertical
          size={36}
          className="text-da-white cursor-pointer hover:bg-slate-500 p-2 rounded"
          onClick={() => {
            setIsShowEditKitServer((v) => !v)
          }}
        />
      </div>

      <div className={`flex px-1 ${!isExpand && 'flex-col'}`}>
        {activeRtId && (
          <>
            <button
              disabled={isRunning}
              data-id="btn-run-prototype"
              onClick={() => {
                setIsRunning(true)
                setActiveTab('output')
                setLog('')
                switch (prototype?.language) {
                  case 'rust':
                    if (rustCompilerRef.current) {
                      rustCompilerRef.current?.requestCompile(code || '')
                    }
                    break
                  default:
                    if (runTimeRef.current) {
                      runTimeRef.current?.runApp(code || '', prototype?.name || 'App name')
                    }
                    if (runTimeRef1.current) {
                      runTimeRef1.current?.runApp(code || '', prototype?.name || 'App name')
                    }
                }

                notifyWidgetIframes({
                  action: 'run-app',
                })

                const userId = currentUser?.id || 'Anonymous'
                addLog({
                  name: `User ${userId} run prototype`,
                  description: `User ${userId} run prototype ${prototype?.name || 'Unknown'} with id  ${prototype?.id || 'Unknown'}`,
                  type: 'run-prototype',
                  create_by: userId,
                })
                countCodeExecution(prototype.id)
              }}
              className="da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium"
            >
              <TbPlayerPlayFilled />
            </button>
            <button
              data-id="btn-stop-prototype"
              disabled={!isRunning}
              onClick={() => {
                setIsRunning(false)
                switch (prototype?.language) {
                  case 'rust':
                  default:
                    if (runTimeRef.current) {
                      runTimeRef.current?.stopApp()
                    }
                    if (runTimeRef1.current) {
                      runTimeRef1.current?.stopApp()
                    }
                    break
                }
                notifyWidgetIframes({
                  action: 'stop-app',
                })
              }}
              className={`${isExpand && 'mx-2'} da-label-regular-bold mt-1 flex items-center justify-center rounded border border-da-gray-medium p-2 hover:bg-da-gray-medium disabled:text-da-gray-medium`}
            >
              <TbPlayerStopFilled />
            </button>

            {prototype?.language == 'rust' && (
              <DaRemoteCompileRust
                ref={rustCompilerRef}
                onResponse={(log, isDone, status, appName) => {
                  appendLog(log)
                  if (isDone) {
                    if (status == 'compile-done' && appName) {
                      if (runTimeRef.current) {
                        runTimeRef.current?.runBinApp(appName)
                      }
                      if (runTimeRef1.current) {
                        runTimeRef1.current?.runBinApp(appName)
                      }
                    } else {
                      // setIsRunning(false)
                    }
                  }
                }}
              />
            )}
          </>
        )}
        <div className="grow"></div>
        {/* {isExpand && (
          <DaButton
            size="sm"
            variant="outline"
            className="ml-4 mt-1 !text-white hover:!text-da-gray-medium !border-da-white hover:!border-da-gray-medium"
            onClick={() => {
              setLog('')
              if (runTimeRef.current) {
                runTimeRef.current?.deploy()
              }
              if (runTimeRef1.current) {
                runTimeRef1.current?.deploy()
              }
            }}
          >
            Deploy
            <BiSend className="ml-1" size={20} />
          </DaButton>
        )} */}
        {/* { isExpand && <DaButton size='sm' variant="outline" className='mt-1 ml-2 !text-white hover:!text-da-gray-medium !border-da-white hover:!border-da-gray-medium'
          onClick={() => { setShowStaging(true) }}>
          Staging
        </DaButton>
        } */}

        {isExpand && (
          <DaButton
            size="sm"
            variant="plain"
            dataId='btn-clear-log'
            className="mt-1 ml-2 !text-white hover:!text-da-gray-medium !border-da-white hover:!border-da-gray-medium"
            onClick={() => {
              setLog('')
            }}
          >
            Clear log
          </DaButton>
        )}
      </div>

      <div className="mt-1 grow overflow-y-auto">
        {isExpand && (
          <>
            {activeTab == 'output' && (
              <>
                <div className="h-full flex flex-col">
                <div className="bg-gray-700 flex-shrink flex items-center">
                    {requestMode && (
                      <div className="flex items-center">
                        <DaInput
                          className="grow text-da-black w-[260px]"
                          value={requestContent}
                          onChange={(e) => {
                            setRequestContent(e.target.value)
                          }}
                        />
                        <div
                          className={`ml-2 mr-2 px-2 py-1 rounded ${requestContent.trim() ? 'text-yellow-500 font-semibold cursor-pointer hover:underline' : 'text-gray-400 font-thin'} `}
                          onClick={() => {
                            if (!requestContent.trim()) return
                            if (runTimeRef.current) {
                              runTimeRef.current?.requestInstallLib(
                                requestContent,
                              )
                            }
                            if (runTimeRef1.current) {
                              runTimeRef1.current?.requestInstallLib(
                                requestContent,
                              )
                            }
                            setRequestMode('')
                            setRequestContent('')
                          }}
                        >
                          Request Install
                        </div>
                        <div
                          className="px-2 py-1 rounded cursor-pointer hover:underline text-yellow-500 font-semibold"
                          onClick={() => {
                            setRequestMode('')
                            setRequestContent('')
                          }}
                        >
                          Cancel
                        </div>
                      </div>
                    )}
                    <div className="grow"></div>
                    {!requestMode && (
                      <div>
                        <DaMenu
                          trigger={
                            <div className="text-da-white text-sm cursor-pointer px-2 py-0.5 hover:underline">
                              Send Request
                            </div>
                          }
                        >
                          <div className="flex flex-col">
                            <DaButton
                              onClick={() => {
                                if (runTimeRef.current) {
                                  runTimeRef.current?.listPythonLibs()
                                }
                                if (runTimeRef1.current) {
                                  runTimeRef1.current?.listPythonLibs()
                                }
                              }}
                              variant="plain"
                              className="da-menu-item "
                            >
                              <div className="flex w-full items-center">
                                List All Python Libraries
                              </div>
                            </DaButton>

                            <DaButton
                              onClick={() => {
                                setRequestContent('libname')
                                setRequestMode('pip-install')
                              }}
                              variant="plain"
                              className="da-menu-item "
                            >
                              <div className="flex w-full items-center">
                                Install New Python Library: pip install libname
                              </div>
                            </DaButton>

                            <DaButton
                              onClick={async () => {
                                if(!model) return
                                const vssJson = await getComputedAPIs(model.id)
                                if (runTimeRef.current) {
                                  runTimeRef.current?.builldVehicleModel(vssJson)
                                }
                                if (runTimeRef1.current) {
                                  runTimeRef1.current?.builldVehicleModel(vssJson)
                                }
                              }}
                              variant="plain"
                              className="da-menu-item "
                            >
                              <div className="flex w-full items-center">
                                Rebuild Vehicle Model base on current Vehicle API
                              </div>
                            </DaButton>

                            <DaButton
                              onClick={() => {
                                if (runTimeRef.current) {
                                  runTimeRef.current?.revertToDefaultVehicleModel()
                                }
                                if (runTimeRef1.current) {
                                  runTimeRef1.current?.revertToDefaultVehicleModel()
                                }
                              }}
                              variant="plain"
                              className="da-menu-item "
                            >
                              <div className="flex w-full items-center">
                                Revert to default Vehicle Model
                              </div>
                            </DaButton>
                          </div>
                        </DaMenu>
                      </div>
                    )}
                  </div>
                  <p data-id="current-log" className="da-label-small flex-1 overflow-y-auto whitespace-pre-wrap rounded bg-da-black px-2 py-1 text-da-white">
                    {log}
                    <AlwaysScrollToBottom />
                  </p>
                  
                </div>
              </>
            )}

            {activeTab == 'apis' && (
              <DaApisWatch
                requestWriteSignalValue={(obj: any) => {
                  writeSignalValue(obj)
                }}
              />
            )}

            {activeTab == 'rt-usage' && <div className='h-full overflow-auto px-2 py-1 text-sm'>
              <div className='mt-2 mb-1 font-semibold'>Number of client listen to this runtime: {listenerOnRt.length}</div>
              <div className='max-h-[300px] overflow-auto'>
                {listenerOnRt.map((listener: any, idx: number) => <div className='py-0.5 flex italic items-center' key={idx}>
                  <GoDotFill size={10} className='mr-1' />
                  <div className='grow'>Number of listened APIs: {listener.apis.length}</div>
                  <div className='text-xs'>{getTimeSpandAsString(listener.from)}</div>
                </div>)}
              </div>

              <div className='mt-4 mb-1 font-semibold'>Number of Prototype running on this runtime: {runningAppsOnRt.length}</div>
              {runningAppsOnRt.map((app: any, idx: number) => <div className='py-0.5 flex italic items-center' key={idx}>
                <GoDotFill size={10} className='mr-1' />
                <div className='grow'>{app.appName}</div>
                <div className='text-xs'>{getTimeSpandAsString(app.from)}</div>
              </div>)}
            </div>}

            {activeTab == 'code' && (
              <CodeEditor
                code={code || ''}
                setCode={setCode}
                editable={isAuthorized}
                language="python"
                onBlur={() => { }}
              // onBlur={saveCodeToDb}
              />
            )}

            {activeTab == 'mock' && (
              <DaMockManager
                mockSignals={mockSignals}
                loadMockSignalsFromRt={() => {
                  if (runTimeRef.current) {
                    runTimeRef.current?.loadMockSignals()
                  }
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.loadMockSignals()
                  }
                }}
                sendMockSignalsToRt={(signals: any[]) => {
                  if (runTimeRef.current) {
                    runTimeRef.current?.setMockSignals(signals)
                  }
                  if (runTimeRef1.current) {
                    runTimeRef1.current?.setMockSignals(signals)
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      <div className="flex">
        <DaButton
          variant="plain"
          data-id="btn-expand-runtime-control"
          onClick={() => {
            setIsExpand((v) => !v)
          }}
          className="group"
        >
          {isExpand ? (
            <FaAnglesRight className="w-4 h-4 text-da-white group-hover:text-da-gray-dark" />
          ) : (
            <FaAnglesLeft className="w-4 h-4 text-da-white group-hover:text-da-gray-dark" />
          )}
        </DaButton>

        <div
          className="ml-4 w-10 h-full flex items-center justify-center cursor-pointer hover:bg-slate-400"
          onClick={() => {
            setIsAdvantageMode((v) => v + 1)
          }}
        ></div>

        {isExpand && (
          <>
            <div className="grow"></div>
            <div
              data-id="btn-runtime-control-tab-output"
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'output' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('output')
              }}
            >
              Terminal{' '}
            </div>
            <div
              data-id="btn-runtime-control-tab-apis"
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'apis' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('apis')
              }}
            >
              Signals Watch
            </div>
            <div
              data-id="btn-runtime-control-runtime-usage"
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'rt-usage' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('rt-usage')
              }}
            >
              Runtime Usage ({runningAppsOnRt.length}-{listenerOnRt.length})
            </div>

            {isAdvantageMode > 0 && (
              <div
                data-id="btn-runtime-control-tab-code"
                className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'mock' && 'border-b-2 border-da-white'}`}
                onClick={() => {
                  setActiveTab('mock')
                }}
              >
                Mock Services
              </div>
            )}
            {/* <div
              className={`da-label-small flex cursor-pointer items-center px-4 py-0.5 text-da-white hover:bg-da-gray-medium ${activeTab == 'code' && 'border-b-2 border-da-white'}`}
              onClick={() => {
                setActiveTab('code')
              }}
            >
              Code
            </div> */}
          </>
        )}
      </div>

      {/* { showStaging && <DaPopup state={[showStaging, setShowStaging]} trigger={<span></span>}>
          <DaStaging />
        </DaPopup>}  */}
    </div>
  )
}

export default DaRuntimeControl
