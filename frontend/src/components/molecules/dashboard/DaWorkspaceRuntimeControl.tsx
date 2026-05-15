// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Sidebar runtime panel: Coder workspace only (no hardware kit / DaRuntimeConnector).
 * Streams run output over WebSocket and renders terminal output/state.
 */

import { FC, useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/atoms/button'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import { MdStop } from 'react-icons/md'
import { cn } from '@/lib/utils'
import {
  TbPlayerPlayFilled,
  TbPlayerStopFilled,
  TbSettings,
} from 'react-icons/tb'
import { SlOptionsVertical } from 'react-icons/sl'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { useSiteConfig } from '@/utils/siteConfig'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { Input } from '@/components/atoms/input'
import DaDialog from '@/components/molecules/DaDialog'
import RuntimeAssetManager from '@/components/organisms/RuntimeAssetManager'
import DaRuntimeConnector from '../DaRuntimeConnector'
import DaRemoteCompileRust from '../remote-compiler/DaRemoteCompileRust'
import DaWorkspaceApisWatch from './DaWorkspaceApisWatch'
import WorkspacePrototypeVarsWatch from './WorkspacePrototypeVarsWatch'
import useWorkspaceRuntimeControl from '@/hooks/useWorkspaceRuntimeControl'

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (elementRef?.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return <div ref={elementRef} />
}

const DaWorkspaceRuntimeControl: FC = () => {
  const {
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
    handleRun: handleRunWorkspace,
    submitStdinLine,
    stopRun: stopRunWorkspace,
    requestWriteSignalValue,
    writeVarsValue,
  } = useWorkspaceRuntimeControl({
    onLegacyWrite: (obj) => runTimeRef.current?.writeSignalsValue(obj),
  })

  const [showRtDialog, setShowRtDialog] = useState<boolean>(false)
  const [showConfigDialog, setShowConfigDialog] = useState<boolean>(false)
  const [useRuntime, setUseRuntime] = useState<boolean>(true)
  const [customKitServer, setCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [tmpCustomKitServer, setTmpCustomKitServer] = useState<string>(
    localStorage.getItem('customKitServer') || '',
  )
  const [runtimeMenuOpen, setRuntimeMenuOpen] = useState(false)
  const [activeRtId, setActiveRtId] = useState<string | undefined>('')
  const [isRunning, setIsRunning] = useState(false)
  const [mockSignals, setMockSignals] = useState<any[]>([])
  const [curRuntimeInfo, setCurRuntimeInfo] = useState<any>(null)
  const [usedApis, setUsedApis] = useState<any[]>([])

  const runTimeRef = useRef<any>()
  const runTimeRef1 = useRef<any>()
  const rustCompilerRef = useRef<any>()

  const runtimeServerUrl = useSiteConfig('RUNTIME_SERVER_URL')
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

  const [activeModelApis] = useModelStore(
    (state) => [state.activeModelApis],
    shallow,
  )

  useEffect(() => {
    if (!prototype?.code || !activeModelApis || activeModelApis.length === 0) {
      setUsedApis([])
      return
    }
    const code = prototype.code || ''
    const dashboardCfg = prototype?.widget_config || ''
    const apis: any[] = []
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
  }, [prototype?.code, activeModelApis, prototype?.widget_config])

  const appendLog = (content: string) => {
    if (!content) return
    appendRuntimeText(content)
  }

  const handleRunRt = () => {
    setIsRunning(true)
    setActiveTab('output')
    clearOutput()

    const code = prototype?.code || ''
    switch (prototype?.language) {
      case 'rust':
        if (rustCompilerRef.current) {
          rustCompilerRef.current?.requestCompile(code)
        }
        break
      default:
        if (runTimeRef.current) {
          runTimeRef.current?.runApp(code, prototype?.name || 'App name')
        }
        if (runTimeRef1.current) {
          runTimeRef1.current?.runApp(code, prototype?.name || 'App name')
        }
    }
  }

  const handleStopRt = () => {
    setIsRunning(false)
    if (runTimeRef.current) {
      runTimeRef.current?.stopApp()
    }
    if (runTimeRef1.current) {
      runTimeRef1.current?.stopApp()
    }
  }

  const handleClearLog = () => {
    clearOutput()
  }

  return (
    <div
      data-id="workspace-runtime-control-panel"
      className={cn(
        'bottom-0 right-0 z-10 flex flex-col px-1 py-1',
        showPrototypeDashboardFullScreen
          ? 'fixed top-[58px]'
          : 'absolute top-0',
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
                const newServer = tmpCustomKitServer.trim()
                localStorage.setItem('customKitServer', newServer)
                setCustomKitServer(newServer)
                setShowConfigDialog(false)
                setUseRuntime(false)
                setTimeout(() => {
                  setUseRuntime(true)
                }, 100)
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
            ) : (
              <DaRuntimeConnector
                targetPrefix="runtime-"
                kitServerUrl={runtimeServerUrl}
                socketIoConfig={runtimeServerConfig}
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
        <DropdownMenu open={runtimeMenuOpen} onOpenChange={setRuntimeMenuOpen}>
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
                setRuntimeMenuOpen(false)
                setTmpCustomKitServer(customKitServer)
                setShowConfigDialog(true)
              }}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <TbSettings className="w-5 h-5" />
                <span>Config Runtime Server</span>
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
              onClick={handleRunRt}
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
              onClick={handleStopRt}
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

      <div className={cn('mt-1 grow overflow-y-auto', !isExpand && 'hidden')}>
        {isExpand && (
          <>
            {activeTab === 'output' && (
              <div className="h-full flex flex-col">
                <div
                  data-id="current-log"
                  className="flex-1 overflow-y-auto whitespace-pre-wrap rounded bg-black px-2 py-1 text-xs"
                  style={{
                    backgroundColor: 'hsl(0, 0%, 0%)',
                    color: 'hsl(0, 0%, 100%)',
                  }}
                >
                  {outputPanelText}
                  <AlwaysScrollToBottom />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={stdinLine}
                    placeholder="Send stdin line..."
                    className="w-full rounded border border-slate-500 bg-slate-100 px-2 py-1 text-slate-900 text-sm placeholder:text-slate-500"
                    onChange={(e) => setStdinLine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitStdinLine()
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={submitStdinLine}
                    disabled={!canSendStdin}
                    className="border border-sky-400 bg-sky-600 text-white hover:bg-sky-500"
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'apis' && (
              <DaWorkspaceApisWatch
                requestWriteSignalValue={(obj: Record<string, unknown>) => {
                  requestWriteSignalValue(obj)
                }}
              />
            )}

            {activeTab === 'vars' && (
              <WorkspacePrototypeVarsWatch
                requestWriteVarValue={(obj: Record<string, unknown>) => {
                  writeVarsValue(obj)
                }}
              />
            )}
          </>
        )}
      </div>

      <div className="mt-auto flex w-full flex-col">
        <div
          className={cn(
            'flex flex-col items-stretch gap-1 px-1 pb-2',
            isExpand && 'flex-row items-center justify-start gap-2',
          )}
        >
          <button
            type="button"
            data-id="btn-run-prototype-sidebar-lower"
            disabled={!canRun}
            onClick={handleRunWorkspace}
            className="flex items-center justify-center rounded border p-2 font-semibold text-sm"
            title={runDisabledReason}
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
            <TbPlayerPlayFilled className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-id="btn-stop-prototype-sidebar-lower"
            disabled={!canStop}
            onClick={stopRunWorkspace}
            className="flex items-center justify-center rounded border p-2 font-semibold text-sm"
            style={{
              color: canStop ? 'hsl(0, 0%, 100%)' : 'hsl(215, 16%, 47%)',
              borderColor: 'hsl(0, 84%, 60%)',
              backgroundColor: canStop ? 'hsl(0, 72%, 40%)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (canStop) {
                e.currentTarget.style.backgroundColor = 'hsl(0, 72%, 35%)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = canStop
                ? 'hsl(0, 72%, 40%)'
                : 'transparent'
            }}
            title={canStop ? 'Stop running process' : 'No active run to stop'}
          >
            <TbPlayerStopFilled className="h-4 w-4" />
          </button>
          {isExpand && (
            <div className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100">
              {statusLabel}
              {!canRun && runDisabledReason ? ` - ${runDisabledReason}` : ''}
            </div>
          )}
        </div>

        <div className="flex">
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
              <Button
                size="sm"
                variant="ghost"
                data-id="btn-clear-log"
                className="text-xs px-2"
                style={{ color: 'hsl(0, 0%, 100%)' }}
                onClick={clearOutput}
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DaWorkspaceRuntimeControl
