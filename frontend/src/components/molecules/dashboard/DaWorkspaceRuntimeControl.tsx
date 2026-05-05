// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Sidebar runtime panel: Coder workspace only (no hardware kit / DaRuntimeConnector).
 * Streams run output over WebSocket and merges NDJSON into workspaceRuntimeStore.
 */

import { FC, useEffect, useRef } from 'react'
import { Button } from '@/components/atoms/button'
import { TbPlayerPlayFilled } from 'react-icons/tb'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'
import { MdStop } from 'react-icons/md'
import { cn } from '@/lib/utils'
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
    handleRun,
    submitStdinLine,
    stopRun,
    writeSignalValue,
    writeVarsValue,
  } = useWorkspaceRuntimeControl()

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
                  writeSignalValue(obj)
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
            onClick={handleRun}
            className="flex items-center justify-center rounded border p-2 font-semibold text-sm"
            title={runDisabledReason}
            style={{
              color: canRun
                ? 'hsl(0, 0%, 100%)'
                : 'hsl(215, 16%, 47%)',
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
            onClick={stopRun}
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
            <MdStop className="h-4 w-4" />
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
                    activeTab === 'output'
                      ? 'hsl(0, 0%, 100%)'
                      : 'transparent',
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
                      activeTab === 'vars'
                        ? 'hsl(0, 0%, 100%)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'hsl(215, 16%, 47%)'
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
                    activeTab === 'apis'
                      ? 'hsl(0, 0%, 100%)'
                      : 'transparent',
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
