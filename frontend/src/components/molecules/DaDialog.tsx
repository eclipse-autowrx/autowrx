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
import { dismissAllOpenSelects } from '@/lib/selectDismiss'
import { DialogTitle } from '@/components/atoms/dialog'

// Radix Select content uses data-slot / role=listbox — not data-radix-select-content.
const SELECT_OPEN_SELECTOR =
  '[data-slot="select-content"][data-state="open"], [role="listbox"][data-state="open"], [data-radix-select-content][data-state="open"]'
const SELECT_SURFACE_SELECTOR =
  '[data-slot="select-content"], [data-radix-select-content], [data-radix-select-viewport], [data-slot="select-viewport"]'
const SELECT_TRIGGER_SELECTOR =
  '[data-slot="select-trigger"], button[role="combobox"]'

const isSelectOpen = () => !!document.querySelector(SELECT_OPEN_SELECTOR)

const dismissOpenSelects = () => {
  if (!isSelectOpen()) return
  dismissAllOpenSelects()
}

// Singleton listeners — multiple open DaDialogs / StrictMode must not stack handlers.
let selectOutsideDismissSubscribers = 0
let selectOutsideDismissPointerHandler: ((event: PointerEvent) => void) | null =
  null
let selectOutsideDismissKeyHandler: ((event: KeyboardEvent) => void) | null =
  null

const subscribeSelectOutsideDismiss = () => {
  selectOutsideDismissSubscribers += 1
  if (selectOutsideDismissSubscribers === 1) {
    selectOutsideDismissPointerHandler = (event: PointerEvent) => {
      if (!isSelectOpen()) return
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest(SELECT_SURFACE_SELECTOR)) return
      if (target.closest(SELECT_TRIGGER_SELECTOR)) return
      dismissOpenSelects()
    }
    selectOutsideDismissKeyHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (!isSelectOpen()) return
      // Close select; stop dialog from also closing on the same Escape.
      event.preventDefault()
      event.stopPropagation()
      dismissOpenSelects()
    }
    document.addEventListener(
      'pointerdown',
      selectOutsideDismissPointerHandler,
      true,
    )
    document.addEventListener('keydown', selectOutsideDismissKeyHandler, true)
  }
  return () => {
    selectOutsideDismissSubscribers = Math.max(
      0,
      selectOutsideDismissSubscribers - 1,
    )
    if (selectOutsideDismissSubscribers === 0) {
      if (selectOutsideDismissPointerHandler) {
        document.removeEventListener(
          'pointerdown',
          selectOutsideDismissPointerHandler,
          true,
        )
        selectOutsideDismissPointerHandler = null
      }
      if (selectOutsideDismissKeyHandler) {
        document.removeEventListener(
          'keydown',
          selectOutsideDismissKeyHandler,
          true,
        )
        selectOutsideDismissKeyHandler = null
      }
    }
  }
}

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

  useEffect(() => {
    if (!isOpen) return
    return subscribeSelectOutsideDismiss()
  }, [isOpen])

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
          const isSelectSurface = !!target?.closest(SELECT_SURFACE_SELECTOR)
          if (isSelectSurface) {
            e.preventDefault()
            return
          }
          if (isSelectOpen()) {
            e.preventDefault()
            dismissOpenSelects()
            return
          }
          if (preventOutsideClose) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSelectOpen()) {
            e.preventDefault()
            dismissOpenSelects()
            return
          }
          if (preventOutsideClose) e.preventDefault()
        }}
        aria-describedby={undefined}
      >
        {dialogTitle || description ? (
          <div
            className={cn(
              'flex items-center justify-between gap-2 px-6 pt-3 shrink-0',
              !hideHeaderDivider && 'border-b border-border pb-3',
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              {dialogTitle && (
                <DialogTitle className="text-lg font-semibold text-primary leading-tight">{dialogTitle}</DialogTitle>
              )}
              {description && (
                <p className="text-sm text-muted-foreground leading-snug">{description}</p>
              )}
            </div>
            {canClose &&
              renderCloseButton('relative z-[60] shrink-0')}
          </div>
        ) : (
          canClose &&
          renderCloseButton('absolute right-4 top-4 z-[60]')
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div
            className={cn(
              'px-6 py-4',
              // Keep focus rings/shadows inside the scroll content (not on the
              // overflow element) so they are not cropped at the edges.
              '[&>*:first-child]:mt-0! [&>form>*:first-child]:mt-0! [&>div>*:first-child]:mt-0!',
              contentContainerClassName,
            )}
          >
            {children}
          </div>
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
