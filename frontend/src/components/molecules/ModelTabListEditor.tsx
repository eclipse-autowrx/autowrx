// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Spinner } from '@/components/atoms/spinner'
import { TabConfig } from '@/components/organisms/CustomTabEditor'
import { Plugin } from '@/services/plugin.service'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd'
import { forwardRef, useImperativeHandle, useState } from 'react'
import {
  TbCheck,
  TbGripVertical,
  TbPencil,
  TbPlus,
  TbSearch,
  TbTrash,
  TbX,
} from 'react-icons/tb'

interface ModelTabListEditorProps {
  tabs: TabConfig[]
  onTabsChange: (tabs: TabConfig[]) => void
  plugins: Plugin[] | undefined
  pluginsLoading: boolean
  description?: string
  showHeader?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

export interface ModelTabListEditorHandle {
  flushPendingEdit: () => TabConfig[] | null
}

const DEFAULT_DESCRIPTION =
  'Configure custom tabs on the model detail page, each linked to a plugin addon.'

const isIncompleteTabEdit = (
  index: number | null,
  tabList: TabConfig[],
): boolean => {
  if (index === null) return false
  const tab = tabList[index]
  return tab.type === 'custom' && !tab.plugin
}

const ModelTabListEditor = forwardRef<
  ModelTabListEditorHandle,
  ModelTabListEditorProps
>(
  (
    {
      tabs,
      onTabsChange,
      plugins,
      pluginsLoading,
      description = DEFAULT_DESCRIPTION,
      showHeader = true,
      onEditingChange,
    },
    ref,
  ) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editingLabel, setEditingLabel] = useState('')
    const [pluginSearchTerm, setPluginSearchTerm] = useState('')
    const [changingPluginIndex, setChangingPluginIndex] = useState<
      number | null
    >(null)

    const notifyEditingChange = (index: number | null) => {
      onEditingChange?.(isIncompleteTabEdit(index, tabs))
    }

    const clearEditState = () => {
      setEditingIndex(null)
      setEditingLabel('')
      setPluginSearchTerm('')
      setChangingPluginIndex(null)
      onEditingChange?.(false)
    }

    useImperativeHandle(ref, () => ({
      flushPendingEdit: (): TabConfig[] | null => {
        if (editingIndex === null) return tabs

        const tab = tabs[editingIndex]
        if (tab.type === 'custom' && !tab.plugin) return null
        if (!editingLabel.trim()) return null

        const updatedTabs = [...tabs]
        updatedTabs[editingIndex] = {
          ...updatedTabs[editingIndex],
          label: editingLabel.trim(),
        }
        onTabsChange(updatedTabs)
        clearEditState()
        return updatedTabs
      },
    }))

    const getDraggableId = (tab: TabConfig, index: number) =>
      tab.type === 'builtin'
        ? `builtin-${tab.key}`
        : `custom-${tab.plugin ?? `new-${index}`}`

    const handleDragEnd = (result: DropResult) => {
      if (!result.destination) return
      const items = Array.from(tabs)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)
      onTabsChange(items)
    }

    const handleStartEdit = (index: number) => {
      setEditingIndex(index)
      setEditingLabel(tabs[index].label)
      setPluginSearchTerm('')
      setChangingPluginIndex(null)
      notifyEditingChange(index)
    }

    const handleSaveEdit = () => {
      if (editingIndex === null || !editingLabel.trim()) return
      const tab = tabs[editingIndex]
      if (tab.type === 'custom' && !tab.plugin) return

      const updatedTabs = [...tabs]
      updatedTabs[editingIndex] = {
        ...updatedTabs[editingIndex],
        label: editingLabel.trim(),
      }
      onTabsChange(updatedTabs)
      clearEditState()
    }

    const handleCancelEdit = () => {
      if (editingIndex !== null) {
        const tab = tabs[editingIndex]
        if (tab.type === 'custom' && !tab.plugin) {
          onTabsChange(tabs.filter((_, i) => i !== editingIndex))
        }
      }
      clearEditState()
    }

    const handleCancelPluginPicker = () => {
      if (editingIndex === null) return
      const tab = tabs[editingIndex]
      if (tab.type === 'custom' && !tab.plugin) {
        handleCancelEdit()
        return
      }
      setChangingPluginIndex(null)
      setPluginSearchTerm('')
    }

    const handleRemove = (index: number) => {
      if (tabs[index].type === 'custom') {
        onTabsChange(tabs.filter((_, i) => i !== index))
        if (editingIndex === index) {
          clearEditState()
        }
      }
    }

    const handleSelectPlugin = (index: number, plugin: Plugin) => {
      const pluginExists = tabs.some(
        (tab, i) =>
          i !== index && tab.type === 'custom' && tab.plugin === plugin.slug,
      )
      if (pluginExists) return

      const newLabel = plugin.name
      const updatedTabs = [...tabs]
      updatedTabs[index] = {
        ...updatedTabs[index],
        type: 'custom',
        plugin: plugin.slug,
        label: newLabel,
      }
      onTabsChange(updatedTabs)
      setEditingLabel(newLabel)
      setPluginSearchTerm('')
      setChangingPluginIndex(null)
      notifyEditingChange(index)
    }

    const handleAddItem = () => {
      const updatedTabs = [
        ...tabs,
        { type: 'custom' as const, label: '', plugin: '' },
      ]
      onTabsChange(updatedTabs)
      const newIndex = updatedTabs.length - 1
      setEditingIndex(newIndex)
      setEditingLabel('')
      setPluginSearchTerm('')
      setChangingPluginIndex(null)
      onEditingChange?.(true)
    }

    const filteredPlugins =
      plugins?.filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(pluginSearchTerm.toLowerCase()) ||
          plugin.slug?.toLowerCase().includes(pluginSearchTerm.toLowerCase()) ||
          plugin.description
            ?.toLowerCase()
            .includes(pluginSearchTerm.toLowerCase()),
      ) ?? []

    const renderPluginPicker = (index: number) => (
      <div className="flex flex-col gap-2 border border-border rounded p-3 mt-2">
        <div className="relative">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search plugins..."
            value={pluginSearchTerm}
            onChange={(e) => setPluginSearchTerm(e.target.value)}
            className="pl-10 text-sm"
            autoFocus
          />
        </div>
        <div className="flex flex-col max-h-48 overflow-y-auto">
          {pluginsLoading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size={20} />
            </div>
          ) : filteredPlugins.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">
              {pluginSearchTerm ? 'No plugins found' : 'No plugins available'}
            </p>
          ) : (
            filteredPlugins.map((plugin) => {
              const alreadyAdded = tabs.some(
                (tab, i) =>
                  i !== index &&
                  tab.type === 'custom' &&
                  tab.plugin === plugin.slug,
              )
              const isSelected =
                tabs[index]?.type === 'custom' &&
                tabs[index]?.plugin === plugin.slug
              return (
                <button
                  key={plugin.id}
                  type="button"
                  disabled={alreadyAdded}
                  aria-selected={isSelected}
                  onClick={() => handleSelectPlugin(index, plugin)}
                  className={`flex items-center gap-3 p-2 hover:bg-accent rounded transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected ? 'bg-accent' : ''
                  }`}
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
                      {alreadyAdded && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (added)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {plugin.slug}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancelPluginPicker}>
            Cancel
          </Button>
        </div>
      </div>
    )

    return (
      <div className="flex flex-col gap-4">
        {showHeader && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              Model Tabs
            </span>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}

        {tabs.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable
              droppableId="model-tabs"
              renderClone={(provided, _snapshot, rubric) => {
                const tab = tabs[rubric.source.index]
                return (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ ...provided.draggableProps.style }}
                    className="flex items-center gap-3 p-4 border border-border rounded bg-background shadow-lg opacity-90"
                  >
                    <TbGripVertical className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tab?.label}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {tab?.type === 'builtin'
                          ? `builtin: ${tab.key}`
                          : `plugin: ${tab.plugin}`}
                      </p>
                    </div>
                  </div>
                )
              }}
            >
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-2"
                >
                  {tabs.map((tab, index) => {
                    const draggableId = getDraggableId(tab, index)
                    const isEditing = editingIndex === index
                    const showPluginPicker =
                      isEditing &&
                      tab.type === 'custom' &&
                      (!tab.plugin || changingPluginIndex === index)

                    return (
                      <Draggable
                        key={draggableId}
                        draggableId={draggableId}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef}>
                            <div
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-4 border border-border rounded bg-background ${
                                snapshot.isDragging ? 'opacity-40' : ''
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                              >
                                <TbGripVertical className="w-5 h-5" />
                              </div>

                              <div className="flex-1 flex flex-col gap-1 min-w-0">
                                {isEditing ? (
                                  <div className="flex flex-col gap-2">
                                    <Label
                                      htmlFor={`model-tab-label-${index}`}
                                      className="text-xs"
                                    >
                                      Tab Label
                                    </Label>
                                    <Input
                                      id={`model-tab-label-${index}`}
                                      value={editingLabel}
                                      onChange={(e) =>
                                        setEditingLabel(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit()
                                        if (e.key === 'Escape')
                                          handleCancelEdit()
                                      }}
                                      className="text-sm"
                                      autoFocus={changingPluginIndex !== index}
                                    />
                                    {tab.type === 'custom' && tab.plugin && (
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-muted-foreground font-mono">
                                          plugin: {tab.plugin}
                                        </p>
                                        {changingPluginIndex !== index && (
                                          <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs"
                                            onClick={() =>
                                              setChangingPluginIndex(index)
                                            }
                                          >
                                            Change plugin
                                          </Button>
                                        )}
                                      </div>
                                    )}
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
                                      {tab.type === 'builtin'
                                        ? `builtin: ${tab.key}`
                                        : `plugin: ${tab.plugin}`}
                                    </p>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleSaveEdit}
                                      className="h-8 w-8"
                                      disabled={
                                        tab.type === 'custom' && !tab.plugin
                                      }
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
                            {showPluginPicker && renderPluginPicker(index)}
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
            <p className="text-sm text-muted-foreground">
              No tabs configured. Click Add Item.
            </p>
          </div>
        )}

        {editingIndex === null && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleAddItem}
          >
            <TbPlus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
    )
  },
)

ModelTabListEditor.displayName = 'ModelTabListEditor'

export default ModelTabListEditor
