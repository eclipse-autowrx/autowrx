// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { Button } from '../atoms/button'
import { Input } from '../atoms/input'
import { Textarea } from '../atoms/textarea'
import { Label } from '../atoms/label'
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react'
import DOMPurify from 'dompurify'

export interface NavBarAction {
  label: string
  icon: string // SVG string
  url: string
}

interface NavBarActionsEditorProps {
  value: NavBarAction[]
  onChange: (actions: NavBarAction[]) => void
}

const NavBarActionsEditor: React.FC<NavBarActionsEditorProps> = ({ value, onChange }) => {
  // Local state is needed to handle intermediate updates during editing
  // before propagating changes to the parent component
  const [actions, setActions] = useState<NavBarAction[]>(value || [])

  useEffect(() => {
    setActions(value || [])
  }, [value])

  const handleAddAction = () => {
    const newAction: NavBarAction = {
      label: '',
      icon: '',
      url: '',
    }
    const updatedActions = [...actions, newAction]
    setActions(updatedActions)
    onChange(updatedActions)
  }

  const handleRemoveAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index)
    setActions(updatedActions)
    onChange(updatedActions)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updatedActions = [...actions]
    const temp = updatedActions[index]
    updatedActions[index] = updatedActions[index - 1]
    updatedActions[index - 1] = temp
    setActions(updatedActions)
    onChange(updatedActions)
  }

  const handleMoveDown = (index: number) => {
    if (index === actions.length - 1) return
    const updatedActions = [...actions]
    const temp = updatedActions[index]
    updatedActions[index] = updatedActions[index + 1]
    updatedActions[index + 1] = temp
    setActions(updatedActions)
    onChange(updatedActions)
  }

  const handleUpdateAction = (index: number, field: keyof NavBarAction, value: string) => {
    const updatedActions = [...actions]
    updatedActions[index] = { ...updatedActions[index], [field]: value }
    setActions(updatedActions)
    onChange(updatedActions)
  }

  return (
    <div className="space-y-4">
      {/* Preview and Add Items button at the top */}
      <div className="flex items-start justify-between gap-4 mb-2">
        {actions.length > 0 ? (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-md font-semibold">Preview</Label>
              <Button type="button" onClick={handleAddAction} size="sm" variant="outline" className="shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                Add Items
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap p-2 bg-muted rounded-md border border-border">
              {actions.map((action, index) => (
                <a
                  key={index}
                  href={action.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0 px-1 py-1 rounded-md text-sm font-medium hover:bg-background transition-colors"
                >
                  {action.icon && (
                    <div
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(action.icon, { 
                          USE_PROFILES: { svg: true, svgFilters: true }
                        }) 
                      }}
                      className="w-6 h-6 flex items-center justify-center"
                    />
                  )}
                  {action.label && <span className="ml-1">{action.label}</span>}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <div className="text-sm text-muted-foreground py-2">
              No actions configured. Click "Add Items" to create one.
            </div>
            <Button type="button" onClick={handleAddAction} size="sm" variant="outline" className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Add Items
            </Button>
          </div>
        )}
      </div>

      {actions.map((action, index) => (
        <div key={index} className="border border-border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-md font-medium">Action {index + 1}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                onClick={() => handleMoveUp(index)}
                size="sm"
                variant="ghost"
                disabled={index === 0}
              >
                <MoveUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => handleMoveDown(index)}
                size="sm"
                variant="ghost"
                disabled={index === actions.length - 1}
              >
                <MoveDown className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => handleRemoveAction(index)}
                size="sm"
                variant="ghost"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-2'>

            <div className="w-40">
              <Label className="text-sm mb-1">Label</Label>
              <Input
                type="text"
                value={action.label}
                onChange={(e) => handleUpdateAction(index, 'label', e.target.value)}
              />
            </div>

            <div className='flex-1'>  
              <Label className="text-sm mb-1">URL</Label>
              <Input
                type="url"
                value={action.url}
                onChange={(e) => handleUpdateAction(index, 'url', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1">
              Icon SVG (paste SVG code) 
            {/* SVG Preview */}
            <span className="inline-block align-middle ml-2">
              {action.icon?.trim() ? (
                <span
                  className="w-6 h-6 inline-flex justify-center items-center"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: action.icon }}
                  aria-label="SVG icon preview"
                />
              ) : (
                <span className="w-6 h-6 inline-flex items-center justify-center text-muted-foreground">—</span>
              )}
            </span>
            </Label>
            <Textarea
              value={action.icon}
              onChange={(e) => handleUpdateAction(index, 'icon', e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">...</svg>'
              rows={2}
              className="font-mono text-[7px] leading-[1.2] resize-none py-1 px-2 max-h-20"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default NavBarActionsEditor
