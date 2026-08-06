// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
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
import { useSystemUI } from '@/hooks/useSystemUI'
import { useUsedVehicleApis } from '@/hooks/useUsedVehicleApis'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (elementRef?.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return <div ref={elementRef} />
}

interface DaRuntimeControlProps {
  className?: string
}

const DaRuntimeControl: FC<DaRuntimeControlProps> = ({ className }) => {
  const { data: currentUser } = useSelfProfileQuery()
  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])
  const runtimeServerUrl = useSiteConfig(
    'RUNTIME_SERVER_URL',
  )
  const runtimeServerConfigRaw = useSiteConfig('RUNTIME_SERVER_CONFIG', '')
  const runtimeServerConfig = useMemo(() => {
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
  const { showPrototypeDashboardFullScreen } = useSystemUI()

  const [isExpand, setIsExpand] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [log, setLog] = useState<string>('')
  const runTimeRef = useRef<any>()

  const [activeTab, setActiveTab] = useState<string>('output')
  const [useRuntime, setUseRuntime] = useState<boolean>(true)
  const [mockSignals, setMockSignals] = useState<any[]>([])
  const [curRuntimeInfo, setCurRuntimeInfo] = useState<any>(null)
  const [code, setCode] = useState<string>('')
  const usedApiObjects = useUsedVehicleApis(code)
  const usedApis = useMemo(
    () => usedApiObjects.map((api) => api.name),
    [usedApiObjects],
  )
  const [requestContent, setRequestContent] = useState<string>('')
  const [requestMode, setRequestMode] = useState<string>('')
  const [showRtDialog, setShowRtDialog] = useState<boolean>(false)
  const [runningAppsOnRt, setRunningAppsOnRt] = useState<any[]>([])
  const [listenerOnRt, setListenerOnRt] = useState<any[]>([])
  const [isAdvantageMode, setIsAdvantageMode] = useState<number>(-5)
  const rustCompilerRef = useRef<any>()
  

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
        runTimeRef.current?.runApp(code || '', prototype?.name || 'App name')
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
        runTimeRef.current?.stopApp()
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
    runTimeRef.current?.writeSignalsValue(obj)
  }

  const writeVarsValue = (obj: any) => {
    if (!obj) return
    runTimeRef.current?.writeVarsValue(obj)
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

  const runtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const scheduleRuntimeReconnect = useCallback((delayMs = 500) => {
    setUseRuntime(false)
    if (runtimeRefreshTimeoutRef.current) {
      clearTimeout(runtimeRefreshTimeoutRef.current)
    }
    runtimeRefreshTimeoutRef.current = setTimeout(() => {
      setUseRuntime(true)
      runtimeRefreshTimeoutRef.current = undefined
    }, delayMs)
  }, [])

  useEffect(() => {
    return () => {
      if (runtimeRefreshTimeoutRef.current) {
        clearTimeout(runtimeRefreshTimeoutRef.current)
      }
    }
  }, [])

  const refreshRuntimeConnector = useCallback(
    () => scheduleRuntimeReconnect(500),
    [scheduleRuntimeReconnect],
  )

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

  const hasRuntimeSelected = Boolean(activeRtId)
  const canRun = hasRuntimeSelected && !isRunning

  return (
    <div
      data-id="runtime-control-panel"
      className={cn(
        'right-0 z-10 flex flex-col px-1 py-1',
        showPrototypeDashboardFullScreen
          ? 'fixed top-[58px] bottom-[22.55px]'
          : 'absolute top-0 bottom-0',
        isExpand ? 'w-[500px]' : 'w-14',
        className,
      )}
      style={{
        backgroundColor: 'hsl(217, 33%, 17%)',
        color: 'hsl(214, 32%, 91%)',
      }}
    >
      <DaDialog
        open={showRtDialog}
        onOpenChange={setShowRtDialog}
        onClose={refreshRuntimeConnector}
        trigger={<span></span>}
        className="w-[800px] max-w-[90vw]"
        showCloseButton={false}
        contentContainerClassName="p-0"
      >
        <RuntimeAssetManager
          open={showRtDialog}
          onClose={() => setShowRtDialog(false)}
        />
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
            <DaRuntimeConnector
              targetPrefix="runtime-"
              kitServerUrl={runtimeServerUrl}
              socketIoConfig={runtimeServerConfig}
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
      </div>

      {/* Play/Stop Controls */}
      <div className={cn('flex px-1', !isExpand && 'flex-col')}>
        <>
          <button
            data-id="btn-run-prototype"
            disabled={!canRun}
            title={!hasRuntimeSelected ? 'Select a runtime to run' : undefined}
            onClick={handleRun}
            className="mt-1 flex items-center justify-center rounded border p-2 font-semibold text-sm"
            style={{
              color: canRun ? 'hsl(0, 0%, 100%)' : 'hsl(215, 16%, 47%)',
              borderColor: 'hsl(215, 16%, 47%)',
            }}
            onMouseEnter={(e) => {
              if (canRun) {
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
            disabled={!isRunning || !activeRtId}
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
              if (isRunning && hasRuntimeSelected) {
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
                    runTimeRef.current?.runBinApp(appName)
                  }
                }
              }}
            />
          )}
        </>
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
                        className={`ml-2 mr-2 px-2 py-1 rounded text-xs ${requestContent.trim()
                          ? 'text-yellow-400 font-semibold cursor-pointer hover:underline'
                          : 'text-gray-400 font-thin'
                          }`}
                        onClick={() => {
                          if (!requestContent.trim()) return
                          runTimeRef.current?.requestInstallLib(requestContent)
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
                              runTimeRef.current?.listPythonLibs()
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
                              runTimeRef.current?.builldVehicleModel(vssJson)
                            }}
                          >
                            <div className="flex w-full items-center">
                              Rebuild Vehicle Model base on current Vehicle API
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              runTimeRef.current?.revertToDefaultVehicleModel()
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
                usedAPIs={usedApis}
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
                  runTimeRef.current?.loadMockSignals()
                }}
                sendMockSignalsToRt={(signals: any[]) => {
                  runTimeRef.current?.setMockSignals(signals)
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
