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
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold">Navigation Bar Actions</Label>
        <Button type="button" onClick={handleAddAction} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Action
        </Button>
      </div>

      {actions.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
          No actions configured. Click "Add Action" to create one.
        </div>
      )}

      {actions.map((action, index) => (
        <div key={index} className="border border-border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Action {index + 1}</span>
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

          <div>
            <Label className="text-xs mb-1">Label</Label>
            <Input
              type="text"
              value={action.label}
              onChange={(e) => handleUpdateAction(index, 'label', e.target.value)}
              placeholder="e.g., GitHub Issues"
            />
          </div>

          <div>
            <Label className="text-xs mb-1">URL</Label>
            <Input
              type="url"
              value={action.url}
              onChange={(e) => handleUpdateAction(index, 'url', e.target.value)}
              placeholder="e.g., https://github.com/eclipse-autowrx/autowrx/issues"
            />
          </div>

          <div>
            <Label className="text-xs mb-1">
              Icon SVG (paste SVG code)
            </Label>
            <Textarea
              value={action.icon}
              onChange={(e) => handleUpdateAction(index, 'icon', e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">...</svg>'
              rows={4}
              className="font-mono text-xs resize-none"
            />
          </div>

          {/* Preview */}
          {action.icon && (
            <div className="border-t pt-3">
              <Label className="text-xs mb-2 block">Preview</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <div
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(action.icon, { 
                      USE_PROFILES: { svg: true, svgFilters: true }
                    }) 
                  }}
                  className="w-6 h-6 flex items-center justify-center"
                />
                <span className="text-sm">{action.label || 'Label'}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default NavBarActionsEditor
