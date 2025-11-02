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
import { TbGripVertical, TbPencil, TbTrash, TbCheck, TbX } from 'react-icons/tb'

export interface CustomTab {
  label: string
  plugin: string
}

interface CustomTabEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tabs: CustomTab[]
  onSave: (updatedTabs: CustomTab[]) => Promise<void>
  title?: string
  description?: string
}

const CustomTabEditor: FC<CustomTabEditorProps> = ({
  open,
  onOpenChange,
  tabs,
  onSave,
  title = 'Manage Custom Tabs',
  description = 'Edit, reorder, and remove custom tabs',
}) => {
  const [localTabs, setLocalTabs] = useState<CustomTab[]>(tabs)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Update local tabs when dialog opens or tabs change
  useEffect(() => {
    if (open) {
      setLocalTabs(tabs)
      setEditingIndex(null)
      setEditingLabel('')
    }
  }, [open, tabs])

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
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingLabel.trim()) {
      const updatedTabs = [...localTabs]
      updatedTabs[editingIndex] = {
        ...updatedTabs[editingIndex],
        label: editingLabel.trim(),
      }
      setLocalTabs(updatedTabs)
      setEditingIndex(null)
      setEditingLabel('')
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingLabel('')
  }

  const handleRemove = (index: number) => {
    const updatedTabs = localTabs.filter((_, i) => i !== index)
    setLocalTabs(updatedTabs)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localTabs)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tabs:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalTabs(tabs) // Reset to original
    setEditingIndex(null)
    setEditingLabel('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {localTabs.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="custom-tabs" renderClone={(provided, snapshot, rubric) => (
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
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {localTabs[rubric.source.index]?.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {localTabs[rubric.source.index]?.plugin}
                    </p>
                  </div>
                </div>
              )}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-2"
                  >
                    {localTabs.map((tab, index) => (
                      <Draggable key={tab.plugin} draggableId={tab.plugin} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-4 border border-border rounded bg-background ${
                              snapshot.isDragging ? 'opacity-40' : ''
                            }`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                            >
                              <TbGripVertical className="w-5 h-5" />
                            </div>

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
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {tab.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono truncate">
                                    {tab.plugin}
                                  </p>
                                </>
                              )}
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(index)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <TbTrash className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
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
