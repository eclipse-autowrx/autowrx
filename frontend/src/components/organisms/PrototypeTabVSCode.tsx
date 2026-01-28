// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  FC,
  useEffect,
  useState,
  lazy,
  Suspense,
  useRef,
  useCallback,
} from 'react'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'
import { getWorkspaceUrl, prepareWorkspace, getWorkspaceStatus, WorkspaceInfo, WorkspaceStatus } from '@/services/coder.service'
import CoderWorkspaceStatus from '@/components/molecules/CoderWorkspaceStatus'
import { useParams } from 'react-router-dom'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)

const PrototypeTabVSCode: FC = () => {
  const { prototype_id } = useParams<{ prototype_id: string }>()
  const [prototype] = useModelStore(
    (state) => [state.prototype as Prototype],
    shallow,
  )
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  // Coder workspace state
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null)
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)
  const workspacePollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState(600) // Initial width in px
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Load Coder workspace
  useEffect(() => {
    if (!prototype_id) {
      setIsLoadingWorkspace(false)
      setWorkspaceError('Prototype ID is required')
      return
    }

    if (!isAuthorized) {
      setIsLoadingWorkspace(false)
      setWorkspaceError('You do not have permission to access this workspace')
      return
    }

    const loadWorkspace = async () => {
      try {
        setIsLoadingWorkspace(true)
        setWorkspaceError(null)
        
        // First, check workspace status
        try {
          const status = await getWorkspaceStatus(prototype_id)
          setWorkspaceStatus(status)
          
          if (status.exists && status.status === 'running') {
            // Workspace is running, get the URL
            try {
              const info = await getWorkspaceUrl(prototype_id)
              setWorkspaceInfo(info)
              setIsLoadingWorkspace(false)
            } catch (urlError: any) {
              // Don't set error, just keep polling - the workspace might still be starting up
              startWorkspacePolling(prototype_id)
            }
          } else if (status.exists) {
            // Workspace exists but not running - poll until it's ready
            startWorkspacePolling(prototype_id)
          } else {
            // Workspace doesn't exist, create it
            try {
              await prepareWorkspace(prototype_id)
              // Start polling immediately after prepare
              startWorkspacePolling(prototype_id)
            } catch (prepareError: any) {
              // Only set error if it's a real error, not a 409 (already creating)
              if (prepareError.response?.status !== 409) {
                console.error('[PrototypeTabVSCode] Failed to prepare workspace:', prepareError)
                setWorkspaceError(prepareError.message || 'Failed to prepare workspace')
                setIsLoadingWorkspace(false)
              } else {
                // 409 means workspace is already being created, just poll
                startWorkspacePolling(prototype_id)
              }
            }
          }
        } catch (error: any) {
          // If status check fails, try to prepare workspace
          if (error.response?.status === 404 || error.message?.includes('not found')) {
            try {
              await prepareWorkspace(prototype_id)
              startWorkspacePolling(prototype_id)
            } catch (prepareError: any) {
              if (prepareError.response?.status !== 409) {
                console.error('[PrototypeTabVSCode] Failed to prepare workspace:', prepareError)
                setWorkspaceError(prepareError.message || 'Failed to prepare workspace')
                setIsLoadingWorkspace(false)
              } else {
                startWorkspacePolling(prototype_id)
              }
            }
          } else {
            // Other errors - show error but keep trying
            console.error('[PrototypeTabVSCode] Error checking workspace status:', error)
            setWorkspaceError(error.message || 'Failed to check workspace status')
            // Still try to poll in case it's a transient error
            startWorkspacePolling(prototype_id)
          }
        }
      } catch (error: any) {
        console.error('[PrototypeTabVSCode] Failed to load workspace:', error)
        setWorkspaceError(error.message || 'Failed to load workspace')
        setIsLoadingWorkspace(false)
      }
    }

    loadWorkspace()

    return () => {
      if (workspacePollIntervalRef.current) {
        clearInterval(workspacePollIntervalRef.current)
      }
    }
  }, [prototype_id, isAuthorized])

  // Poll workspace status until it's running
  const startWorkspacePolling = (prototypeId: string) => {
    if (workspacePollIntervalRef.current) {
      clearInterval(workspacePollIntervalRef.current)
    }

    workspacePollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getWorkspaceStatus(prototypeId)
        setWorkspaceStatus(status)
        
        // Clear any previous errors if we're making progress
        if (status.exists && status.status !== 'failed' && workspaceError) {
          setWorkspaceError(null)
        }

        if (status.status === 'running') {
          // Workspace is running, get the URL
          try {
            const info = await getWorkspaceUrl(prototypeId)
            setWorkspaceInfo(info)
            setIsLoadingWorkspace(false)
            setWorkspaceError(null) // Clear any errors
            if (workspacePollIntervalRef.current) {
              clearInterval(workspacePollIntervalRef.current)
              workspacePollIntervalRef.current = null
            }
          } catch (urlError: any) {
            // Don't set error - the workspace is running but app might not be ready yet
            // Continue polling
          }
        } else if (status.status === 'failed') {
          // Workspace failed - stop polling and show error
          console.error('[PrototypeTabVSCode] Workspace failed to start')
          setWorkspaceError('Workspace failed to start. Please try again.')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        } else if (status.status === 'canceled') {
          // Workspace creation was canceled
          setWorkspaceError('Workspace creation was canceled')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        }
        // For other statuses (pending, starting, etc.), just continue polling
      } catch (error: any) {
        // Don't stop polling on transient errors - might be network issues
        // Only stop if it's a persistent 404 (workspace doesn't exist)
        if (error.response?.status === 404) {
          console.error('[PrototypeTabVSCode] Workspace not found during poll')
          setWorkspaceError('Workspace not found')
          setIsLoadingWorkspace(false)
          if (workspacePollIntervalRef.current) {
            clearInterval(workspacePollIntervalRef.current)
            workspacePollIntervalRef.current = null
          }
        }
        // Otherwise, continue polling - might be a transient error
      }
    }, 3000) // Poll every 3 seconds
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = rightPanelWidth
      // Disable transitions during resize for instant feedback
      const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement
      const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement
      if (leftPanel) leftPanel.style.transition = 'none'
      if (rightPanel) rightPanel.style.transition = 'none'
      setIsResizing(true)
    },
    [rightPanelWidth],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const minWidth = 300
      const maxWidth = 800
      const deltaX = e.clientX - startXRef.current
      // Dragging left (negative deltaX) increases width, dragging right (positive deltaX) decreases width
      const newWidth = Math.min(
        Math.max(startWidthRef.current - deltaX, minWidth),
        maxWidth,
      )
      setRightPanelWidth(newWidth)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    // Re-enable transitions after resize
    const leftPanel = resizeRef.current?.previousElementSibling as HTMLElement
    const rightPanel = resizeRef.current?.nextElementSibling as HTMLElement
    if (leftPanel) leftPanel.style.transition = ''
    if (rightPanel) rightPanel.style.transition = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Always render the component, even if prototype isn't loaded yet
  // The workspace loading depends on prototype_id from URL, not prototype from store
  return (
    <div className="flex h-[calc(100%-0px)] w-full p-2 bg-gray-100">
      <div
        className="flex h-full flex-1 min-w-0 flex-col border-r bg-white rounded-md"
        style={{ marginRight: '0px' }}
      >
        {isLoadingWorkspace || !workspaceInfo || workspaceStatus?.status !== 'running' ? (
          <CoderWorkspaceStatus status={workspaceStatus || { exists: false, status: 'not_created' }} error={workspaceError} />
        ) : workspaceInfo?.appUrl ? (
          <iframe
            src={`${workspaceInfo.appUrl}?folder=/home/coder/project`}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write;"
            title="Coder Workspace"
          />
        ) : (
          <CoderWorkspaceStatus status={workspaceStatus || { exists: false, status: 'not_created' }} error="Workspace URL not available" />
        )}
      </div>
      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors cursor-col-resize shrink-0"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
        style={{ marginLeft: '8px', marginRight: '8px' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`w-0.5 h-8 bg-gray-400 transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'}`}
          />
        </div>
      </div>
      <div
        className="flex h-full flex-col bg-white rounded-md shrink-0"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          }
        >
          <PrototypeTabCodeApiPanel code={prototype?.code || ''} />
        </Suspense>
      </div>
    </div>
  )
}

export default PrototypeTabVSCode
