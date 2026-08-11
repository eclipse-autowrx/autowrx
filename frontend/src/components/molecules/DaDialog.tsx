// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react'
import { DismissableLayerBranch } from '@radix-ui/react-dismissable-layer'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/atoms/dialog'
import { cn } from '@/lib/utils'
import { TbX } from 'react-icons/tb'

interface DaDialogProps {
  children: React.ReactNode
  dialogTitle?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  contentContainerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showCloseButton?: boolean
  onClose?: () => void
  preventOutsideClose?: boolean
  disabled?: boolean
  hideHeaderDivider?: boolean
}

const DaDialog = ({
  children,
  dialogTitle,
  description,
  footer,
  trigger,
  className,
  contentContainerClassName,
  open: controlledOpen,
  onOpenChange,
  showCloseButton = true,
  onClose,
  preventOutsideClose = false,
  disabled = false,
  hideHeaderDivider = false,
}: DaDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = controlledOpen ?? uncontrolledOpen

  const handleOpenChange = (newOpenState: boolean) => {
    if (disabled && newOpenState) return
    if (onOpenChange) {
      onOpenChange(newOpenState)
    } else {
      setUncontrolledOpen(newOpenState)
    }
  }

  const wasOpenRef = useRef(isOpen)
  useEffect(() => {
    if (wasOpenRef.current && !isOpen && onClose) {
      onClose()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, onClose])

  const canClose = showCloseButton

  const isSelectOpen = () =>
    !!document.querySelector('[data-radix-select-content][data-state="open"]')

  const dismissOpenSelects = () => {
    if (!isSelectOpen()) return
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
  }

  const closeDialog = () => {
    dismissOpenSelects()
    handleOpenChange(false)
  }

  const closeButtonClassName =
    'pointer-events-auto text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:outline-none'

  const renderCloseButton = (className: string) => (
    <DismissableLayerBranch>
      <button
        className={cn(closeButtonClassName, className)}
        onClick={closeDialog}
        aria-label="Close"
        type="button"
      >
        <TbX className="w-5 h-5" />
      </button>
    </DismissableLayerBranch>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild disabled={disabled}>
          <div className={cn(disabled && 'opacity-50 cursor-not-allowed pointer-events-none')}>
            {trigger}
          </div>
        </DialogTrigger>
      )}
      <DialogContent
        className={cn('p-0 flex flex-col gap-0 overflow-hidden', className)}
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null
          const selectStillOpen = !!document.querySelector(
            '[data-radix-select-content][data-state="open"]',
          )
          const isSelectSurface = !!target?.closest(
            '[data-radix-select-content], [data-radix-select-viewport]',
          )
          if (selectStillOpen || isSelectSurface) {
            e.preventDefault()
            return
          }
          if (preventOutsideClose) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSelectOpen()) return
          if (preventOutsideClose) e.preventDefault()
        }}
        aria-describedby={undefined}
      >
        {dialogTitle || description ? (
          // Titled dialog: full header zone with inline close button.
          <div
            className={cn(
              'flex items-center justify-between gap-2 px-6 pt-3 shrink-0',
              !hideHeaderDivider && 'border-b border-border pb-3',
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              {dialogTitle && (
                <h2 className="text-base font-semibold text-primary leading-tight">{dialogTitle}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground leading-snug">{description}</p>
              )}
            </div>
            {canClose &&
              renderCloseButton('relative z-[60] shrink-0')}
          </div>
        ) : (
          // Untitled dialog (e.g. self-titled forms): float the close button in the
          // corner with no header bar so it doesn't add an empty title row.
          canClose &&
          renderCloseButton('absolute right-4 top-4 z-[60]')
        )}

        <div
          className={cn(
            'flex-1 overflow-y-auto px-6 py-4',
            // Neutralize a leading top margin on the first rendered child so forms
            // that use `mt-*` for inter-field spacing don't double-pad under the header.
            '[&>*:first-child]:mt-0! [&>form>*:first-child]:mt-0! [&>div>*:first-child]:mt-0!',
            contentContainerClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border px-6 py-4 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default DaDialog
