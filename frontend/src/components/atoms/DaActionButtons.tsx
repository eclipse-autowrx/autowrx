// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Button } from '@/components/atoms/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { TbDotsVertical } from 'react-icons/tb'

export interface ActionButtonItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

interface DaActionButtonsProps {
  actions: ActionButtonItem[]
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  className?: string
}

const DaActionButtons: React.FC<DaActionButtonsProps> = ({
  actions,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  if (!actions || actions.length === 0) {
    return null
  }

  // If only 1 action, show it directly
  if (actions.length === 1) {
    const action = actions[0]
    return (
      <Button
        variant={variant}
        size={size}
        onClick={action.onClick}
        disabled={action.disabled}
        className={className}
      >
        {action.icon}
        <div className="text-sm font-medium">{action.label}</div>
      </Button>
    )
  }

  // If 2 actions, show both directly
  if (actions.length === 2) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={variant}
            size={size}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <div className="text-sm font-medium">{action.label}</div>
          </Button>
        ))}
      </div>
    )
  }

  // If more than 2 actions, show first one and dropdown with rest
  const [firstAction, ...restActions] = actions

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Button
        variant={variant}
        size={size}
        onClick={firstAction.onClick}
        disabled={firstAction.disabled}
      >
        {firstAction.icon}
        <div className="text-sm font-medium">{firstAction.label}</div>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <TbDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {restActions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              <div className="text-sm font-medium">{action.label}</div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default DaActionButtons

