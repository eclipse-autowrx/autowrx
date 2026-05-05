// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT
//
// SPDX-License-Identifier: MIT

import { FC, Suspense, lazy } from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'
import CoderWorkspaceStatus from '@/components/molecules/CoderWorkspaceStatus'
import usePrototypeTabVSCodeViewModel from '@/hooks/usePrototypeTabVSCodeViewModel'

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)

interface PrototypeTabVSCodeProps {
  isActive?: boolean
}

const PrototypeTabVSCode: FC<PrototypeTabVSCodeProps> = ({ isActive = false }) => {
  const {
    containerRef,
    resizeRef,
    isResizing,
    handleMouseDown,
    isApiPanelCollapsed,
    setIsApiPanelCollapsed,
    rightPanelWidthStyle,
    prototypeCode,

    prepareError,
    watchEvents,
    logEvents,

    shouldMountIframe,
    showIframe,
    workspaceAppUrl,
    handleIframeLoad,
    handleIframeError,
  } = usePrototypeTabVSCodeViewModel(isActive)

  return (
    <div
      ref={containerRef}
      className="relative flex h-[calc(100%-0px)] w-full min-h-0 flex-1 p-2 bg-gray-100"
    >
      {/* Iframe steals pointer events; cover the splitter while dragging so resize keeps working */}
      {isResizing && (
        <div
          className="absolute inset-0 z-[200] cursor-col-resize"
          style={{ touchAction: 'none' }}
          aria-hidden
        />
      )}

      <div
        className={
          showIframe
            ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r bg-white rounded-md'
            : 'flex h-full min-h-0 min-w-0 flex-1 flex-col border-r bg-white rounded-md'
        }
      >
        {shouldMountIframe && (
          <div
            className={
              showIframe
                ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'absolute inset-0 opacity-0 pointer-events-none'
            }
            aria-hidden={!showIframe}
          >
            <iframe
              src={workspaceAppUrl!}
              title="Coder Workspace"
              className="min-h-0 flex-1 border-0"
              allow="clipboard-read; clipboard-write"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        )}

        {!showIframe && (
          <CoderWorkspaceStatus
            prepareError={prepareError}
            watchEvents={watchEvents}
            logEvents={logEvents}
            className="min-h-0 flex-1 overflow-y-auto"
          />
        )}
      </div>

      {!isApiPanelCollapsed && (
        // Match PrototypeTabCode: invisible track; thin grip only on hover / while dragging
        <div
          ref={resizeRef}
          className="mx-0.5 w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-blue-500 hover:bg-opacity-50"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={`h-8 w-0.5 bg-gray-400 transition-opacity ${
                isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'
              }`}
            />
          </div>
        </div>
      )}

      <div
        className="flex h-full min-h-0 shrink-0 flex-col rounded-md bg-white transition-all duration-200 ease-in-out"
        style={{ width: rightPanelWidthStyle }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          }
        >
          <PrototypeTabCodeApiPanel
            code={prototypeCode}
            onCollapsedChange={setIsApiPanelCollapsed}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default PrototypeTabVSCode

