// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import { SlOptionsVertical } from 'react-icons/sl'
import { cn } from '@/lib/utils'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { addLog } from '@/services/log.service'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import useCurrentModel from '@/hooks/useCurrentModel'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import DaRuntimeConnector from '../DaRuntimeConnector'
import { useSiteConfig } from '@/utils/siteConfig'
import DaApisWatch from './DaApisWatch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { getComputedAPIs } from '@/services/model.service'
import RuntimeAssetManager from '@/components/organisms/RuntimeAssetManager'
import DaDialog from '@/components/molecules/DaDialog'
import { countCodeExecution } from '@/services/prototype.service'
import { GoDotFill } from 'react-icons/go'
import DaMockManager from './DaMockManager'
import PrototypeVarsWatch from './PrototypeVarsWatch'
import DaRemoteCompileRust from '../remote-compiler/DaRemoteCompileRust'

const DEFAULT_KIT_SERVER = 'https://kit.digitalauto.tech'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (elementRef?.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return <div ref={elementRef} />
}

const DaRuntimeControl: FC = () => {
  const { data: currentUser } = useSelfProfileQuery()
  const [prototype, activeModelApis] = useModelStore(
    (state) => [state.prototype as Prototype, state.activeModelApis],
    shallow,
  )
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const runtimeServerUrl = useSiteConfig(
    'RUNTIME_SERVER_URL',
    DEFAULT_KIT_SERVER,
  )

  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()
  const runTimeRef1 = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const [customKitServer, setCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [tmpCustomKitServer, setTmpCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [showConfigDialog, setShowConfigDialog] = useState<boolean>(false)
  const [useRuntime, setUseRuntime] = useState<boolean>(true)
  const [mockSignals, setMockSignals] = useState<any[]>([])
  const [curRuntimeInfo, setCurRuntimeInfo] = useState<any>(null)
  const [code, setCode] = useState<string>('')
  const [usedApis, setUsedApis] = useState<any[]>([])
  const [requestContent, setRequestContent] = useState<string>('')
  const [requestMode, setRequestMode] = useState<string>('')
  const [showRtDialog, setShowRtDialog] = useState<boolean>(false)
  const [runningAppsOnRt, setRunningAppsOnRt] = useState<any[]>([])
  const [listenerOnRt, setListenerOnRt] = useState<any[]>([])
  const [isAdvantageMode, setIsAdvantageMode] = useState<number>(-5)
  const rustCompilerRef = useRef<any>()

  useEffect(() => {
    localStorage.setItem('customKitServer', customKitServer.trim())
  }, [customKitServer])

  useEffect(() => {
    setCurRuntimeInfo(null)
    setListenerOnRt([])
    setRunningAppsOnRt([])
  }, [activeRtId])

  useEffect(() => {
    if (!curRuntimeInfo) {
      setRunningAppsOnRt([])
      setListenerOnRt([])
    }
    if (curRuntimeInfo && curRuntimeInfo.lsOfRunner) {
      setRunningAppsOnRt(curRuntimeInfo.lsOfRunner || [])
    }
    if (curRuntimeInfo && curRuntimeInfo.lsOfApiSubscriber) {
      let lsOfListener = []
      for (let [key, value] of Object.entries(
        curRuntimeInfo.lsOfApiSubscriber,
      )) {
        lsOfListener.push(value)
      }
      setListenerOnRt(lsOfListener)
    }
  }, [curRuntimeInfo])

  useEffect(() => {
    if (prototype) {
      setCode(prototype.code || '')
      setLog('')
    } else {
      setCode('')
    }
  }, [prototype?.code, prototype?.id])

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
    setUsedApis(apis)
  }, [code, activeModelApis, prototype?.widget_config])

  const handleRun = () => {
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
    if (prototype) {
      addLog({
        name: `User ${userId} run prototype`,
        description: `User ${userId} run prototype ${prototype?.name || 'Unknown'} with id ${prototype?.id || 'Unknown'}`,
        type: 'run-prototype',
        create_by: userId,
      })
      countCodeExecution(prototype.id)
    }
  }

  const handleStop = () => {
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
  }

  const appendLog = (content: string) => {
    if (!content) return
    setLog((prevLog) => prevLog + content)
  }

  const handleClearLog = () => {
    setLog('')
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

  const writeVarsValue = (obj: any) => {
    if (!obj) return
    if (runTimeRef.current) {
      runTimeRef.current?.writeVarsValue(obj)
    }
    if (runTimeRef1.current) {
      runTimeRef1.current?.writeVarsValue(obj)
    }
  }

  const notifyWidgetIframes = (data: any) => {
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage(JSON.stringify(data), '*')
    })
  }

  const handleMessageListener = (e: any) => {
    if (!e.data) return
    try {
      let payload = JSON.parse(e.data)
      if (payload.cmd === 'set-api-value' && payload.api) {
        let obj = {} as any
        obj[`${payload.api}`] = payload.value
        writeSignalValue(obj)
        writeVarsValue(obj)
      }
    } catch (err) {
      // Silent fail for invalid JSON
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessageListener)
    return () => {
      window.removeEventListener('message', handleMessageListener)
    }
  }, [])

  const getTimeSpanAsString = (from: number) => {
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
        'absolute bottom-0 right-0 top-0 z-10 flex flex-col px-1 py-1',
        isExpand ? 'w-[500px]' : 'w-14',
      )}
      style={{
        backgroundColor: 'hsl(217, 33%, 17%)',
        color: 'hsl(214, 32%, 91%)',
      }}
    >
      <DaDialog
        open={showRtDialog}
        onOpenChange={setShowRtDialog}
        trigger={<span></span>}
        className="w-[800px] max-w-[90vw]"
        showCloseButton={false}
      >
        <RuntimeAssetManager
          onClose={() => {
            setShowRtDialog(false)
            setUseRuntime(false)
            setTimeout(() => {
              setUseRuntime(true)
            }, 500)
          }}
          onCancel={() => {
            setShowRtDialog(false)
          }}
        />
      </DaDialog>

      {/* Runtime Server Config Dialog */}
      <DaDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        trigger={<span></span>}
        className="w-[600px] max-w-[90vw]"
        showCloseButton={false}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Configure Runtime Server
          </h3>
          <div className="mb-4 text-sm text-gray-600">
            Runtime server URL: leave empty to use default server
          </div>
          <Input
            className="w-full mb-4 text-primary"
            value={tmpCustomKitServer}
            onChange={(e) => {
              setTmpCustomKitServer(e.target.value)
            }}
            placeholder="Custom server URL"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTmpCustomKitServer(customKitServer)
                setShowConfigDialog(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCustomKitServer(tmpCustomKitServer)
                setShowConfigDialog(false)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DaDialog>

      {/* Runtime Controls Header */}
      <div className={cn('px-1 flex items-center', !isExpand && 'hidden')}>
        {useRuntime && (
          <>
            <label
              className="w-fit mr-2 text-sm font-light flex items-center"
              style={{ color: 'hsl(0, 0%, 100%)' }}
            >
              Runtime:
            </label>
            {customKitServer && customKitServer.trim().length > 0 ? (
              <DaRuntimeConnector
                targetPrefix="runtime-"
                kitServerUrl={customKitServer}
                ref={runTimeRef}
                usedAPIs={usedApis}
                hideLabel={true}
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
                kitServerUrl={runtimeServerUrl}
                ref={runTimeRef1}
                usedAPIs={usedApis}
                hideLabel={true}
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
          </>
        )}
        <div className="pl-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-yellow-400! hover:text-yellow-300! hover:bg-slate-700"
            data-id="btn-add-runtime"
            onClick={() => {
              setShowRtDialog(true)
            }}
          >
            Add Runtime
          </Button>
        </div>
        <div className="grow" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="cursor-pointer hover:bg-slate-500 p-2 rounded"
              style={{ color: 'hsl(0, 0%, 100%)' }}
            >
              <SlOptionsVertical size={20} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setTmpCustomKitServer(customKitServer)
                setShowConfigDialog(true)
              }}
            >
              <div className="flex w-full items-center">
                Config Runtime Server
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Play/Stop Controls */}
      <div className={cn('flex px-1', !isExpand && 'flex-col')}>
        {activeRtId && (
          <>
            <button
              data-id="btn-run-prototype"
              disabled={isRunning}
              onClick={handleRun}
              className="mt-1 flex items-center justify-center rounded border p-2 font-semibold text-sm"
              style={{
                color: isRunning ? 'hsl(215, 16%, 47%)' : 'hsl(0, 0%, 100%)',
                borderColor: 'hsl(215, 16%, 47%)',
              }}
              onMouseEnter={(e) => {
                if (!isRunning) {
                  e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <TbPlayerPlayFilled className="w-4 h-4" />
            </button>
            <button
              data-id="btn-stop-prototype"
              disabled={!isRunning}
              onClick={handleStop}
              className={cn(
                'mt-1 flex items-center justify-center rounded border p-2 font-semibold text-sm',
                isExpand && 'mx-2',
              )}
              style={{
                color: !isRunning ? 'hsl(215, 16%, 47%)' : 'hsl(0, 0%, 100%)',
                borderColor: 'hsl(215, 16%, 47%)',
              }}
              onMouseEnter={(e) => {
                if (isRunning) {
                  e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <TbPlayerStopFilled className="w-4 h-4" />
            </button>

            {prototype?.language === 'rust' && (
              <DaRemoteCompileRust
                ref={rustCompilerRef}
                onResponse={(log, isDone, status, appName) => {
                  appendLog(log)
                  if (isDone) {
                    if (status === 'compile-done' && appName) {
                      if (runTimeRef.current) {
                        runTimeRef.current?.runBinApp(appName)
                      }
                      if (runTimeRef1.current) {
                        runTimeRef1.current?.runBinApp(appName)
                      }
                    }
                  }
                }}
              />
            )}
          </>
        )}
        {isExpand && (
          <>
            <div className="grow" />
            <Button
              size="sm"
              variant="ghost"
              data-id="btn-clear-log"
              className="mt-1 ml-2"
              style={{ color: 'hsl(0, 0%, 100%)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(215, 16%, 47%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(0, 0%, 100%)'
              }}
              onClick={handleClearLog}
            >
              Clear log
            </Button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className={cn('mt-1 grow overflow-y-auto', !isExpand && 'hidden')}>
        {isExpand && (
          <>
            {activeTab === 'output' && (
              <div className="h-full flex flex-col">
                <div
                  className="shrink flex items-center"
                  style={{ backgroundColor: 'hsl(217, 13%, 32%)' }}
                >
                  {requestMode && (
                    <div className="flex items-center">
                      <Input
                        className="grow text-xs w-[260px]"
                        style={{ color: 'hsl(0, 0%, 0%)' }}
                        value={requestContent}
                        onChange={(e) => {
                          setRequestContent(e.target.value)
                        }}
                      />
                      <div
                        className={`ml-2 mr-2 px-2 py-1 rounded text-xs ${
                          requestContent.trim()
                            ? 'text-yellow-400 font-semibold cursor-pointer hover:underline'
                            : 'text-gray-400 font-thin'
                        }`}
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
                        className="px-2 py-1 rounded cursor-pointer hover:underline text-yellow-400 font-semibold text-xs"
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            className="text-sm cursor-pointer px-2 py-0.5 hover:underline"
                            style={{ color: 'hsl(0, 0%, 100%)' }}
                          >
                            Send Request
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              if (runTimeRef.current) {
                                runTimeRef.current?.listPythonLibs()
                              }
                              if (runTimeRef1.current) {
                                runTimeRef1.current?.listPythonLibs()
                              }
                            }}
                          >
                            <div className="flex w-full items-center">
                              List All Python Libraries
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setRequestContent('libname')
                              setRequestMode('pip-install')
                            }}
                          >
                            <div className="flex w-full items-center">
                              Install New Python Library: pip install libname
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={async () => {
                              if (!model) return
                              const vssJson = await getComputedAPIs(model.id)
                              if (runTimeRef.current) {
                                runTimeRef.current?.builldVehicleModel(vssJson)
                              }
                              if (runTimeRef1.current) {
                                runTimeRef1.current?.builldVehicleModel(vssJson)
                              }
                            }}
                          >
                            <div className="flex w-full items-center">
                              Rebuild Vehicle Model base on current Vehicle API
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              if (runTimeRef.current) {
                                runTimeRef.current?.revertToDefaultVehicleModel()
                              }
                              if (runTimeRef1.current) {
                                runTimeRef1.current?.revertToDefaultVehicleModel()
                              }
                            }}
                          >
                            <div className="flex w-full items-center">
                              Revert to default Vehicle Model
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                <div
                  data-id="current-log"
                  className="flex-1 overflow-y-auto whitespace-pre-wrap rounded bg-black px-2 py-1 text-xs"
                  style={{
                    backgroundColor: 'hsl(0, 0%, 0%)',
                    color: 'hsl(0, 0%, 100%)',
                  }}
                >
                  {log || 'No output yet. Click Run to start the prototype.'}
                  <AlwaysScrollToBottom />
                </div>
              </div>
            )}

            {activeTab === 'apis' && (
              <DaApisWatch
                requestWriteSignalValue={(obj: any) => {
                  writeSignalValue(obj)
                }}
              />
            )}

            {activeTab === 'vars' && (
              <PrototypeVarsWatch
                requestWriteVarValue={(obj: any) => {
                  writeVarsValue(obj)
                }}
              />
            )}

            {activeTab === 'rt-usage' && (
              <div className="h-full overflow-auto px-2 py-1 text-sm">
                <div className="mt-2 mb-1 font-semibold">
                  Number of client listen to this runtime: {listenerOnRt.length}
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {listenerOnRt.map((listener: any, idx: number) => (
                    <div className="py-0.5 flex italic items-center" key={idx}>
                      <GoDotFill size={10} className="mr-1" />
                      <div className="grow">
                        Number of listened APIs: {listener.apis?.length || 0}
                      </div>
                      <div className="text-xs">
                        {getTimeSpanAsString(listener.from)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 mb-1 font-semibold">
                  Number of Prototype running on this runtime:{' '}
                  {runningAppsOnRt.length}
                </div>
                {runningAppsOnRt.map((app: any, idx: number) => (
                  <div className="py-0.5 flex italic items-center" key={idx}>
                    <GoDotFill size={10} className="mr-1" />
                    <div className="grow">{app.appName}</div>
                    <div className="text-xs">
                      {getTimeSpanAsString(app.from)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mock' && (
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

      <div className="flex mt-auto">
        <Button
          variant="ghost"
          data-id="btn-expand-runtime-control"
          onClick={() => {
            setIsExpand((v) => !v)
          }}
          className="group hover:bg-slate-700"
          size="sm"
        >
          {isExpand ? (
            <FaAnglesRight
              className="w-4 h-4"
              style={{ color: 'hsl(0, 0%, 100%)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(215, 25%, 27%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(0, 0%, 100%)'
              }}
            />
          ) : (
            <FaAnglesLeft
              className="w-4 h-4"
              style={{ color: 'hsl(0, 0%, 100%)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(215, 25%, 27%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(0, 0%, 100%)'
              }}
            />
          )}
        </Button>

        <div
          className="ml-4 w-10 h-full flex items-center justify-center cursor-pointer hover:bg-slate-400"
          onClick={() => {
            setIsAdvantageMode((v) => v + 1)
          }}
        />

        {isExpand && (
          <>
            <div className="grow" />
            <div
              data-id="btn-runtime-control-tab-output"
              className={cn(
                'text-xs flex cursor-pointer items-center px-4 py-0.5',
                activeTab === 'output' && 'border-b-2',
              )}
              style={{
                color: 'hsl(0, 0%, 100%)',
                borderBottomColor:
                  activeTab === 'output' ? 'hsl(0, 0%, 100%)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={() => {
                setActiveTab('output')
              }}
            >
              Terminal
            </div>
            {prototype?.language === 'cpp' && (
              <div
                data-id="btn-runtime-control-tab-vars"
                className={cn(
                  'text-xs flex cursor-pointer items-center px-4 py-0.5',
                  activeTab === 'vars' && 'border-b-2',
                )}
                style={{
                  color: 'hsl(0, 0%, 100%)',
                  borderBottomColor:
                    activeTab === 'vars' ? 'hsl(0, 0%, 100%)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={() => {
                  setActiveTab('vars')
                }}
              >
                Vars Watch
              </div>
            )}
            <div
              data-id="btn-runtime-control-tab-apis"
              className={cn(
                'text-xs flex cursor-pointer items-center px-4 py-0.5',
                activeTab === 'apis' && 'border-b-2',
              )}
              style={{
                color: 'hsl(0, 0%, 100%)',
                borderBottomColor:
                  activeTab === 'apis' ? 'hsl(0, 0%, 100%)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={() => {
                setActiveTab('apis')
              }}
            >
              Signals Watch
            </div>
            {/* Commented out for now - enable when needed
            <div
              data-id="btn-runtime-control-runtime-usage"
              className={cn(
                'text-xs flex cursor-pointer items-center px-4 py-0.5',
                activeTab === 'rt-usage' && 'border-b-2',
              )}
              style={{
                color: 'hsl(0, 0%, 100%)',
                borderBottomColor: activeTab === 'rt-usage' ? 'hsl(0, 0%, 100%)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={() => {
                setActiveTab('rt-usage')
              }}
            >
              Runtime Usage ({runningAppsOnRt.length}-{listenerOnRt.length})
            </div>
            */}
            {isAdvantageMode > 0 && (
              <div
                data-id="btn-runtime-control-tab-mock"
                className={cn(
                  'text-xs flex cursor-pointer items-center px-4 py-0.5',
                  activeTab === 'mock' && 'border-b-2',
                )}
                style={{
                  color: 'hsl(0, 0%, 100%)',
                  borderBottomColor:
                    activeTab === 'mock' ? 'hsl(0, 0%, 100%)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsl(215, 16%, 47%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={() => {
                  setActiveTab('mock')
                }}
              >
                Mock Services
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DaRuntimeControl
