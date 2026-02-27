// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Checkbox } from '@/components/atoms/checkbox'
import { useQuery } from '@tanstack/react-query'
import { listPlugins, Plugin } from '@/services/plugin.service'
import { Spinner } from '@/components/atoms/spinner'
import {
  TbGripVertical,
  TbPencil,
  TbTrash,
  TbCheck,
  TbX,
  TbRoute,
  TbMapPin,
  TbCode,
  TbGauge,
  TbPuzzle,
  TbEye,
  TbEyeOff,
  TbLayoutSidebar,
  TbSearch,
  TbListCheck,
  TbPlus,
  TbChevronUp,
} from 'react-icons/tb'
import { MdOutlineDoubleArrow } from 'react-icons/md'
import StagingTabButtonPreview from '@/components/organisms/StagingTabButtonPreview'

export interface CustomTab {
  label: string
  plugin: string
}

export interface TabConfig {
  type: 'builtin' | 'custom'
  key?: string  // For builtin: 'overview' | 'journey' | 'code' | 'dashboard'
  label: string
  plugin?: string  // For custom tabs only
  hidden?: boolean  // If true, tab is hidden
  iconSvg?: string  // Custom SVG icon content (overrides the default icon)
}

export interface StagingConfig {
  label?: string
  hideIcon?: boolean
  iconSvg?: string  // Custom SVG icon content (inline SVG string)
  variant?: 'tab' | 'primary' | 'outline' | 'secondary' | 'ghost'
}

export interface RightNavPluginButton {
  builtin?: 'staging'         // Marks the built-in staging button item
  plugin?: string             // Plugin slug (required for plugin-type items)
  label?: string
  iconSvg?: string
  hideIcon?: boolean          // For staging: whether to hide the icon
  variant?: 'tab' | 'primary' | 'outline' | 'secondary' | 'ghost'
  hidden?: boolean
}

interface CustomTabEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tabs: TabConfig[]
  onSave: (updatedTabs: TabConfig[], updatedSidebarPlugin?: string | null, updatedTabsVariant?: string | null, updatedRightNavButtons?: RightNavPluginButton[] | null) => Promise<void>
  sidebarPlugin?: string
  stagingConfig?: StagingConfig
  rightNavButtons?: RightNavPluginButton[]
  /** Global style variant for all prototype tab buttons ('tab' | 'primary' | 'outline' | 'ghost') */
  tabsVariant?: string
  title?: string
  description?: string
}

const CustomTabEditor: FC<CustomTabEditorProps> = ({
  open,
  onOpenChange,
  tabs,
  onSave,
  sidebarPlugin,
  stagingConfig,
  rightNavButtons,
  tabsVariant,
  title = 'Manage Custom Tabs',
  description = 'Edit, reorder, and remove custom tabs',
}) => {
  const [localTabs, setLocalTabs] = useState<TabConfig[]>(tabs)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>('')
  const [editingIconSvg, setEditingIconSvg] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeDialogTab, setActiveDialogTab] = useState<'tabs' | 'sidebar' | 'rightnav' | 'style'>('tabs')
  const [localStagingConfig, setLocalStagingConfig] = useState<StagingConfig>(stagingConfig || {})
  const [localTabsVariant, setLocalTabsVariant] = useState<string>(tabsVariant || 'tab')
  const [localRightNavPlugins, setLocalRightNavPlugins] = useState<RightNavPluginButton[]>(rightNavButtons || [])
  const [expandedRightNavItem, setExpandedRightNavItem] = useState<'staging' | number | null>(null)

  // Sidebar plugin state
  const [localSidebarPlugin, setLocalSidebarPlugin] = useState<string | null>(sidebarPlugin || null)
  const [showSidebarPluginPicker, setShowSidebarPluginPicker] = useState(false)
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('')

  // Right nav plugin picker state
  const [showRightNavPluginPicker, setShowRightNavPluginPicker] = useState(false)
  const [rightNavSearchTerm, setRightNavSearchTerm] = useState('')

  // Fetch plugins for plugin pickers
  const { data: pluginsData, isLoading: pluginsLoading } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => listPlugins({ page: 1, limit: 100 }),
    enabled: activeDialogTab === 'sidebar' || activeDialogTab === 'rightnav',
  })

  // Update local tabs when dialog opens or tabs change
  useEffect(() => {
    if (open) {
      setLocalTabs(tabs)
      setLocalSidebarPlugin(sidebarPlugin || null)
      setLocalStagingConfig(stagingConfig || {})
      setLocalTabsVariant(tabsVariant || 'tab')
      setLocalRightNavPlugins(rightNavButtons || [])
      setActiveDialogTab('tabs')
      setEditingIndex(null)
      setEditingLabel('')
      setEditingIconSvg('')
      setExpandedRightNavItem(null)
      setShowSidebarPluginPicker(false)
      setSidebarSearchTerm('')
      setShowRightNavPluginPicker(false)
      setRightNavSearchTerm('')
    }
  }, [open, tabs, sidebarPlugin, stagingConfig, tabsVariant, rightNavButtons])

  // Get icon for builtin tabs
  const getBuiltinIcon = (key?: string) => {
    switch (key) {
      case 'overview':
        return <TbRoute className="w-4 h-4" />
      case 'journey':
        return <TbMapPin className="w-4 h-4" />
      case 'code':
        return <TbCode className="w-4 h-4" />
      case 'dashboard':
        return <TbGauge className="w-4 h-4" />
      case 'flow':
        return <MdOutlineDoubleArrow className="w-4 h-4" />
      default:
        return <TbPuzzle className="w-4 h-4" />
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(localTabs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setLocalTabs(items)
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditingLabel(localTabs[index].label)
    setEditingIconSvg(localTabs[index].iconSvg || '')
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingLabel.trim()) {
      const updatedTabs = [...localTabs]
      updatedTabs[editingIndex] = {
        ...updatedTabs[editingIndex],
        label: editingLabel.trim(),
        iconSvg: editingIconSvg.trim() || undefined,
      }
      setLocalTabs(updatedTabs)
      setEditingIndex(null)
      setEditingLabel('')
      setEditingIconSvg('')
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingLabel('')
    setEditingIconSvg('')
  }

  const handleRemove = (index: number) => {
    // Only allow deletion of custom tabs
    if (localTabs[index].type === 'custom') {
      const updatedTabs = localTabs.filter((_, i) => i !== index)
      setLocalTabs(updatedTabs)
    }
  }

  const handleToggleHidden = (index: number) => {
    const updatedTabs = [...localTabs]
    const tab = updatedTabs[index]

    if (tab.type === 'builtin' && tab.key !== 'overview') {
      return
    }

    updatedTabs[index] = {
      ...tab,
      hidden: !tab.hidden
    }
    setLocalTabs(updatedTabs)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Determine if sidebar plugin changed
      const sidebarChanged = localSidebarPlugin !== (sidebarPlugin || null)
      // Determine if tabs variant changed
      const variantChanged = localTabsVariant !== (tabsVariant || 'tab')
      // Merge staging config into right nav buttons (staging is always first item)
      const mergedRightNav: RightNavPluginButton[] = [
        { builtin: 'staging' as const, ...localStagingConfig },
        ...localRightNavPlugins,
      ]
      // Determine if right nav (including staging) changed
      const originalRightNav: RightNavPluginButton[] = [
        { builtin: 'staging' as const, ...(stagingConfig || {}) },
        ...(rightNavButtons || []),
      ]
      const rightNavChanged = JSON.stringify(mergedRightNav) !== JSON.stringify(originalRightNav)
      await onSave(
        localTabs,
        sidebarChanged ? localSidebarPlugin : undefined,
        variantChanged ? (localTabsVariant !== 'tab' ? localTabsVariant : null) : undefined,
        rightNavChanged ? (mergedRightNav.length ? mergedRightNav : null) : undefined,
      )
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tabs:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalTabs(tabs) // Reset to original
    setLocalSidebarPlugin(sidebarPlugin || null)
    setLocalStagingConfig(stagingConfig || {})
    setLocalTabsVariant(tabsVariant || 'tab')
    setLocalRightNavPlugins(rightNavButtons || [])
    setEditingIndex(null)
    setEditingLabel('')
    setEditingIconSvg('')
    setExpandedRightNavItem(null)
    setShowSidebarPluginPicker(false)
    setShowRightNavPluginPicker(false)
    onOpenChange(false)
  }

  // Get the selected sidebar plugin details
  const selectedSidebarPluginData = pluginsData?.results?.find(
    (p) => p.slug === localSidebarPlugin
  )

  // Filter plugins for sidebar picker
  const filteredSidebarPlugins = pluginsData?.results?.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(sidebarSearchTerm.toLowerCase()) ||
      plugin.slug?.toLowerCase().includes(sidebarSearchTerm.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(sidebarSearchTerm.toLowerCase())
  ) ?? []

  // Filter plugins for right nav picker (excluding already-added ones)
  const filteredRightNavPlugins = pluginsData?.results?.filter(
    (plugin) =>
      !localRightNavPlugins.some((b) => b.plugin === plugin.slug) &&
      (plugin.name.toLowerCase().includes(rightNavSearchTerm.toLowerCase()) ||
        plugin.slug?.toLowerCase().includes(rightNavSearchTerm.toLowerCase()))
  ) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Internal Tab Switcher */}
        <div className="flex border-b border-border -mx-6 px-6">
          <button
            onClick={() => setActiveDialogTab('tabs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeDialogTab === 'tabs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <TbPuzzle className="w-4 h-4" />
            Prototype Tabs
          </button>
          <button
            onClick={() => setActiveDialogTab('style')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeDialogTab === 'style'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <TbEye className="w-4 h-4" />
            Tab Style
          </button>
          <button
            onClick={() => setActiveDialogTab('rightnav')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeDialogTab === 'rightnav'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <TbListCheck className="w-4 h-4" />
            Right Nav
          </button>
          <button
            onClick={() => setActiveDialogTab('sidebar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeDialogTab === 'sidebar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <TbLayoutSidebar className="w-4 h-4" />
            Left Sidebar
          </button>
        </div>

        <div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1">
          {/* Left Sidebar Plugin Tab */}
          {activeDialogTab === 'sidebar' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Set a plugin to display in a resizable left sidebar, visible across all tabs. Only one plugin can be assigned.
              </p>

              {localSidebarPlugin && !showSidebarPluginPicker ? (
                <div className="flex items-center gap-3 p-3 border border-border rounded bg-accent/50">
                  <TbPuzzle className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedSidebarPluginData?.name || localSidebarPlugin}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      plugin: {localSidebarPlugin}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebarPluginPicker(true)}
                    className="h-8 w-8"
                    title="Change plugin"
                  >
                    <TbPencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setLocalSidebarPlugin(null)
                      setShowSidebarPluginPicker(false)
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Remove sidebar plugin"
                  >
                    <TbTrash className="w-4 h-4" />
                  </Button>
                </div>
              ) : showSidebarPluginPicker ? (
                <div className="flex flex-col gap-2 border border-border rounded p-3">
                  <div className="relative">
                    <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search plugins..."
                      value={sidebarSearchTerm}
                      onChange={(e) => setSidebarSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col max-h-48 overflow-y-auto">
                    {pluginsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner size={20} />
                      </div>
                    ) : filteredSidebarPlugins.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">
                        {sidebarSearchTerm ? 'No plugins found' : 'No plugins available'}
                      </p>
                    ) : (
                      filteredSidebarPlugins.map((plugin) => (
                        <button
                          key={plugin.id}
                          onClick={() => {
                            setLocalSidebarPlugin(plugin.slug)
                            setShowSidebarPluginPicker(false)
                            setSidebarSearchTerm('')
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left"
                        >
                          {plugin.image ? (
                            <img
                              src={plugin.image}
                              alt={plugin.name}
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {plugin.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {plugin.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {plugin.slug}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSidebarPluginPicker(false)
                        setSidebarSearchTerm('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setShowSidebarPluginPicker(true)}
                >
                  <TbPuzzle className="w-4 h-4 mr-2" />
                  Set Sidebar Plugin
                </Button>
              )}
            </div>
          )}

          {/* Right Nav Tab */}
          {activeDialogTab === 'rightnav' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Configure buttons shown in the right navigation area.
              </p>

              <div className="flex flex-col gap-2">
                {/* Staging button — always first, built-in */}
                <div className="border border-border rounded bg-background">
                  <div className="flex items-center gap-3 p-3">
                    {localStagingConfig.iconSvg ? (
                      <span className="w-5 h-5 shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: localStagingConfig.iconSvg }} />
                    ) : (
                      <TbListCheck className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{localStagingConfig.label || 'Staging'}</p>
                      <p className="text-xs text-muted-foreground">Built-in staging button</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded shrink-0">Built-in</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedRightNavItem(expandedRightNavItem === 'staging' ? null : 'staging')}
                      className="h-8 w-8 shrink-0"
                    >
                      {expandedRightNavItem === 'staging' ? <TbChevronUp className="w-4 h-4" /> : <TbPencil className="w-4 h-4" />}
                    </Button>
                  </div>
                  {expandedRightNavItem === 'staging' && (
                    <div className="border-t border-border p-3 flex flex-col gap-3">
                      {/* Show Icon */}
                      <div className="flex items-center gap-3">
                        <Label className="text-xs w-20 shrink-0 text-foreground">Show Icon</Label>
                        <button
                          type="button"
                          onClick={() => setLocalStagingConfig(c => ({ ...c, hideIcon: !c.hideIcon }))}
                          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                        >
                          {localStagingConfig.hideIcon ? (
                            <><TbEyeOff className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Hidden</span></>
                          ) : (
                            <><TbEye className="w-4 h-4" /><span>Visible</span></>
                          )}
                        </button>
                      </div>
                      {/* Label */}
                      <div className="flex items-center gap-3">
                        <Label className="text-xs w-20 shrink-0 text-foreground">Label</Label>
                        <Input
                          value={localStagingConfig.label || ''}
                          onChange={(e) => setLocalStagingConfig(c => ({ ...c, label: e.target.value }))}
                          placeholder="Staging"
                          className="text-sm flex-1"
                        />
                      </div>
                      {/* Icon SVG */}
                      <div className="flex items-start gap-3">
                        <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Icon (SVG)</Label>
                        <div className="flex gap-2 items-start flex-1">
                          <textarea
                            value={localStagingConfig.iconSvg || ''}
                            onChange={(e) => setLocalStagingConfig(c => ({ ...c, iconSvg: e.target.value || undefined }))}
                            placeholder="<svg xmlns=..."
                            className="text-xs font-mono flex-1 min-h-15 resize-y rounded border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                            spellCheck={false}
                          />
                          {localStagingConfig.iconSvg ? (
                            <span className="w-7 h-7 shrink-0 mt-0.5 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: localStagingConfig.iconSvg }} />
                          ) : (
                            <TbListCheck className="w-7 h-7 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                      {/* Style */}
                      <div className="flex items-start gap-3">
                        <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Style</Label>
                        <div className="flex flex-wrap gap-2">
                          {(['tab', 'primary', 'outline', 'ghost'] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setLocalStagingConfig(c => ({ ...c, variant: v }))}
                              className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${(localStagingConfig.variant || 'tab') === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="flex items-center gap-3">
                        <Label className="text-xs w-20 shrink-0 text-foreground">Preview</Label>
                        <div className="flex items-center h-10 border border-dashed border-border rounded px-4 bg-accent/20 gap-2">
                          <StagingTabButtonPreview stagingConfig={localStagingConfig} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional plugin buttons */}
                {localRightNavPlugins.map((btn, i) => (
                  <div key={i} className="border border-border rounded bg-background">
                    <div className="flex items-center gap-3 p-3">
                      {btn.iconSvg ? (
                        <span className="w-5 h-5 shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: btn.iconSvg }} />
                      ) : (
                        <TbPuzzle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{btn.label || btn.plugin}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">plugin: {btn.plugin}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedRightNavItem(expandedRightNavItem === i ? null : i)}
                        className="h-8 w-8 shrink-0"
                      >
                        {expandedRightNavItem === i ? <TbChevronUp className="w-4 h-4" /> : <TbPencil className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocalRightNavPlugins(prev => prev.filter((_, idx) => idx !== i))}
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      >
                        <TbTrash className="w-4 h-4" />
                      </Button>
                    </div>
                    {expandedRightNavItem === i && (
                      <div className="border-t border-border p-3 flex flex-col gap-3">
                        {/* Label */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs w-20 shrink-0 text-foreground">Label</Label>
                          <Input
                            value={btn.label || ''}
                            onChange={(e) => setLocalRightNavPlugins(prev => prev.map((b, idx) => idx === i ? { ...b, label: e.target.value } : b))}
                            placeholder={btn.plugin}
                            className="text-sm flex-1"
                          />
                        </div>
                        {/* Icon SVG */}
                        <div className="flex items-start gap-3">
                          <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Icon (SVG)</Label>
                          <div className="flex gap-2 items-start flex-1">
                            <textarea
                              value={btn.iconSvg || ''}
                              onChange={(e) => setLocalRightNavPlugins(prev => prev.map((b, idx) => idx === i ? { ...b, iconSvg: e.target.value || undefined } : b))}
                              placeholder="<svg xmlns=..."
                              className="text-xs font-mono flex-1 min-h-15 resize-y rounded border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                              spellCheck={false}
                            />
                            {btn.iconSvg ? (
                              <span className="w-7 h-7 shrink-0 mt-0.5 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: btn.iconSvg }} />
                            ) : (
                              <span className="w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center rounded border border-dashed border-border">
                                <TbPuzzle className="w-4 h-4 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Style */}
                        <div className="flex items-start gap-3">
                          <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Style</Label>
                          <div className="flex flex-wrap gap-2">
                            {(['tab', 'primary', 'outline', 'ghost'] as const).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setLocalRightNavPlugins(prev => prev.map((b, idx) => idx === i ? { ...b, variant: v } : b))}
                                className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${(btn.variant || 'tab') === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add button / plugin picker */}
              {!showRightNavPluginPicker ? (
                <Button variant="outline" size="sm" className="w-fit" onClick={() => setShowRightNavPluginPicker(true)}>
                  <TbPlus className="w-4 h-4 mr-2" />
                  Add Button
                </Button>
              ) : (
                <div className="flex flex-col gap-2 border border-border rounded p-3">
                  <div className="relative">
                    <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search plugins..."
                      value={rightNavSearchTerm}
                      onChange={(e) => setRightNavSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col max-h-48 overflow-y-auto">
                    {pluginsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Spinner size={20} />
                      </div>
                    ) : filteredRightNavPlugins.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">
                        {rightNavSearchTerm ? 'No plugins found' : 'No plugins available'}
                      </p>
                    ) : (
                      filteredRightNavPlugins.map((plugin) => (
                        <button
                          key={plugin.id}
                          onClick={() => {
                            setLocalRightNavPlugins(prev => [...prev, { plugin: plugin.slug, label: plugin.name }])
                            setShowRightNavPluginPicker(false)
                            setRightNavSearchTerm('')
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left"
                        >
                          {plugin.image ? (
                            <img src={plugin.image} alt={plugin.name} className="w-8 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs text-muted-foreground">{plugin.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{plugin.name}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">{plugin.slug}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setShowRightNavPluginPicker(false); setRightNavSearchTerm('') }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prototype Tabs Tab */}
          {activeDialogTab === 'tabs' && (
            <>
              {localTabs.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="custom-tabs" renderClone={(provided, snapshot, rubric) => {
                    const tab = localTabs[rubric.source.index]
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                        className="flex items-center gap-3 p-4 border border-border rounded bg-background shadow-lg opacity-90"
                      >
                        <TbGripVertical className="w-5 h-5 text-muted-foreground" />
                        {tab?.type === 'builtin' && (
                          <div className="text-muted-foreground">
                            {getBuiltinIcon(tab.key)}
                          </div>
                        )}
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tab?.label}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {tab?.type === 'builtin' ? `builtin: ${tab.key}` : `plugin: ${tab.plugin}`}
                          </p>
                        </div>
                      </div>
                    )
                  }}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col gap-2"
                      >
                        {localTabs.map((tab, index) => {
                          const draggableId = tab.type === 'builtin' ? `builtin-${tab.key}` : `custom-${tab.plugin}`
                          return (
                            <Draggable key={draggableId} draggableId={draggableId} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-3 p-4 border border-border rounded bg-background ${snapshot.isDragging ? 'opacity-40' : ''
                                    } ${tab.hidden ? 'opacity-60' : ''}`}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                  >
                                    <TbGripVertical className="w-5 h-5" />
                                  </div>

                                  {/* Icon for builtin tabs */}
                                  {tab.iconSvg ? (
                                    <span
                                      className="inline-flex size-5 [&>svg]:w-full [&>svg]:h-full"
                                      dangerouslySetInnerHTML={{ __html: tab.iconSvg }}
                                    />
                                  ) : tab.type === 'builtin' && (
                                    <div className="text-muted-foreground">
                                      {getBuiltinIcon(tab.key)}
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    {editingIndex === index ? (
                                      <div className="flex flex-col gap-2">
                                        <Label htmlFor={`edit-label-${index}`} className="text-xs">
                                          Tab Label
                                        </Label>
                                        <Input
                                          id={`edit-label-${index}`}
                                          value={editingLabel}
                                          onChange={(e) => setEditingLabel(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit()
                                            if (e.key === 'Escape') handleCancelEdit()
                                          }}
                                          className="text-sm"
                                          autoFocus
                                        />
                                        <Label htmlFor={`edit-svg-${index}`} className="text-xs mt-1">
                                          Custom Icon (SVG)
                                        </Label>
                                        <div className="flex gap-2 items-start">
                                          <textarea
                                            id={`edit-svg-${index}`}
                                            value={editingIconSvg}
                                            onChange={(e) => setEditingIconSvg(e.target.value)}
                                            placeholder="<svg xmlns=&quot;...&quot;>...</svg>"
                                            className="text-xs font-mono flex-1 min-h-15 resize-y rounded border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring"
                                            spellCheck={false}
                                          />
                                          {editingIconSvg.trim() ? (
                                            <span
                                              className="w-7 h-7 shrink-0 mt-0.5 [&>svg]:w-full [&>svg]:h-full"
                                              dangerouslySetInnerHTML={{ __html: editingIconSvg }}
                                            />
                                          ) : (
                                            <span className="w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center rounded border border-dashed border-border">
                                              <TbPuzzle className="w-4 h-4 text-muted-foreground" />
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {tab.label}
                                          </p>
                                          {tab.type === 'builtin' && (
                                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                              Built-in
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                          {tab.type === 'builtin' ? `builtin: ${tab.key}` : `plugin: ${tab.plugin}`}
                                        </p>

                                      </>
                                    )}
                                  </div>

                                  {/* Visibility Toggle */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleToggleHidden(index)}
                                      className="h-8 w-8"
                                      disabled={tab.type === 'builtin' && tab.key !== 'overview'}
                                      title={tab.hidden ? 'Show tab' : 'Hide tab'}
                                    >
                                      {tab.hidden ? (
                                        <TbEyeOff className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <TbEye className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    {editingIndex === index ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={handleSaveEdit}
                                          className="h-8 w-8"
                                        >
                                          <TbCheck className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={handleCancelEdit}
                                          className="h-8 w-8"
                                        >
                                          <TbX className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleStartEdit(index)}
                                          className="h-8 w-8"
                                        >
                                          <TbPencil className="w-4 h-4" />
                                        </Button>
                                        {tab.type === 'custom' && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemove(index)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                          >
                                            <TbTrash className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </>
                                    )}
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
              ) : (
                <div className="flex items-center justify-center p-8 border border-dashed border-border rounded">
                  <p className="text-sm text-muted-foreground">No custom tabs added yet</p>
                </div>
              )}

            </>
          )}

          {/* Tab Style Panel */}
          {activeDialogTab === 'style' && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Choose the visual style applied to all prototype tab buttons.
              </p>
              <div className="gap-3 grid grid-cols-[auto_1fr]">
                <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Tab Style</Label>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {(['tab', 'primary', 'outline', 'ghost'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLocalTabsVariant(v)}
                        className={`px-3 py-1 text-xs rounded border capitalize transition-colors ${localTabsVariant === v
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-accent'
                          }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Preview */}
                <Label className="text-xs w-20 shrink-0 text-foreground mt-1">Preview</Label>

                <div className="flex items-center h-10 border border-dashed border-border rounded px-3 bg-accent/20 gap-1">
                  {(['Overview', 'Code', 'Plugin'] as const).map((lbl, i) => {
                    const isActive = i === 0
                    const base = 'flex items-center text-xs font-semibold px-2.5 py-1 transition-colors'
                    let cls = ''
                    if (localTabsVariant === 'primary') {
                      cls = isActive ? `${base} bg-primary text-primary-foreground rounded-md` : `${base} text-muted-foreground hover:bg-accent rounded-md`
                    } else if (localTabsVariant === 'outline') {
                      cls = isActive ? `${base} border border-primary text-primary rounded-md` : `${base} border border-transparent text-muted-foreground hover:bg-accent rounded-md`
                    } else if (localTabsVariant === 'ghost') {
                      cls = isActive ? `${base} bg-accent text-foreground rounded-md` : `${base} text-muted-foreground rounded-md`
                    } else {
                      cls = isActive ? `${base} border-b-2 border-primary text-primary h-full` : `${base} border-b-2 border-transparent text-muted-foreground h-full`
                    }
                    return <button key={lbl} className={cls}>{lbl}</button>
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomTabEditor
