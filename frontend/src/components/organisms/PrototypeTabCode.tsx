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
import { Button } from '@/components/atoms/button'
import useModelStore from '@/stores/modelStore'
import { Prototype } from '@/types/model.type'
import { shallow } from 'zustand/shallow'
import { BsStars } from 'react-icons/bs'
import DaDialog from '@/components/molecules/DaDialog'
import usePermissionHook from '@/hooks/usePermissionHook'
import useCurrentModel from '@/hooks/useCurrentModel'
import { PERMISSIONS } from '@/data/permission'
import { updatePrototypeService } from '@/services/prototype.service'

import { GrDeploy } from 'react-icons/gr'
import { toast } from 'react-toastify'
import config from '@/configs/config'
import CodeEditor from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'

// Helper function to determine editor type
const getEditorType = (content: string): 'project' | 'code' => {
  if (!content || content.trim() === '') return 'code'

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return 'project'
    }
  } catch {
    // Not valid JSON, treat as code
  }

  return 'code'
}

// Lazy load components that may not exist yet - using dynamic imports with error handling
// These will gracefully fail if the modules don't exist
const ProjectEditor = lazy(() =>
  retry(() => import('../molecules/project_editor/ProjectEditor')),
)

const PrototypeTabCodeApiPanel = lazy(() =>
  retry(() => import('./PrototypeTabCodeApiPanel')),
)

const DaGenAI_Python = lazy(() =>
  Promise.resolve({
    default: ({ onCodeChanged }: { onCodeChanged: (code: string) => void }) => (
      <div className="p-4 text-muted-foreground">GenAI not available</div>
    ),
  }).catch(() => ({
    default: ({ onCodeChanged }: { onCodeChanged: (code: string) => void }) => (
      <div className="p-4 text-muted-foreground">GenAI not available</div>
    ),
  })),
) as any

const PrototypeTabCode: FC = () => {
  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined)
  const [code, setCode] = useState<string | undefined>(undefined)
  const [ticker, setTicker] = useState(0)
  const [activeTab, setActiveTab] = useState('api')
  const [isOpenGenAI, setIsOpenGenAI] = useState(false)
  const { data: model } = useCurrentModel()
  const [isAuthorized] = usePermissionHook([PERMISSIONS.READ_MODEL, model?.id])

  // Editor type state
  const [editorType, setEditorType] = useState<'project' | 'code'>('code')

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState(360) // Initial width in px
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    let timer = setInterval(() => {
      setTicker((oldTicker) => oldTicker + 1)
    }, 3000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    saveCodeToDb()
  }, [ticker])

  useEffect(() => {
    if (!prototype) {
      setSavedCode(undefined)
      setCode(undefined)
      setEditorType('code')
      return
    }

    const prototypeCode = prototype.code || ''
    setCode(prototypeCode)
    setSavedCode(prototypeCode)

    const newEditorType = getEditorType(prototypeCode)
    setEditorType(newEditorType)
  }, [prototype])

  const saveCodeToDb = async (codeToSave?: string) => {
    // Use the passed code parameter if available, otherwise use current code state
    const dataToSave = codeToSave !== undefined ? codeToSave : code

    if (!dataToSave || dataToSave === savedCode) return

    // Update local state with the new code
    setCode(dataToSave)
    setSavedCode(dataToSave)

    let newPrototype = JSON.parse(JSON.stringify(prototype))
    newPrototype.code = dataToSave || ''
    setActivePrototype(newPrototype)

    if (!prototype || !prototype.id) return
    try {
      await updatePrototypeService(prototype.id, {
        code: dataToSave || '',
      })
    } catch (err) {
      console.error('Error saving code:', err)
    }
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

  if (!prototype) {
    return <div></div>
  }

  return (
    <div className="flex h-[calc(100%-0px)] w-full p-2 bg-gray-100">
      <div
        className="flex h-full flex-1 min-w-0 flex-col border-r bg-white rounded-md"
        style={{ marginRight: '0px' }}
      >
        <div className="flex min-h-12 w-full items-center justify-between">
          {isAuthorized && (
            <div className="flex mx-2 space-x-4">
              <DaDialog
                open={isOpenGenAI}
                onOpenChange={setIsOpenGenAI}
                trigger={
                  <Button size="sm">
                    <BsStars className="mr-1" />
                    SDV ProtoPilot
                  </Button>
                }
                dialogTitle="SDV ProtoPilot"
                className="flex flex-col h-[80vh] xl:h-[600px] max-h-[90vh] w-[1200px] max-w-[80vw]"
                contentContainerClassName="h-full"
              >
                <div className="rounded-lg text-sm flex h-full w-full flex-col bg-white">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <Spinner />
                      </div>
                    }
                  >
                    <DaGenAI_Python
                      onCodeChanged={(code: string) => {
                        setCode(code)
                        setIsOpenGenAI(false)
                      }}
                    />
                  </Suspense>
                </div>
              </DaDialog>
            </div>
          )}

          <div className="grow"></div>

          <div className="mr-2 text-sm">
            Language: <b>{(prototype.language || 'python').toUpperCase()}</b>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          }
        >
          {editorType === 'project' ? (
            <ProjectEditor
              data={code || ''}
              onChange={(data: string) => {
                setCode(data)
                setSavedCode(data)
              }}
              onSave={async (data: string) => {
                console.log('ProjectEditor onSave called with data:', data)
                console.trace('Stack trace:')
                // Pass the new data directly to saveCodeToDb
                // Don't wait for React state updates - use the data parameter
                await saveCodeToDb(data)
              }}
            />
          ) : (
            <CodeEditor
              code={code || ''}
              setCode={setCode}
              editable={isAuthorized}
              language={prototype.language || 'python'}
              onBlur={saveCodeToDb}
            />
          )}
        </Suspense>
      </div>
      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="w-1 bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors cursor-col-resize flex-shrink-0"
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
        className="flex h-full flex-col bg-white rounded-md flex-shrink-0"
        style={{ width: `${rightPanelWidth}px` }}
      >
        {activeTab == 'api' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            }
          >
            <PrototypeTabCodeApiPanel code={code || ''} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default PrototypeTabCode
