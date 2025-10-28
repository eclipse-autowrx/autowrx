// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * DaTooltip - A wrapper component for easy tooltip usage
 *
 * @example
 * // Simple tooltip
 * <DaTooltip tooltipMessage="This is a tooltip">
 *   <Button>Hover me</Button>
 * </DaTooltip>
 *
 * @example
 * // Tooltip with disabled state
 * <DaTooltip
 *   tooltipMessage="Enabled message"
 *   tooltipDisableMessage="This button is disabled"
 *   disabled={true}
 * >
 *   <Button disabled>Disabled Button</Button>
 * </DaTooltip>
 *
 * @example
 * // Tooltip with custom positioning and delay
 * <DaTooltip
 *   tooltipMessage="Custom tooltip"
 *   side="right"
 *   tooltipDelay={500}
 * >
 *   <span>Hover me</span>
 * </DaTooltip>
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/atoms/tooltip'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DaTooltipProps {
  children: React.ReactElement
  tooltipMessage?: ReactNode
  tooltipDisableMessage?: string
  tooltipDelay?: number
  disabled?: boolean
  className?: string
  tooltipClassName?: string
  tooltipContainerClassName?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const DaTooltip = ({
  children,
  tooltipMessage,
  tooltipDisableMessage,
  tooltipDelay = 300,
  disabled = false,
  className,
  tooltipClassName,
  tooltipContainerClassName,
  side,
}: DaTooltipProps) => {
  const tooltipText =
    disabled && tooltipDisableMessage ? tooltipDisableMessage : tooltipMessage

  if (!tooltipText) {
    return children
  }

  if (disabled) {
    return children
  }

  return (
    <Tooltip delayDuration={tooltipDelay}>
      <TooltipTrigger asChild className={cn('cursor-pointer', className)}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn('z-[9999]', tooltipContainerClassName)}
      >
        <span
          className={cn(
            'text-justify w-fit max-w-sm select-none whitespace-pre-wrap',
            tooltipClassName
          )}
        >
          {tooltipText}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export default DaTooltip
