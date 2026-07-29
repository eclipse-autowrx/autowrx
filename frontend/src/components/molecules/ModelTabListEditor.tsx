// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Button } from '@/components/atoms/button'
import {
  Dialog,
  DialogContent,
} from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import AddonSelect from '@/components/molecules/AddonSelect'
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
  TbTrash,
  TbX,
} from 'react-icons/tb'
import { toast } from 'react-toastify'

interface ModelTabListEditorProps {
  tabs: TabConfig[]
  onTabsChange: (tabs: TabConfig[]) => void
  description?: string
  showHeader?: boolean
  /**
   * When provided, Add/Change Plugin calls this instead of opening an internal
   * dialog (so parents can render AddonSelect as a sibling Dialog).
   */
  onRequestAddonSelect?: (changingPluginIndex: number | null) => void
}

export interface ModelTabListEditorHandle {
  flushPendingEdit: () => TabConfig[] | null
}

const DEFAULT_DESCRIPTION =
  'Configure custom tabs on the model detail page, each linked to a plugin addon.'

export function getModelTabExcludedSlugs(
  tabs: TabConfig[],
  changingPluginIndex: number | null,
): string[] {
  return tabs
    .filter(
      (tab, i) =>
        i !== changingPluginIndex &&
        tab.type === 'custom' &&
        !!tab.plugin,
    )
    .map((tab) => tab.plugin as string)
}

export function applyModelTabAddonSelect(
  tabs: TabConfig[],
  plugin: Plugin,
  label: string,
  changingPluginIndex: number | null,
): TabConfig[] | 'duplicate' {
  const pluginExists = tabs.some(
    (tab, i) =>
      i !== changingPluginIndex &&
      tab.type === 'custom' &&
      tab.plugin === plugin.slug,
  )
  if (pluginExists) return 'duplicate'

  if (changingPluginIndex !== null) {
    const updatedTabs = [...tabs]
    updatedTabs[changingPluginIndex] = {
      ...updatedTabs[changingPluginIndex],
      type: 'custom',
      plugin: plugin.slug,
    }
    return updatedTabs
  }

  return [
    ...tabs,
    { type: 'custom' as const, label, plugin: plugin.slug },
  ]
}

export interface ModelTabAddonSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tabs: TabConfig[]
  changingPluginIndex: number | null
  onSelect: (plugin: Plugin, label: string) => void
}

export function ModelTabAddonSelectDialog({
  open,
  onOpenChange,
  tabs,
  changingPluginIndex,
  onSelect,
}: ModelTabAddonSelectDialogProps) {
  const isChanging = changingPluginIndex !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <AddonSelect
          onSelect={onSelect}
          onCancel={() => onOpenChange(false)}
          description={
            isChanging
              ? 'Choose an addon to replace the current one'
              : 'Choose an addon to add to your model tabs'
          }
          confirmLabel={isChanging ? 'Save' : 'Add to Tabs'}
          skipLabelStep={isChanging}
          excludedSlugs={getModelTabExcludedSlugs(tabs, changingPluginIndex)}
        />
      </DialogContent>
    </Dialog>
  )
}

const ModelTabListEditor = forwardRef<
  ModelTabListEditorHandle,
  ModelTabListEditorProps
>(
  (
    {
      tabs,
      onTabsChange,
      description = DEFAULT_DESCRIPTION,
      showHeader = true,
      onRequestAddonSelect,
    },
    ref,
  ) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editingLabel, setEditingLabel] = useState('')
    const [changingPluginIndex, setChangingPluginIndex] = useState<
      number | null
    >(null)
    const [openAddonSelect, setOpenAddonSelect] = useState(false)

    const usesExternalAddonSelect = !!onRequestAddonSelect

    const clearEditState = () => {
      setEditingIndex(null)
      setEditingLabel('')
    }

    const closeAddonSelect = () => {
      setOpenAddonSelect(false)
      setChangingPluginIndex(null)
    }

    useImperativeHandle(ref, () => ({
      flushPendingEdit: (): TabConfig[] | null => {
        if (editingIndex === null) return tabs

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
    }

    const handleSaveEdit = () => {
      if (editingIndex === null || !editingLabel.trim()) return

      const updatedTabs = [...tabs]
      updatedTabs[editingIndex] = {
        ...updatedTabs[editingIndex],
        label: editingLabel.trim(),
      }
      onTabsChange(updatedTabs)
      clearEditState()
    }

    const handleCancelEdit = () => {
      clearEditState()
    }

    const handleRemove = (index: number) => {
      if (tabs[index].type === 'custom') {
        onTabsChange(tabs.filter((_, i) => i !== index))
        if (editingIndex === index) {
          clearEditState()
        }
      }
    }

    const openAddonSelectFor = (index: number | null) => {
      if (usesExternalAddonSelect) {
        onRequestAddonSelect?.(index)
        return
      }
      setChangingPluginIndex(index)
      setOpenAddonSelect(true)
    }

    const handleAddItem = () => {
      openAddonSelectFor(null)
    }

    const handleChangePlugin = (index: number) => {
      openAddonSelectFor(index)
    }

    const handleAddonSelect = (plugin: Plugin, label: string) => {
      const result = applyModelTabAddonSelect(
        tabs,
        plugin,
        label,
        changingPluginIndex,
      )
      if (result === 'duplicate') {
        toast.info('This addon is already added to model tabs')
        return
      }
      onTabsChange(result)
      closeAddonSelect()
    }

    const handleAddonSelectOpenChange = (open: boolean) => {
      if (!open) {
        closeAddonSelect()
        return
      }
      setOpenAddonSelect(true)
    }

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
                                      autoFocus
                                    />
                                    {tab.type === 'custom' && tab.plugin && (
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-muted-foreground font-mono">
                                          plugin: {tab.plugin}
                                        </p>
                                        <Button
                                          type="button"
                                          variant="link"
                                          size="sm"
                                          className="h-auto p-0 text-xs"
                                          onClick={() =>
                                            handleChangePlugin(index)
                                          }
                                        >
                                          Change plugin
                                        </Button>
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
                                      disabled={!editingLabel.trim()}
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

        {!usesExternalAddonSelect && (
          <ModelTabAddonSelectDialog
            open={openAddonSelect}
            onOpenChange={handleAddonSelectOpenChange}
            tabs={tabs}
            changingPluginIndex={changingPluginIndex}
            onSelect={handleAddonSelect}
          />
        )}
      </div>
    )
  },
)

ModelTabListEditor.displayName = 'ModelTabListEditor'

export default ModelTabListEditor
