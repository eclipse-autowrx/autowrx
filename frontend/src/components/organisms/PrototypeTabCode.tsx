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
import { DiffEditor } from '@monaco-editor/react'
import DaDialog from '@/components/molecules/DaDialog'
import useCanEditPrototype from '@/hooks/useCanEditPrototype'
import { updatePrototypeService } from '@/services/prototype.service'
import { useSiteConfig } from '@/utils/siteConfig'
import { PiArrowsLeftRight, PiCode } from 'react-icons/pi'
import CodeEditor from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import { retry } from '@/lib/retry'

// sessionStorage helpers for diff previous code
const getDiffStorageKey = (prototypeId: string) => `code_diff_prev_${prototypeId}`
const getDiffVisibleKey = (prototypeId: string) => `code_diff_visible_${prototypeId}`

const savePreviousCodeToSession = (prototypeId: string, prevCode: string) => {
  try {
    sessionStorage.setItem(getDiffStorageKey(prototypeId), prevCode)
  } catch {
    // ignore storage errors
  }
}

const getPreviousCodeFromSession = (prototypeId: string): string | undefined => {
  try {
    return sessionStorage.getItem(getDiffStorageKey(prototypeId)) ?? undefined
  } catch {
    return undefined
  }
}

const saveDiffVisibleToSession = (prototypeId: string, visible: boolean) => {
  try {
    sessionStorage.setItem(getDiffVisibleKey(prototypeId), visible ? '1' : '0')
  } catch {
    // ignore storage errors
  }
}

const getDiffVisibleFromSession = (prototypeId: string): boolean => {
  try {
    return sessionStorage.getItem(getDiffVisibleKey(prototypeId)) === '1'
  } catch {
    return false
  }
}

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
  retry(() => import('../molecules/genAI/DaGenAI_Python')),
)

const PrototypeTabCode: FC = () => {
  const [prototype, setActivePrototype, activeModelApis] = useModelStore(
    (state) => [
      state.prototype as Prototype,
      state.setActivePrototype,
      state.activeModelApis,
    ],
    shallow,
  )
  const [code, setCode] = useState<string | undefined>(undefined)
  const [ticker, setTicker] = useState(0)
  const [activeTab, setActiveTab] = useState('api')
  const [isOpenGenAI, setIsOpenGenAI] = useState(false)
  const editable = useCanEditPrototype(prototype)
  const showCodeApiPanel = useSiteConfig('SHOW_CODE_API_PANEL', true)
  const showCodeDiff = useSiteConfig('SHOW_CODE_DIFF', true)
  const showSdvProtoPilotButton = useSiteConfig(
    'SHOW_SDV_PROTOPILOT_BUTTON',
    false,
  )

  // Editor type state
  const [editorType, setEditorType] = useState<'project' | 'code'>('code')

  // Diff state
  const [previousCode, setPreviousCode] = useState<string | undefined>(undefined)
  const [showDiff, setShowDiff] = useState(false)
  // Ref to track last code saved by us — used to detect external (plugin/AI) code changes
  const savedCodeRef = useRef<string | undefined>(undefined)
  // Latest editor code (avoids stale closures during async save)
  const codeRef = useRef<string | undefined>(undefined)

  // Resize state
  const [rightPanelWidth, setRightPanelWidth] = useState<number | null>(null) // Will be calculated based on container
  const [isResizing, setIsResizing] = useState(false)
  const [isApiPanelCollapsed, setIsApiPanelCollapsed] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Calculate initial width based on container size with 6:4 ratio (60% editor, 40% API panel)
  useEffect(() => {
    const calculateInitialWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        // 40% of container width for API panel (6:4 ratio)
        const calculatedWidth = containerWidth * 0.4
        setRightPanelWidth(calculatedWidth)
      }
    }

    // Calculate on mount
    calculateInitialWidth()

    // Recalculate on window resize
    window.addEventListener('resize', calculateInitialWidth)
    return () => window.removeEventListener('resize', calculateInitialWidth)
  }, [])

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
    codeRef.current = code
  }, [code])

  useEffect(() => {
    if (!prototype) {
      savedCodeRef.current = undefined
      setCode(undefined)
      setEditorType('code')
      setPreviousCode(undefined)
      setShowDiff(false)
      return
    }

    const prototypeCode = prototype.code || ''
    const isInitial = savedCodeRef.current === undefined
    const isExternal = !isInitial && prototypeCode !== savedCodeRef.current
    const localCode = codeRef.current

    if (isInitial) {
      // Initial mount — restore diff state from sessionStorage if available
      const restoredPrev = getPreviousCodeFromSession(prototype.id)
      if (restoredPrev !== undefined) {
        setPreviousCode(restoredPrev)
        setShowDiff(getDiffVisibleFromSession(prototype.id))
      }
      setCode(prototypeCode)
      savedCodeRef.current = prototypeCode
    } else if (isExternal) {
      // External (plugin/AI) update — capture previous code for diff
      savePreviousCodeToSession(prototype.id, savedCodeRef.current!)
      saveDiffVisibleToSession(prototype.id, true)
      setPreviousCode(savedCodeRef.current)
      setShowDiff(true)
      setCode(prototypeCode)
      savedCodeRef.current = prototypeCode
    }
    // Own save echoed via setActivePrototype — do not clobber in-progress edits

    const newEditorType = getEditorType(
      isInitial || isExternal ? prototypeCode : (localCode ?? prototypeCode),
    )
    setEditorType(newEditorType)
  }, [prototype])

  const saveCodeToDb = async (codeToSave?: string) => {
    let dataToSave: string | undefined
    if (codeToSave !== undefined) {
      // Explicit save from editor (Save All or Ctrl+S) — always persist, do not skip
      dataToSave = codeToSave
    } else {
      // Periodic / blur auto-save — skip if unchanged (use ref to avoid stale skip)
      const latest = codeRef.current
      if (latest === undefined || latest === savedCodeRef.current) return
      dataToSave = latest
    }

    const prototypeId = prototype?.id
    if (!prototypeId) return

    try {
      await updatePrototypeService(prototypeId, {
        code: dataToSave || '',
      })
      // Mark as saved without setCode — preserves cursor and any edits typed during await
      savedCodeRef.current = dataToSave
      // Merge only `code` into the *current* store prototype. Cloning the render-closure
      // prototype would revert fields (widget_config, extend, …) updated elsewhere
      // while the editor was mounted (e.g. dashboard template apply → blur-save).
      const current = useModelStore.getState().prototype
      if (current?.id === prototypeId) {
        setActivePrototype({ ...current, code: dataToSave || '' })
      }
    } catch (err) {
      console.error('Error saving code:', err)
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      // Use current width or calculate from container if null
      if (rightPanelWidth !== null) {
        startWidthRef.current = rightPanelWidth
      } else if (containerRef.current) {
        startWidthRef.current = containerRef.current.offsetWidth * 0.4
      } else {
        startWidthRef.current = 0
      }
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
      if (!isResizing || !containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      // Min 20% and max 60% of container width for responsive behavior
      const minWidth = containerWidth * 0.2
      const maxWidth = containerWidth * 0.6
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
    <div ref={containerRef} className="flex h-[calc(100%-0px)] w-full p-2 bg-gray-100">
      <div className="flex h-full flex-1 min-w-0 flex-col border-r bg-white rounded-md">
        <div className="flex min-h-12 w-full items-center justify-between">
          {editable && showSdvProtoPilotButton ? (
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
                      onCodeChanged={(newCode: string) => {
                        // Capture current editor code as diff baseline before applying AI code
                        const currentCode = code
                        if (currentCode !== undefined && prototype?.id) {
                          savePreviousCodeToSession(prototype.id, currentCode)
                          saveDiffVisibleToSession(prototype.id, true)
                          setPreviousCode(currentCode)
                          setShowDiff(true)
                        }
                        setCode(newCode)
                        setIsOpenGenAI(false)
                        // Persist immediately. Do not advance savedCodeRef here — that would
                        // mark the editor "clean" and skip auto/blur save, leaving AI code
                        // unsaved and vulnerable to being clobbered by a store refetch.
                        // saveCodeToDb advances savedCodeRef only after the API succeeds.
                        void saveCodeToDb(newCode)
                      }}
                    />
                  </Suspense>
                </div>
              </DaDialog>
            </div>
          ) : showCodeDiff && <div className="px-4 text-sm">
            Language: <b>{(prototype.language || 'python').toUpperCase()}</b>
          </div>}

          <div className="grow"></div>

          {showCodeDiff && editorType === 'code' && previousCode !== undefined && (
            <Button
              size="sm"
              variant={showDiff ? 'default' : 'ghost'}
              className="mr-1"
              onClick={() => setShowDiff((v) => {
                const next = !v
                if (prototype?.id) saveDiffVisibleToSession(prototype.id, next)
                return next
              })}
              title={showDiff ? 'Hide diff view' : 'Show diff with previous version'}
            >
              {showDiff ? (
                <>
                  <PiCode className="size-4" />
                  Hide Diff
                </>
              ) : (
                <>
                  <PiArrowsLeftRight className="size-4" />
                  Show Diff
                </>
              )}
            </Button>
          )}

          {!showCodeDiff && <div className="mr-2 text-sm">
            Language: <b>{(prototype.language || 'python').toUpperCase()}</b>
          </div>}
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
              prototypeName={prototype.name}
              onChange={(data: string) => {
                setCode(data)
                // Do not advance savedCodeRef here — only when we actually persist (saveCodeToDb)
                // so that Save All / Ctrl+S still trigger the API when there are unsaved changes
              }}
              onSave={async (data: string) => {
                await saveCodeToDb(data)
              }}
            />
          ) : showCodeDiff && showDiff && previousCode !== undefined ? (
            <DiffEditor
              original={previousCode}
              modified={code || ''}
              language={prototype.language || 'python'}
              height="100%"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderSideBySide: true,
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              }
            />
          ) : (
            <CodeEditor
              code={code || ''}
              setCode={setCode}
              editable={editable}
              language={prototype.language || 'python'}
              onBlur={saveCodeToDb}
            />
          )}
        </Suspense>
      </div>
      {showCodeApiPanel && (
        <>
          {/* Resize handle */}
          <div
            ref={resizeRef}
            className="mx-0.5 w-1 bg-transparent hover:bg-blue-500 hover:bg-opacity-50 transition-colors cursor-col-resize shrink-0"
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div
                className={`w-0.5 h-8 bg-gray-400 transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-60'}`}
              />
            </div>
          </div>
          <div
            className="flex h-full flex-col bg-white rounded-md shrink-0 transition-all duration-200 ease-in-out"
            style={{
              width:
                isApiPanelCollapsed
                  ? '48px'
                  : rightPanelWidth !== null
                    ? `${rightPanelWidth}px`
                    : '40%',
            }}
          >
            {activeTab == 'api' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Spinner />
                  </div>
                }
              >
                <PrototypeTabCodeApiPanel
                  code={code || ''}
                  onCollapsedChange={setIsApiPanelCollapsed}
                />
              </Suspense>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PrototypeTabCode
