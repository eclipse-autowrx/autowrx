// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CodeEditor, { CodeEditorHandle } from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'
import type { SiteConfigEditEntry } from '@/utils/siteConfigHistory'
import { HomePartners } from '@/components/organisms/HomePartners'
import HomeHeroSection from '@/components/organisms/HomeHeroSection'
import HomeFeatureList from '@/components/organisms/HomeFeatureList'
import HomeButtonList from '@/components/organisms/HomeButtonList'
import HomePrototypeRecent from '@/components/organisms/HomePrototypeRecent'
import HomePrototypePopular from '@/components/organisms/HomePrototypePopular'
import HomeNews from '@/components/organisms/HomeNews'
import HomeFooterSection from '@/components/organisms/HomeFooterSection'
import { TbGripVertical, TbPencil, TbX, TbCheck, TbTrash } from 'react-icons/tb'

type HomeSubTab = 'raw' | 'edit' | 'preview' | 'history'

function getBlockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    hero: 'Hero',
    'feature-list': 'Feature list',
    'button-list': 'Button list',
    news: 'News',
    recent: 'Recent prototypes',
    popular: 'Popular prototypes',
    'partner-list': 'Partners',
    'home-footer': 'Footer',
  }
  return labels[type] ?? type
}

function getHomeComponent(elementType: string) {
  switch (elementType) {
    case 'hero':
      return HomeHeroSection
    case 'feature-list':
      return HomeFeatureList
    case 'button-list':
      return HomeButtonList
    case 'news':
      return HomeNews
    case 'recent':
      return HomePrototypeRecent
    case 'popular':
      return HomePrototypePopular
    case 'partner-list':
      return HomePartners
    case 'home-footer':
      return HomeFooterSection
    default:
      return null
  }
}

const ScaledBlock: React.FC<{ scale: number; pageWidth: number; children: React.ReactNode }> = ({
  scale,
  pageWidth,
  children,
}) => {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    setHeight(el.offsetHeight)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-background overflow-hidden" style={{ height: height > 0 ? height * scale : undefined }}>
      <div ref={innerRef} style={{ width: pageWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}

const HomeConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [homeConfig, setHomeConfig] = useState<string>('')
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('edit')
  const [isLoading, setIsLoading] = useState(false)
  const [savingHome, setSavingHome] = useState<boolean>(false)
  const { toast } = useToast()
  const codeEditorRef = useRef<CodeEditorHandle>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const previewContentRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewContentHeight, setPreviewContentHeight] = useState(0)
  const [previewEditOrder, setPreviewEditOrder] = useState<any[]>([])
  const [editScale, setEditScale] = useState(1)
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null)
  const [editingBlockJson, setEditingBlockJson] = useState<string>('')
  const blockJsonEditorRef = useRef<CodeEditorHandle>(null)

  const previewElements = useMemo(() => {
    try {
      const parsed = JSON.parse(homeConfig || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [homeConfig])

  // Keep previewEditOrder in sync when data loads and we're on the edit tab
  useEffect(() => {
    if (homeSubTab === 'edit') {
      setPreviewEditOrder([...previewElements])
    }
  }, [previewElements])

  const PREVIEW_PAGE_WIDTH = 1280

  const editContainerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const update = () => {
      const w = el.offsetWidth
      setEditScale(w > 0 ? Math.min(1, w / PREVIEW_PAGE_WIDTH) : 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    // no cleanup needed — element unmounts when tab changes
  }, [])

  // Scale preview to fit container so layout matches real home page (1280px reference width)
  useEffect(() => {
    if (homeSubTab !== 'preview' || !previewWrapRef.current) return
    const el = previewWrapRef.current
    const observer = new ResizeObserver(() => {
      const w = el.offsetWidth
      setPreviewScale(w > 0 ? Math.min(1, w / PREVIEW_PAGE_WIDTH) : 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [homeSubTab, previewElements.length])

  // Measure preview content height so wrapper can clip to scaled size (avoids overlap/layout shift)
  useEffect(() => {
    if (homeSubTab !== 'preview' || !previewContentRef.current) return
    const el = previewContentRef.current
    const observer = new ResizeObserver(() => {
      setPreviewContentHeight(el.offsetHeight)
    })
    observer.observe(el)
    setPreviewContentHeight(el.offsetHeight)
    return () => observer.disconnect()
  }, [homeSubTab, previewElements])

  useEffect(() => {
    if (selfLoading || !self) return
    loadHomeConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfLoading, !!self])

  const loadHomeConfig = async () => {
    try {
      setIsLoading(true)
      // Query by key and scope instead of using getConfigByKey
      const res = await configManagementService.getConfigs({
        key: 'CFG_HOME_CONTENT',
        scope: 'site',
        limit: 1,
      })

      if (res.results && res.results.length > 0) {
        const config = res.results[0]
        // If value is object/array, stringify it for the editor
        const content =
          typeof config.value === 'string'
            ? config.value
            : JSON.stringify(config.value || {}, null, 2)
        setHomeConfig(content)
      } else {
        // Config doesn't exist yet, use empty object as fallback
        const fallbackContent = JSON.stringify({}, null, 2)
        setHomeConfig(fallbackContent)
      }
    } catch (err: any) {
      console.error('Load home config error:', err)
      // If config doesn't exist or error, use empty object as fallback
      const fallbackContent = JSON.stringify({}, null, 2)
      setHomeConfig(fallbackContent)
      toast({
        title: 'Load home config failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load home configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewEditStart = () => {
    setPreviewEditOrder([...previewElements])
    setHomeSubTab('edit')
  }

  const handlePreviewEditSave = async () => {
    const newCss = JSON.stringify(previewEditOrder, null, 2)
    setHomeConfig(newCss)
    setHomeSubTab('preview')
    await handleSave(newCss)
  }

  const handlePreviewDeleteBlock = (index: number) => {
    const confirmed = window.confirm('Remove this block from the home layout?')
    if (!confirmed) return
    setPreviewEditOrder((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRestoreHistoryEntry = (entry: SiteConfigEditEntry) => {
    const target = entry.valueAfter ?? entry.value
    const jsonStr =
      typeof target === 'string'
        ? target
        : JSON.stringify(target ?? [], null, 2)
    setHomeConfig(jsonStr)
    handleSave(jsonStr)
  }

  const handleOpenBlockEditor = (index: number) => {
    setEditingBlockIndex(index)
    setEditingBlockJson(JSON.stringify(previewEditOrder[index], null, 2))
  }

  const handleSaveBlockJson = () => {
    if (editingBlockIndex === null) return
    try {
      const parsed = JSON.parse(editingBlockJson)
      setPreviewEditOrder((prev) => {
        const next = [...prev]
        next[editingBlockIndex] = parsed
        return next
      })
      setEditingBlockIndex(null)
    } catch {
      toast({ title: 'Invalid JSON', description: 'Please fix the JSON before saving.', variant: 'destructive' })
    }
  }

  const handlePreviewDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(previewEditOrder)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setPreviewEditOrder(items)
  }

  const handleSave = async (configOverride?: string) => {
    try {
      setSavingHome(true)
      const configStr = configOverride ?? homeConfig

      // Parse JSON to validate and get object value
      let configValue: any
      try {
        configValue = JSON.parse(configStr || '[]')
      } catch (parseErr) {
        toast({
          title: 'Invalid JSON',
          description: 'Please ensure the configuration is valid JSON',
          variant: 'destructive',
        })
        setSavingHome(false)
        return
      }

      // Check if config exists first
      const existing = await configManagementService.getConfigs({
        key: 'CFG_HOME_CONTENT',
        scope: 'site',
        limit: 1,
      })

      // Check if it's a real DB config (has id) or just a default (no id)
      const hasDbConfig =
        existing.results &&
        existing.results.length > 0 &&
        existing.results[0].id &&
        !(existing.results[0] as any).isDefault

      const valueBefore =
        existing.results && existing.results.length > 0
          ? existing.results[0].value
          : undefined

      if (hasDbConfig) {
        // Update existing config in DB
        const configId = existing.results[0].id!
        await configManagementService.updateConfigById(configId, {
          value: configValue,
        })
      } else {
        // Create new config (either no results or only default value)
        await configManagementService.createConfig({
          key: 'CFG_HOME_CONTENT',
          scope: 'site',
          value: configValue,
          secret: false,
          valueType: 'array',
          category: 'home',
        })
      }

      pushSiteConfigEdit({
        key: 'CFG_HOME_CONTENT',
        valueBefore,
        valueAfter: configValue,
        valueType: 'array',
        section: 'home',
      })
      toast({ title: 'Saved', description: 'Home configuration updated. Reloading page...' })

      // Reload page to show changes immediately
      setTimeout(() => {
        window.location.href = window.location.href
      }, 800)
    } catch (err: any) {
      console.error('Save home config error:', err)
      toast({
        title: 'Save failed',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save home configuration',
        variant: 'destructive',
      })
      setSavingHome(false)
    }
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            Home Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure home page content and layout
          </p>
        </div>
        <div className="flex items-center gap-2">
          {homeSubTab === 'raw' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => codeEditorRef.current?.foldAll()}
                disabled={isLoading}
              >
                Collapse all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => codeEditorRef.current?.unfoldAll()}
                disabled={isLoading}
              >
                Expand all
              </Button>
            </>
          )}
          <Button
            size="sm"
            onClick={() => (homeSubTab === 'edit' ? handlePreviewEditSave() : handleSave())}
            disabled={savingHome}
          >
            {savingHome ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Sub-tabs row: Edit | Preview | Raw (left) + History (right) */}
      <div className="px-6 pt-2 border-b border-border flex items-end justify-between">
        <div className="flex gap-1 pb-2">
          <button
            type="button"
            onClick={handlePreviewEditStart}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              homeSubTab === 'edit'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setHomeSubTab('preview')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              homeSubTab === 'preview'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setHomeSubTab('raw')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              homeSubTab === 'raw'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Raw
          </button>
        </div>
        <div className="pb-2">
          <button
            type="button"
            onClick={() => setHomeSubTab('history')}
            className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
              homeSubTab === 'history'
                ? 'bg-muted text-foreground border border-b-0 border-border -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : homeSubTab === 'history' ? (
          <div className="px-0">
            <SiteConfigEditHistory section="home" onRestoreEntry={handleRestoreHistoryEntry} />
          </div>
        ) : homeSubTab === 'raw' ? (
          <div className="h-[70vh] flex flex-col">
            <CodeEditor
              ref={codeEditorRef}
              code={homeConfig}
              setCode={setHomeConfig}
              editable={true}
              language="json"
              onBlur={() => {}}
              fontSize={14}
            />
          </div>
        ) : homeSubTab === 'edit' ? (
          <>
            <div className="min-h-[70vh]">
              {previewElements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  <p>No content to edit.</p>
                  <p className="mt-1">
                    Switch to Raw and add a valid JSON array of home sections (e.g. hero, feature-list, news).
                  </p>
                </div>
              ) : (
                <div
                  ref={editContainerCallbackRef}
                  className="w-full rounded-sm border border-border bg-zinc-50 dark:bg-zinc-900 overflow-hidden mb-2"
                >
                  <div className="px-2 py-1">
                    <span className="text-[12px] text-foreground">Drag blocks to reorder</span>
                  </div>
                  {/* DragDropContext outside the scale transform — fixes drag offset bug */}
                  <DragDropContext onDragEnd={handlePreviewDragEnd}>
                    <Droppable droppableId="home-blocks">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex flex-col gap-3 p-3"
                        >
                          {previewEditOrder.map((element: any, index: number) => {
                            const Component = getHomeComponent(element?.type)
                            if (!Component) return null
                            const blockId = `block-${index}-${element?.type ?? 'unknown'}`
                            const isPlaceholderBlock = element?.type === 'recent' || element?.type === 'popular'
                            return (
                              <Draggable key={blockId} draggableId={blockId} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`rounded-lg border border-border overflow-hidden transition-shadow ${
                                      snapshot.isDragging
                                        ? 'shadow-xl ring-2 ring-primary opacity-95'
                                        : 'shadow-md hover:shadow-lg'
                                    }`}
                                  >
                                    {/* Block title bar — unscaled, in normal flow */}
                                    <div className="flex items-center gap-2 h-9 px-2 bg-zinc-200 dark:bg-zinc-700 border-b border-border">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                      >
                                        <TbGripVertical className="w-4 h-4" />
                                      </div>
                                      <span className="flex-1 text-xs font-semibold text-foreground truncate">
                                        {getBlockTypeLabel(element?.type ?? '')}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenBlockEditor(index)}
                                        className="cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        title="Edit block config"
                                      >
                                        <TbPencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handlePreviewDeleteBlock(index)}
                                        className="cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      >
                                        <TbTrash className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {/* Block content — scaled to fit width */}
                                    {isPlaceholderBlock ? (
                                      <div className="bg-background px-4 py-3">
                                        <div className="grid grid-cols-4 gap-3">
                                          {[...Array(4)].map((_, i) => (
                                            <div key={i} className="rounded-md border border-border bg-muted/20 flex flex-col overflow-hidden">
                                              {/* Image skeleton with mountain/landscape icon */}
                                              <div className="h-28 bg-muted/50 flex items-center justify-center relative overflow-hidden">
                                                <svg className="w-10 h-10 text-muted-foreground/20" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                </svg>
                                              </div>
                                              <div className="px-2 py-2">
                                                <div className="h-2 w-3/4 rounded bg-muted-foreground/15" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <p className="mt-2 text-[11px] text-muted-foreground/40 italic text-center">
                                          Content loaded dynamically at runtime
                                        </p>
                                      </div>
                                    ) : (
                                      <ScaledBlock scale={editScale} pageWidth={PREVIEW_PAGE_WIDTH}>
                                        <Component {...element} />
                                      </ScaledBlock>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </div>

            {/* Block JSON editor popup */}
            {editingBlockIndex !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-background rounded-xl border border-border shadow-2xl w-[600px] max-w-[90vw] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">
                      Edit block config — {getBlockTypeLabel(previewEditOrder[editingBlockIndex]?.type ?? '')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBlockIndex(null)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <TbX className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-[400px]">
                    <CodeEditor
                      ref={blockJsonEditorRef}
                      code={editingBlockJson}
                      setCode={setEditingBlockJson}
                      editable={true}
                      language="json"
                      onBlur={() => {}}
                      fontSize={13}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
                    <Button variant="outline" size="sm" onClick={() => setEditingBlockIndex(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveBlockJson}>
                      <TbCheck className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div
              ref={previewWrapRef}
              className="min-h-[70vh] rounded-md border border-border bg-background overflow-auto flex justify-center"
            >
            {previewElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
                <p>No content to preview.</p>
                <p className="mt-1">Switch to Raw and add a valid JSON array of home sections (e.g. hero, feature-list, news).</p>
              </div>
            ) : (
              <div
                style={{
                  width: PREVIEW_PAGE_WIDTH * previewScale,
                  height: previewContentHeight > 0 ? previewContentHeight * previewScale : undefined,
                  minHeight: previewContentHeight > 0 ? undefined : 400,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: PREVIEW_PAGE_WIDTH,
                    height: previewContentHeight > 0 ? previewContentHeight : undefined,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <div
                    ref={previewContentRef}
                    className="space-y-12 p-6 bg-background"
                  >
                    {previewElements.map((element: any, index: number) => {
                      const Component = getHomeComponent(element?.type)
                      if (!Component) return null
                      return <Component key={index} {...element} />
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </>
  )
}

export default HomeConfigSection
