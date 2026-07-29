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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../atoms/select'
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react'
import { TbZoom } from 'react-icons/tb'
import DOMPurify from 'dompurify'

export type NavBarActionType = 'link' | 'search'
export type NavBarActionPosition = 'left' | 'right'
export type NavBarActionOpenTarget = '_blank' | '_self'

export interface NavBarAction {
  type?: NavBarActionType
  label: string
  icon: string // SVG string
  url: string
  placeholder?: string
  position?: NavBarActionPosition
  openTarget?: NavBarActionOpenTarget
}

export const getNavBarActionPosition = (action: NavBarAction): NavBarActionPosition =>
  action.position === 'left' ? 'left' : 'right'

export const getNavBarActionOpenTarget = (action: NavBarAction): NavBarActionOpenTarget =>
  action.openTarget === '_self' ? '_self' : '_blank'

export const partitionNavBarActions = (
  actions: NavBarAction[],
): { left: NavBarAction[]; right: NavBarAction[] } => ({
  left: actions.filter((action) => getNavBarActionPosition(action) === 'left'),
  right: actions.filter((action) => getNavBarActionPosition(action) === 'right'),
})

export const mergeNavBarActions = (
  left: NavBarAction[],
  right: NavBarAction[],
): NavBarAction[] => [
  ...left.map((action) => ({ ...action, position: 'left' as const })),
  ...right.map((action) => ({ ...action, position: 'right' as const })),
]

const NavBarActionPreviewItem: React.FC<{ action: NavBarAction; index: number }> = ({
  action,
  index,
}) => {
  const actionType = action.type || 'link'
  const searchTitle = action.placeholder || action.label || 'Search'

  return (
    <span
      key={index}
      className="flex items-center gap-0 px-1 py-1 rounded-md text-sm font-medium cursor-default"
      title={actionType === 'search' ? searchTitle : action.url || ''}
    >
      {actionType === 'search' ? (
        action.icon ? (
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(action.icon, {
                USE_PROFILES: { svg: true, svgFilters: true }
              })
            }}
            className="w-6 h-6 flex items-center justify-center"
          />
        ) : (
          <TbZoom className="size-6" />
        )
      ) : (
        <>
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
        </>
      )}
    </span>
  )
}

interface NavBarActionsCombinedPreviewProps {
  leftActions: NavBarAction[]
  rightActions: NavBarAction[]
}

const NavBarActionsCombinedPreview: React.FC<NavBarActionsCombinedPreviewProps> = ({
  leftActions,
  rightActions,
}) => {
  if (leftActions.length === 0 && rightActions.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <Label className="text-md font-semibold mb-2 block">Preview</Label>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {leftActions.map((action, index) => (
            <NavBarActionPreviewItem key={`left-${index}`} action={action} index={index} />
          ))}
        </div>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {rightActions.map((action, index) => (
            <NavBarActionPreviewItem key={`right-${index}`} action={action} index={index} />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Left items appear near the logo; right items align to the far end.
      </p>
    </div>
  )
}

interface NavBarActionListEditorProps {
  title: string
  position: NavBarActionPosition
  actions: NavBarAction[]
  onChange: (actions: NavBarAction[]) => void
}

const NavBarActionListEditor: React.FC<NavBarActionListEditorProps> = ({
  title,
  position,
  actions,
  onChange,
}) => {
  const handleAddAction = () => {
    const newAction: NavBarAction = {
      type: 'link',
      label: '',
      icon: '',
      url: '',
      position,
      openTarget: '_blank',
    }
    onChange([...actions, newAction])
  }

  const handleRemoveAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updatedActions = [...actions]
    const temp = updatedActions[index]
    updatedActions[index] = updatedActions[index - 1]
    updatedActions[index - 1] = temp
    onChange(updatedActions)
  }

  const handleMoveDown = (index: number) => {
    if (index === actions.length - 1) return
    const updatedActions = [...actions]
    const temp = updatedActions[index]
    updatedActions[index] = updatedActions[index + 1]
    updatedActions[index + 1] = temp
    onChange(updatedActions)
  }

  const handleUpdateAction = (index: number, field: keyof NavBarAction, value: string) => {
    const updatedActions = [...actions]
    updatedActions[index] = { ...updatedActions[index], [field]: value, position }
    onChange(updatedActions)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-md font-semibold">{title}</Label>
        <Button type="button" onClick={handleAddAction} size="sm" variant="outline" className="shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          Add Items
        </Button>
      </div>

      {actions.length === 0 && (
        <div className="text-sm text-muted-foreground py-2">
          No {title.toLowerCase()} configured. Click &quot;Add Items&quot; to create one.
        </div>
      )}

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
            <div className="w-32">
              <Label className="text-sm mb-1">Type</Label>
              <Select
                value={action.type || 'link'}
                onValueChange={(val) => {
                  const updatedActions = [...actions]
                  updatedActions[index] = {
                    ...updatedActions[index],
                    type: val as NavBarActionType,
                    position,
                    ...(val === 'search' ? { url: '', label: '', openTarget: undefined } : {}),
                    ...(val === 'link' ? { placeholder: '', openTarget: '_blank' as const } : {}),
                  }
                  onChange(updatedActions)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(action.type || 'link') === 'link' && (
              <div className="w-40">
                <Label className="text-sm mb-1">Label</Label>
                <Input
                  type="text"
                  value={action.label}
                  onChange={(e) => handleUpdateAction(index, 'label', e.target.value)}
                />
              </div>
            )}

            {(action.type || 'link') === 'search' && (
              <div className="w-40">
                <Label className="text-sm mb-1">Placeholder</Label>
                <Input
                  type="text"
                  value={action.placeholder ?? ''}
                  placeholder="Search"
                  onChange={(e) => handleUpdateAction(index, 'placeholder', e.target.value)}
                />
              </div>
            )}

            {(action.type || 'link') === 'link' && (
              <div className="w-36">
                <Label className="text-sm mb-1">Open Target</Label>
                <Select
                  value={getNavBarActionOpenTarget(action)}
                  onValueChange={(val) => {
                    handleUpdateAction(index, 'openTarget', val)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_blank">New Tab</SelectItem>
                    <SelectItem value="_self">Same Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(action.type || 'link') === 'link' && (
              <div className='flex-1'>
                <Label className="text-sm mb-1">URL</Label>
                <Input
                  type="url"
                  value={action.url}
                  onChange={(e) => handleUpdateAction(index, 'url', e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm mb-1">
              Icon SVG (paste SVG code)
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

interface NavBarActionsEditorProps {
  value: NavBarAction[]
  onChange: (actions: NavBarAction[]) => void
}

const NavBarActionsEditor: React.FC<NavBarActionsEditorProps> = ({ value, onChange }) => {
  const [leftActions, setLeftActions] = useState<NavBarAction[]>([])
  const [rightActions, setRightActions] = useState<NavBarAction[]>([])

  useEffect(() => {
    const { left, right } = partitionNavBarActions(value || [])
    setLeftActions(left)
    setRightActions(right)
  }, [value])

  const handleLeftChange = (actions: NavBarAction[]) => {
    setLeftActions(actions)
    onChange(mergeNavBarActions(actions, rightActions))
  }

  const handleRightChange = (actions: NavBarAction[]) => {
    setRightActions(actions)
    onChange(mergeNavBarActions(leftActions, actions))
  }

  return (
    <div className="space-y-8">
      <NavBarActionsCombinedPreview
        leftActions={leftActions}
        rightActions={rightActions}
      />
      <NavBarActionListEditor
        title="Left Actions"
        position="left"
        actions={leftActions}
        onChange={handleLeftChange}
      />
      <NavBarActionListEditor
        title="Right Actions"
        position="right"
        actions={rightActions}
        onChange={handleRightChange}
      />
    </div>
  )
}

export default NavBarActionsEditor
