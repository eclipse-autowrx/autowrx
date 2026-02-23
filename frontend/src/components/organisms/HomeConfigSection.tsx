// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import CodeEditor, { CodeEditorHandle } from '@/components/molecules/CodeEditor'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import SiteConfigEditHistory from '@/components/molecules/SiteConfigEditHistory'
import { HomePartners } from '@/components/organisms/HomePartners'
import HomeHeroSection from '@/components/organisms/HomeHeroSection'
import HomeFeatureList from '@/components/organisms/HomeFeatureList'
import HomeButtonList from '@/components/organisms/HomeButtonList'
import HomePrototypeRecent from '@/components/organisms/HomePrototypeRecent'
import HomePrototypePopular from '@/components/organisms/HomePrototypePopular'
import HomeNews from '@/components/organisms/HomeNews'
import HomeFooterSection from '@/components/organisms/HomeFooterSection'
import { TbGripVertical, TbPencil, TbX, TbCheck } from 'react-icons/tb'

type HomeSubTab = 'raw' | 'preview'

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

const HomeConfigSection: React.FC = () => {
  const { data: self, isLoading: selfLoading } = useSelfProfileQuery()
  const [homeConfig, setHomeConfig] = useState<string>('')
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('raw')
  const [isLoading, setIsLoading] = useState(false)
  const [savingHome, setSavingHome] = useState<boolean>(false)
  const { toast } = useToast()
  const codeEditorRef = useRef<CodeEditorHandle>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const previewContentRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewContentHeight, setPreviewContentHeight] = useState(0)
  const [previewEditMode, setPreviewEditMode] = useState(false)
  const [previewEditOrder, setPreviewEditOrder] = useState<any[]>([])

  const previewElements = useMemo(() => {
    try {
      const parsed = JSON.parse(homeConfig || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [homeConfig])

  // Scale preview to fit container so layout matches real home page (1280px reference width)
  const PREVIEW_PAGE_WIDTH = 1280
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

  // Exit edit mode when leaving preview tab
  useEffect(() => {
    if (homeSubTab !== 'preview') setPreviewEditMode(false)
  }, [homeSubTab])

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
    setPreviewEditMode(true)
  }

  const handlePreviewEditCancel = () => {
    setPreviewEditMode(false)
  }

  const handlePreviewEditSave = async () => {
    const newCss = JSON.stringify(previewEditOrder, null, 2)
    setHomeConfig(newCss)
    setPreviewEditMode(false)
    await handleSave(newCss)
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
          {homeSubTab === 'preview' && previewElements.length > 0 &&
            (previewEditMode ? (
              <Button variant="outline" size="sm" onClick={handlePreviewEditCancel}>
                <TbX className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handlePreviewEditStart}>
                <TbPencil className="w-4 h-4 mr-1" />
                Edit order
              </Button>
            ))
          }
          <Button
            size="sm"
            onClick={() => (homeSubTab === 'preview' && previewEditMode ? handlePreviewEditSave() : handleSave())}
            disabled={savingHome}
          >
            {savingHome ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Raw | Preview */}
      <div className="px-6 pt-2 border-b border-border">
        <div className="flex gap-1 pb-2">
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
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
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
            ) : previewEditMode ? (
              <div className="w-full max-w-4xl rounded-md border border-border bg-background overflow-auto">
                <DragDropContext onDragEnd={handlePreviewDragEnd}>
                  <Droppable droppableId="home-blocks">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4 p-6"
                      >
                        {previewEditOrder.map((element: any, index: number) => {
                          const Component = getHomeComponent(element?.type)
                          if (!Component) return null
                          const blockId = `block-${index}-${element?.type ?? 'unknown'}`
                          return (
                            <Draggable key={blockId} draggableId={blockId} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`rounded-lg border bg-background ${
                                    snapshot.isDragging ? 'opacity-80 shadow-lg ring-2 ring-primary' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2 p-2 border-b border-border bg-muted/30">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex items-center justify-center w-8 h-8 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                    >
                                      <TbGripVertical className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium py-1.5">
                                      {getBlockTypeLabel(element?.type ?? '')}
                                    </span>
                                  </div>
                                  <div className="p-4">
                                    <Component {...element} />
                                  </div>
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
      <div className="px-6 pb-6">
        <SiteConfigEditHistory section="home" />
      </div>
    </>
  )
}

export default HomeConfigSection
